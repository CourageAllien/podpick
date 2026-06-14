import Anthropic from '@anthropic-ai/sdk';
import { AGENT_TOOLS, TOOLS_BY_NAME } from '@/lib/agent/tools';
import { buildSystemPrompt } from '@/lib/agent/system-prompt';
import type { AgentContext, AgentEvent } from '@/lib/agent/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';
const MAX_TURNS = 8; // safety bound on the tool-use loop

const TOOL_SCHEMAS: Anthropic.Tool[] = AGENT_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
}));

/** A short, human-readable summary of a tool result for the activity stream. */
function summarizeResult(name: string, result: unknown): { ok: boolean; summary: string } {
  if (result && typeof result === 'object' && 'error' in result) {
    return { ok: false, summary: String((result as { error: unknown }).error) };
  }
  const r = result as Record<string, unknown>;
  if (typeof r?.count === 'number') return { ok: true, summary: `${name}: ${r.count} result(s)` };
  if (Array.isArray(r?.ranked)) return { ok: true, summary: `${name}: ranked ${r.ranked.length}` };
  if (typeof r?.remaining === 'number') return { ok: true, summary: `${name}: ${r.remaining} remaining` };
  return { ok: true, summary: `${name}: done` };
}

/**
 * Runs the tool-use loop for one VA turn and yields events as they happen.
 * Text deltas stream token-by-token; tool calls and their results are emitted
 * around each execution. The caller (SSE route) forwards these to the browser.
 */
export async function* runAgentTurn(
  ctx: AgentContext,
  history: Anthropic.MessageParam[]
): AsyncGenerator<AgentEvent> {
  const system = await buildSystemPrompt(ctx.clientProfileId);
  const messages: Anthropic.MessageParam[] = [...history];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system,
      tools: TOOL_SCHEMAS,
      messages,
    });

    // Stream assistant text as it is produced.
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta' &&
        event.delta.text
      ) {
        yield { type: 'text', text: event.delta.text };
      }
    }

    const final = await stream.finalMessage();
    messages.push({ role: 'assistant', content: final.content });

    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (final.stop_reason !== 'tool_use' || toolUses.length === 0) {
      yield { type: 'done', stopReason: final.stop_reason };
      return;
    }

    // Execute each requested tool and feed results back to the model.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const call of toolUses) {
      yield { type: 'tool_call', id: call.id, name: call.name, input: call.input };

      const tool = TOOLS_BY_NAME.get(call.name);
      let result: unknown;
      if (!tool) {
        result = { error: `Unknown tool: ${call.name}` };
      } else {
        try {
          result = await tool.execute(call.input as Record<string, unknown>, ctx);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : 'Tool execution failed.' };
        }
      }

      const { ok, summary } = summarizeResult(call.name, result);
      yield { type: 'tool_result', id: call.id, name: call.name, ok, summary };

      toolResults.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify(result),
        is_error: !ok,
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  yield { type: 'error', message: 'Reached the maximum number of tool-use steps for one turn.' };
}

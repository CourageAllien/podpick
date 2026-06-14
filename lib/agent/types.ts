/**
 * Agent core types. The orchestrator runs a tool-use loop against Claude with a
 * fixed, audited tool surface (see docs/agent-tool-catalog-v3.md). Each tool is a
 * self-contained module exporting a `ToolDefinition`.
 */

export type AgentRole = 'va' | 'admin';

/**
 * Per-conversation execution context. Scopes every tool to a single client so a
 * tool can never reach across clients — `clientProfileId` is injected by the
 * route, never supplied by the model.
 */
export type AgentContext = {
  clientProfileId: string;
  userId: string; // the VA/admin driving the chat
  role: AgentRole;
};

/** JSON-schema fragment for a tool's input (Anthropic tool-use `input_schema`). */
export type JsonSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
};

export type ToolDefinition<I = Record<string, unknown>, O = unknown> = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  execute: (input: I, ctx: AgentContext) => Promise<O>;
};

/** Events streamed from the orchestrator to the client over SSE. */
export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; ok: boolean; summary: string }
  | { type: 'done'; stopReason: string | null }
  | { type: 'error'; message: string };

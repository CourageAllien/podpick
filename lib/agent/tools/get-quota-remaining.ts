import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

/**
 * Tool 2 — get_quota_remaining
 * How many pitches the client can still generate/send this billing period. The
 * agent must check this before queueing pitches; it can never exceed quota.
 */
export const getQuotaRemaining: ToolDefinition = {
  name: 'get_quota_remaining',
  description:
    "Get the active client's pitch quota for the current billing period: tier, monthly quota, used so far, and remaining. Check this before generating or queueing pitches.",
  inputSchema: { type: 'object', properties: {} },
  async execute(_input, ctx) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clientProfileId, ctx.clientProfileId),
      orderBy: [desc(subscriptions.createdAt)],
    });

    if (!sub) {
      return {
        has_subscription: false,
        message: 'No subscription on file. Client may still be on the unpaid trial.',
        tier: null,
        monthly_quota: 0,
        used_this_period: 0,
        remaining: 0,
      };
    }

    const remaining = Math.max(0, sub.monthlyPitchQuota - sub.pitchesUsedThisPeriod);
    return {
      has_subscription: true,
      tier: sub.tier,
      status: sub.status,
      monthly_quota: sub.monthlyPitchQuota,
      used_this_period: sub.pitchesUsedThisPeriod,
      remaining,
      current_period_start: sub.currentPeriodStart?.toISOString() ?? null,
      current_period_end: sub.currentPeriodEnd?.toISOString() ?? null,
    };
  },
};

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { ONBOARDING_FUNCTIONS } from '@/inngest/functions/onboarding-emails';
import { SEND_PIPELINE_FUNCTIONS } from '@/inngest/functions/send-pitches';
import { FOLLOWUP_FUNCTIONS } from '@/inngest/functions/send-pitch-followup';
import { WEEKLY_PLAN_FUNCTIONS } from '@/inngest/functions/weekly-pitch-plan';
import { MONTHLY_RECAP_FUNCTIONS } from '@/inngest/functions/monthly-recap';
import { RESPONSE_FUNCTIONS } from '@/inngest/functions/classify-response';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...ONBOARDING_FUNCTIONS,
    ...SEND_PIPELINE_FUNCTIONS,
    ...FOLLOWUP_FUNCTIONS,
    ...WEEKLY_PLAN_FUNCTIONS,
    ...MONTHLY_RECAP_FUNCTIONS,
    ...RESPONSE_FUNCTIONS,
  ],
});

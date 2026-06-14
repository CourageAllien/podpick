import { z } from 'zod';

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const REVENUE_RANGES = [
  '$0-100K',
  '$100-300K',
  '$300-500K',
  '$500K-1M',
  '$1-2M',
  '$2M+',
] as const;

export const PODCAST_GOALS = [
  'Build authority / thought leadership',
  'Drive signups / demos',
  'Grow personal brand',
  'Support a launch (book / product / funding)',
  'Recruiting / hiring',
  'Networking with hosts',
] as const;

export const intakeSchema = z.object({
  // Step 1 — Basics
  fullName: z.string().min(1, 'Full name is required'),
  company: z.string().min(1, 'Company is required'),
  website: z.string().url('Enter a valid URL').or(z.literal('')),
  linkedinUrl: z.string().url('LinkedIn URL is required'),
  twitterUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  headshotUrl: z.string().url().or(z.literal('')).optional(),

  // Step 2 — Bio + angles
  oneLineBio: z.string().min(1).max(140, 'Keep it under 140 characters'),
  longBio: z
    .string()
    .min(1)
    .refine((s) => wordCount(s) <= 600, 'Keep your long bio under 600 words'),
  angles: z
    .array(
      z.object({
        title: z.string().min(1, 'Angle title required'),
        description: z
          .string()
          .min(1)
          .refine((s) => wordCount(s) <= 200, 'Keep each angle under 200 words'),
      })
    )
    .length(3, 'Provide exactly three angles'),
  topics: z.string().min(1, 'List at least one topic'), // comma-separated

  // Step 3 — Audience + goals
  targetAudience: z.string().min(1, 'Describe your target audience'),
  goals: z.array(z.string()).min(1, 'Pick at least one goal'),
  goalsNote: z.string().optional(),
  sampleQuestions: z
    .array(z.string().min(1))
    .min(3, 'Provide 3-5 questions')
    .max(5, 'No more than 5'),
  avoidTopics: z.string().optional(),

  // Step 4 — ICP qualifying
  revenueRange: z.enum(REVENUE_RANGES, { required_error: 'Select a revenue range' }),
  yearsInBusiness: z.coerce.number().int().min(0).max(100),
  hasBeenOnPodcast: z.boolean(),
  podcastHistoryLink: z.string().url().or(z.literal('')).optional(),
  publicArtifactUrl: z.string().url('Share a link that captures your thesis'),

  // Step 5 — Past appearances
  pastAppearances: z
    .array(
      z.object({
        podcastName: z.string().min(1),
        episodeUrl: z.string().url().or(z.literal('')).optional(),
        date: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // Step 6 — Sending setup
  unipileAccountId: z.string().optional(),

  // Step 7 — Booking
  bookingLink: z.string().url('Enter your booking link'),
});

export type IntakeValues = z.infer<typeof intakeSchema>;

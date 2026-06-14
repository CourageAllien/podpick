'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { submitIntake, startUnipileConnect } from '@/app/actions/intake';
import {
  intakeSchema,
  type IntakeValues,
  REVENUE_RANGES,
  PODCAST_GOALS,
} from './schema';

const STEPS = [
  'Basics',
  'Bio + angles',
  'Audience + goals',
  'Qualifying',
  'Past appearances',
  'Sending setup',
  'Booking',
];

type FieldName = keyof IntakeValues;
const STEP_FIELDS: FieldName[][] = [
  ['fullName', 'company', 'website', 'linkedinUrl', 'twitterUrl', 'headshotUrl'],
  ['oneLineBio', 'longBio', 'angles', 'topics'],
  ['targetAudience', 'goals', 'goalsNote', 'sampleQuestions', 'avoidTopics'],
  ['revenueRange', 'yearsInBusiness', 'hasBeenOnPodcast', 'podcastHistoryLink', 'publicArtifactUrl'],
  ['pastAppearances'],
  ['unipileAccountId'],
  ['bookingLink'],
];

export function IntakeForm({
  defaultFullName,
  unipileConnected,
}: {
  defaultFullName: string;
  unipileConnected: boolean;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<IntakeValues>({
    resolver: zodResolver(intakeSchema) as Resolver<IntakeValues>,
    defaultValues: {
      fullName: defaultFullName,
      company: '',
      website: '',
      linkedinUrl: '',
      twitterUrl: '',
      headshotUrl: '',
      oneLineBio: '',
      longBio: '',
      angles: [
        { title: '', description: '' },
        { title: '', description: '' },
        { title: '', description: '' },
      ],
      topics: '',
      targetAudience: '',
      goals: [],
      goalsNote: '',
      sampleQuestions: ['', '', ''],
      avoidTopics: '',
      yearsInBusiness: 0,
      hasBeenOnPodcast: false,
      podcastHistoryLink: '',
      publicArtifactUrl: '',
      pastAppearances: [],
      unipileAccountId: unipileConnected ? 'connected' : '',
      bookingLink: '',
    },
  });

  const { register, handleSubmit, trigger, control, watch, setValue, formState } = form;
  const angles = useFieldArray({ control, name: 'angles' });
  const appearances = useFieldArray({ control, name: 'pastAppearances' });
  const questions = watch('sampleQuestions');
  const goals = watch('goals');

  async function next() {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(values: IntakeValues) {
    const res = await submitIntake(values);
    if ('error' in res) {
      toast.error(res.error);
      return;
    }
    setDone(true);
  }

  async function uploadHeadshot(file: File) {
    setUploading(true);
    try {
      const supabase = createSupabaseBrowser();
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
      const { error } = await supabase.storage.from('headshots').upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('headshots').getPublicUrl(path);
      setValue('headshotUrl', data.publicUrl, { shouldValidate: true });
      toast.success('Headshot uploaded');
    } catch (e) {
      toast.error('Upload failed — you can paste a hosted image URL instead.');
    } finally {
      setUploading(false);
    }
  }

  async function connectInbox(provider: 'GOOGLE' | 'OUTLOOK') {
    const res = await startUnipileConnect(provider);
    if ('error' in res) {
      toast.error(res.error);
      return;
    }
    window.location.href = res.url;
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>You are all set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your VA is researching now. Your first pitches go out within 5 business days.
          </p>
          <Button asChild>
            <a href="/app">Go to your dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const err = formState.errors;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <CardTitle>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* STEP 1 — Basics */}
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Full name" error={err.fullName?.message}>
                <Input {...register('fullName')} />
              </Field>
              <Field label="Company" error={err.company?.message}>
                <Input {...register('company')} />
              </Field>
              <Field label="Website" error={err.website?.message}>
                <Input placeholder="https://" {...register('website')} />
              </Field>
              <Field label="LinkedIn URL (required)" error={err.linkedinUrl?.message}>
                <Input placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
              </Field>
              <Field label="Twitter / X URL (optional)" error={err.twitterUrl?.message}>
                <Input placeholder="https://x.com/..." {...register('twitterUrl')} />
              </Field>
              <Field label="Headshot" error={err.headshotUrl?.message}>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  onChange={(e) => e.target.files?.[0] && uploadHeadshot(e.target.files[0])}
                />
                {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                <Input className="mt-2" placeholder="or paste image URL" {...register('headshotUrl')} />
              </Field>
            </div>
          )}

          {/* STEP 2 — Bio + angles */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="One-line bio (max 140 chars)" error={err.oneLineBio?.message}>
                <Input maxLength={140} {...register('oneLineBio')} />
              </Field>
              <Field label="Long bio (max 600 words)" error={err.longBio?.message}>
                <Textarea rows={6} {...register('longBio')} />
              </Field>
              <div className="space-y-3">
                <Label>Three angles you can speak on</Label>
                {angles.fields.map((f, i) => (
                  <div key={f.id} className="rounded-md border p-3">
                    <Input
                      className="mb-2"
                      placeholder={`Angle ${i + 1} title`}
                      {...register(`angles.${i}.title` as const)}
                    />
                    <Textarea
                      rows={3}
                      placeholder="Description (max 200 words)"
                      {...register(`angles.${i}.description` as const)}
                    />
                    {err.angles?.[i] && (
                      <p className="mt-1 text-xs text-destructive">
                        {err.angles[i]?.title?.message || err.angles[i]?.description?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Field label="Topics you can speak on (comma-separated)" error={err.topics?.message}>
                <Input placeholder="growth, bootstrapping, pricing" {...register('topics')} />
              </Field>
            </div>
          )}

          {/* STEP 3 — Audience + goals */}
          {step === 2 && (
            <div className="space-y-4">
              <Field label="Target audience" error={err.targetAudience?.message}>
                <Textarea rows={3} {...register('targetAudience')} />
              </Field>
              <Field label="Goals from podcast guesting" error={(err.goals as { message?: string })?.message}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PODCAST_GOALS.map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={g}
                        checked={goals?.includes(g)}
                        onChange={(e) => {
                          const set = new Set(goals || []);
                          if (e.target.checked) set.add(g);
                          else set.delete(g);
                          setValue('goals', Array.from(set), { shouldValidate: true });
                        }}
                      />
                      {g}
                    </label>
                  ))}
                </div>
                <Textarea className="mt-2" rows={2} placeholder="Anything else? (optional)" {...register('goalsNote')} />
              </Field>
              <Field label="Sample questions you'd love a host to ask (3-5)" error={(err.sampleQuestions as { message?: string })?.message}>
                {questions.map((_, i) => (
                  <Input
                    key={i}
                    className="mb-2"
                    placeholder={`Question ${i + 1}`}
                    {...register(`sampleQuestions.${i}` as const)}
                  />
                ))}
                <div className="flex gap-2">
                  {questions.length < 5 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setValue('sampleQuestions', [...questions, ''])}>
                      Add question
                    </Button>
                  )}
                  {questions.length > 3 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setValue('sampleQuestions', questions.slice(0, -1))}>
                      Remove last
                    </Button>
                  )}
                </div>
              </Field>
              <Field label="Topics to avoid (optional)" error={err.avoidTopics?.message}>
                <Input {...register('avoidTopics')} />
              </Field>
            </div>
          )}

          {/* STEP 4 — ICP qualifying */}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Revenue range" error={err.revenueRange?.message}>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('revenueRange')}
                >
                  <option value="">Select...</option>
                  {REVENUE_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Years in business" error={err.yearsInBusiness?.message}>
                <Input type="number" min={0} {...register('yearsInBusiness')} />
              </Field>
              <Field label="Have you been on a podcast before?" error={err.hasBeenOnPodcast?.message}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('hasBeenOnPodcast')} /> Yes
                </label>
                {watch('hasBeenOnPodcast') && (
                  <Input className="mt-2" placeholder="Link to an episode (optional)" {...register('podcastHistoryLink')} />
                )}
              </Field>
              <Field
                label="Link to a tweet thread, blog post, or talk that captures your thesis"
                error={err.publicArtifactUrl?.message}
              >
                <Input placeholder="https://" {...register('publicArtifactUrl')} />
              </Field>
            </div>
          )}

          {/* STEP 5 — Past appearances */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Optional. Add any past podcast appearances.</p>
              {appearances.fields.map((f, i) => (
                <div key={f.id} className="rounded-md border p-3">
                  <Input className="mb-2" placeholder="Podcast name" {...register(`pastAppearances.${i}.podcastName` as const)} />
                  <Input className="mb-2" placeholder="Episode URL" {...register(`pastAppearances.${i}.episodeUrl` as const)} />
                  <Input type="date" {...register(`pastAppearances.${i}.date` as const)} />
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => appearances.remove(i)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appearances.append({ podcastName: '', episodeUrl: '', date: '' })}
              >
                Add appearance
              </Button>
            </div>
          )}

          {/* STEP 6 — Sending setup */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect the inbox your pitches send from. Replies route straight back to you.
              </p>
              {watch('unipileAccountId') ? (
                <p className="rounded-md bg-secondary p-3 text-sm">Inbox connected.</p>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => connectInbox('GOOGLE')}>
                    Connect Gmail
                  </Button>
                  <Button type="button" variant="outline" onClick={() => connectInbox('OUTLOOK')}>
                    Connect Outlook
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 7 — Booking */}
          {step === 6 && (
            <div className="space-y-4">
              <Field label="Booking link (Cal.com / Calendly / SavvyCal)" error={err.bookingLink?.message}>
                <Input placeholder="https://cal.com/you" {...register('bookingLink')} />
              </Field>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Submitting...' : 'Submit intake'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * PodPick — Framework seed data for SaaS founder ICP
 *
 * These get inserted into ai_frameworks on first run when the primary ICP is
 * bootstrapped SaaS founders. After seed, admin manages via /admin/training/frameworks.
 *
 * Each framework is tagged for step (step1, step2, or either) and has a weight
 * controlling how often it gets pulled by the random framework selector.
 */

export type FrameworkSeed = {
  label: string;
  body: string;
  step: 'step1' | 'step2' | 'either';
  tone: 'professional' | 'casual' | 'sharp';
  useCases: string[];
  weight: number;
};

export const SAAS_FRAMEWORK_SEEDS: FrameworkSeed[] = [
  {
    label: 'The metrics-driven opener',
    step: 'step1',
    tone: 'professional',
    useCases: ['bootstrapped saas', 'founder journey'],
    weight: 3,
    body: `Open by referencing the previous guest's specific numbers, then introduce your own. Example arc:

"Your episode with [previous guest] hit on something specific: he mentioned $40K MRR was where his support load broke. I hit that exact number with [Company] and made the opposite call — I doubled down on self-serve instead of hiring. We went from $40K to $180K MRR in nine months on the same headcount. The mental model that made it work isn't on any of the SaaS podcasts I've heard cover this."

Pattern: their number → your number → divergent decision → outcome → unique angle.`,
  },
  {
    label: 'The bootstrappers counter-take',
    step: 'step1',
    tone: 'sharp',
    useCases: ['bootstrapped saas', 'contrarian operating'],
    weight: 3,
    body: `Open by naming a position the previous guest held, then state your counter cleanly. Example:

"Your episode with [previous guest] argued that bootstrapped SaaS can't scale past $1M ARR without founder-mode pricing. I disagree, and I have the receipts. We've held usage-based pricing through $2.4M ARR and never moved off it. The reason most founders end up at flat-rate isn't that flat-rate is better, it's that they stopped instrumenting their data."

Pattern: name the position → state the disagreement → back it with specific contradicting evidence → diagnose why the conventional wisdom exists.`,
  },
  {
    label: 'The operator-side perspective',
    step: 'step1',
    tone: 'professional',
    useCases: ['execution detail', 'how it actually works'],
    weight: 2,
    body: `Most podcast episodes operate at the strategy layer. Offer to take the conversation to the execution layer. Example:

"Your episode with [previous guest] covered the strategy of usage-based pricing well. The part I haven't heard discussed is the operational layer — how you actually rebuild your billing, support, and CSM motion around it. I rebuilt all three at [Company] over six months. Have specific anti-patterns and what we replaced them with."

Pattern: acknowledge the strategy layer was covered → identify the execution layer gap → claim operator credibility → offer the specific material.`,
  },
  {
    label: 'The market-thesis offer',
    step: 'step1',
    tone: 'sharp',
    useCases: ['contrarian market view', 'industry analysis'],
    weight: 2,
    body: `Offer a contrarian read on the host's niche. Example:

"Your show covers the bootstrapped SaaS space well, but I think the next 18 months break a few assumptions. AI commoditizing back-office tools means the bootstrap-vs-VC question changes shape: the bootstrap path opens up in categories that were unfundable before, and closes in categories where VC just got cheaper. I've been thinking about this for a year and have specific predictions, with the receipts on the ones I've already gotten right."

Pattern: name the niche → state the thesis → preview the depth → demonstrate track record.`,
  },
  {
    label: 'The near-failure narrative',
    step: 'step1',
    tone: 'casual',
    useCases: ['vulnerable story', 'lessons learned'],
    weight: 2,
    body: `Most founder stories pitch the win. The honest version of "almost died" lands harder. Example:

"Your episode with [previous guest] talked about scaling. The version most founders share is the highlight reel. I want to share the version where I almost killed the company at $400K ARR. We had six weeks of runway, two churn cohorts I didn't see coming, and a co-founder conversation that nearly went sideways. The specific decisions that turned it around aren't on any list of 'founder lessons' I've seen."

Pattern: acknowledge the highlight-reel default → offer the honest version → specify the failure conditions → tease the divergent lesson.`,
  },
  {
    label: 'The LinkedIn-thesis hook',
    step: 'step2',
    tone: 'professional',
    useCases: ['host wrote a post', 'linkedin reference'],
    weight: 3,
    body: `Open with a specific post the host wrote on LinkedIn. Example:

"Saw your LinkedIn post last week about why most fractional CFO hires fail before $5M ARR. The line about 'pattern-matching consultants vs operators' is something I've been thinking about from the founder side. I've worked with three fractional CFOs at [Company] — two were pattern-matchers, one was an operator. The difference between what they delivered wasn't even close, and I have a clear read on why."

Pattern: name the specific post → quote a specific line → ground it in the founder's perspective → preview the differentiated material.`,
  },
  {
    label: 'The Substack-essay hook',
    step: 'step2',
    tone: 'professional',
    useCases: ['host writes a newsletter', 'substack reference'],
    weight: 3,
    body: `Open with a specific essay the host published on Substack. Example:

"Your Substack piece on operator-CFO transition kept showing up in my notes app for months. The framework around 'the controller phase is where founders stop watching the books and that's where it breaks' is exactly what happened at [Company] in our second year. I'm in the post-controller, pre-CFO gap now and have a specific question I haven't seen anyone in your audience tackle."

Pattern: name the piece → quote the framework that resonated → ground it in the founder's current situation → set up an unanswered question.`,
  },
  {
    label: 'The career-journey hook',
    step: 'step2',
    tone: 'casual',
    useCases: ['host had a career arc', 'journey reference'],
    weight: 2,
    body: `Open by referencing something specific about the host's career path. Example:

"Saw on your LinkedIn that you went from controller at [previous co] to fractional CFO consulting to launching this podcast. The transition piece — controller to consultant — is where I think you have a perspective most founders never get to hear. I've been the founder on the other side of that arc three times. Specifically what I'd want to talk through is the difference between hiring you and hiring 'a CFO'."

Pattern: name the specific journey moves → highlight a transition you find interesting → offer your perspective from the other side → propose specific material.`,
  },
  {
    label: 'The interview-callback hook',
    step: 'step2',
    tone: 'professional',
    useCases: ['host guested on another show', 'interview reference'],
    weight: 2,
    body: `Open by referencing a specific moment from an interview the host gave on another podcast. Example:

"Heard you on [other podcast] last month — the part where you said 'most founders treat finance like a compliance function until it's too late' has been the line I keep referring people to. I'm a founder who treated finance exactly like that until [Company] hit $1M ARR. The story of unwinding that mindset has specific parts I haven't seen covered on your show."

Pattern: name the specific external appearance → quote the moment that stuck → ground it in personal experience → offer the unique material.`,
  },
];

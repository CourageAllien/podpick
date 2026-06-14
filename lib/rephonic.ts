/**
 * PodPick — Rephonic API wrapper with 30-day caching
 *
 * Rephonic provides podcast discovery + audience data. We cache results
 * in our `podcasts` table for 30 days to control API costs.
 */

import { db } from '@/db';
import { podcasts } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

const REPHONIC_BASE = 'https://api.rephonic.com/v1';
const REPHONIC_API_KEY = process.env.REPHONIC_API_KEY!;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days

export type RephonicSearchParams = {
  query?: string;
  categories?: string[];
  country?: string;
  audienceMin?: number;
  audienceMax?: number;
  language?: string;
  limit?: number;
};

export type RephonicSearchResult = {
  rephonicId: string;
  title: string;
  description: string;
  hostName?: string;
  hostEmails?: string[];
  category: string[];
  country: string;
  language: string;
  audienceSizeEstimate?: number;
  rssUrl?: string;
  websiteUrl?: string;
  audienceDemographics?: {
    genderSplit?: { male: number; female: number; nonBinary: number };
    ageRange?: { min: number; max: number; primary: string };
    countryBreakdown?: Record<string, number>;
  };
  recentEpisodes?: Array<{
    title: string;
    pubDate: string;
    description: string;
    audioUrl?: string;
  }>;
};

export async function searchPodcasts(
  params: RephonicSearchParams
): Promise<RephonicSearchResult[]> {
  const queryString = new URLSearchParams();
  if (params.query) queryString.set('q', params.query);
  if (params.categories) queryString.set('categories', params.categories.join(','));
  if (params.country) queryString.set('country', params.country);
  if (params.audienceMin) queryString.set('audience_min', String(params.audienceMin));
  if (params.audienceMax) queryString.set('audience_max', String(params.audienceMax));
  if (params.language) queryString.set('language', params.language);
  queryString.set('limit', String(params.limit || 20));

  const response = await fetch(`${REPHONIC_BASE}/podcasts/search?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${REPHONIC_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Rephonic search failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.results.map(normalizeRephonicResult);
}

export async function getPodcastById(rephonicId: string): Promise<RephonicSearchResult | null> {
  // Check cache first
  const cached = await db.query.podcasts.findFirst({
    where: eq(podcasts.rephonicId, rephonicId),
  });

  if (cached && cached.lastSyncedAt) {
    const age = Date.now() - new Date(cached.lastSyncedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return {
        rephonicId: cached.rephonicId,
        title: cached.title,
        description: cached.description || '',
        hostName: cached.hostName || undefined,
        hostEmails: cached.hostEmails || undefined,
        category: cached.category || [],
        country: cached.country || '',
        language: cached.language || '',
        audienceSizeEstimate: cached.audienceSizeEstimate || undefined,
        rssUrl: cached.rssUrl || undefined,
        websiteUrl: cached.websiteUrl || undefined,
        audienceDemographics: cached.audienceDemographics || undefined,
        recentEpisodes: cached.recentEpisodes || undefined,
      };
    }
  }

  // Fetch fresh
  const response = await fetch(`${REPHONIC_BASE}/podcasts/${rephonicId}`, {
    headers: {
      'Authorization': `Bearer ${REPHONIC_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Rephonic fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const normalized = normalizeRephonicResult(data);

  // Update cache
  if (cached) {
    await db.update(podcasts)
      .set({
        ...normalized,
        lastSyncedAt: new Date(),
      })
      .where(eq(podcasts.rephonicId, rephonicId));
  } else {
    await db.insert(podcasts).values({
      ...normalized,
      lastSyncedAt: new Date(),
    });
  }

  return normalized;
}

function normalizeRephonicResult(raw: any): RephonicSearchResult {
  return {
    rephonicId: raw.id || raw.rephonic_id,
    title: raw.title,
    description: raw.description || '',
    hostName: raw.host_name || raw.host,
    hostEmails: raw.host_emails || raw.contact_emails || [],
    category: raw.categories || raw.category || [],
    country: raw.country || '',
    language: raw.language || 'en',
    audienceSizeEstimate: raw.audience_size || raw.listeners,
    rssUrl: raw.rss_url,
    websiteUrl: raw.website_url,
    audienceDemographics: raw.demographics,
    recentEpisodes: raw.recent_episodes,
  };
}

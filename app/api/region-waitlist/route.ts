import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const limit = await checkRateLimit(`region-waitlist:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (limit.limited) {
    return NextResponse.json(
      { error: 'Too many waitlist attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec ?? 3600) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const input = body as { email?: unknown; region?: unknown };
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const region = typeof input.region === 'string' ? input.region.trim() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!region || region.length > 100) {
    return NextResponse.json({ error: 'Enter a country or region (up to 100 characters).' }, { status: 400 });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return NextResponse.json(
      { error: 'The regional waitlist is not configured yet. Please try again later.' },
      { status: 503 },
    );
  }

  try {
    const redis = new Redis({ url, token });
    const emailHash = createHash('sha256').update(email).digest('hex');
    const result = await redis.set(
      `scoutoff:region-waitlist:${emailHash}`,
      JSON.stringify({ email, region, createdAt: new Date().toISOString() }),
      { nx: true },
    );
    // Do not disclose whether an address already exists in the store.
    if (result === null) {
      return NextResponse.json({ message: 'If this email has not already joined, it has now been added to the waitlist.' });
    }
    return NextResponse.json({ message: 'You are on the waitlist. Thank you for your interest.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save your request right now. Please try again later.' }, { status: 503 });
  }
}

/** @jest-environment node */
import { POST } from '@/app/api/region-waitlist/route';
import { NextRequest } from 'next/server';

const redisSet = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({ set: redisSet })),
}));
jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ limited: false }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/region-waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/region-waitlist', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    redisSet.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('rejects malformed email before touching Redis', async () => {
    const response = await POST(request({ email: 'bad-email', region: 'West Africa' }));
    expect(response.status).toBe(400);
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('returns 503 without claiming success when Redis is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const response = await POST(request({ email: 'player@example.com', region: 'West Africa' }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/not configured/i);
  });

  it('stores a normalized email and region with a one-year expiry', async () => {
    redisSet.mockResolvedValue('OK');
    const response = await POST(request({ email: ' Player@Example.com ', region: ' West Africa ' }));
    expect(response.status).toBe(201);
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringMatching(/^scoutoff:region-waitlist:[a-f0-9]{64}$/),
      expect.stringContaining('"email":"player@example.com"'),
      { nx: true, ex: 60 * 60 * 24 * 365 },
    );
  });

  it('does not disclose whether the email was already registered', async () => {
    redisSet.mockResolvedValue(null);
    const response = await POST(request({ email: 'player@example.com', region: 'West Africa' }));
    expect(response.status).toBe(200);
    expect((await response.json()).message).toMatch(/if this email has not already joined/i);
  });
});

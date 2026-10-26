'use client';

import { useState } from 'react';

export default function RegionWaitlistForm() {
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      const response = await fetch('/api/region-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, region }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not join the waitlist right now.');
      setStatus('success');
      setMessage(result.message || 'You are on the waitlist. Thank you for your interest.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not join the waitlist right now. Please try again.');
    }
  }

  if (status === 'success') {
    return <div role="status" className="mt-3 rounded-lg border border-brand-green/40 bg-brand-green/10 p-4 text-sm text-brand-green">{message}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-brand-green/30 bg-brand-green/5 p-4">
      <div>
        <h3 className="font-semibold text-white">ScoutOff is coming to your region</h3>
        <p className="mt-1 text-sm text-gray-400">Join the regional waitlist and we’ll use your email only to contact you about availability.</p>
      </div>
      <label className="block text-sm text-gray-300" htmlFor="waitlist-region">Country or region
        <input id="waitlist-region" name="region" required maxLength={100} value={region} onChange={(event) => setRegion(event.target.value)} className="input mt-1 w-full" autoComplete="country-name" />
      </label>
      <label className="block text-sm text-gray-300" htmlFor="waitlist-email">Email address
        <input id="waitlist-email" name="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="input mt-1 w-full" autoComplete="email" />
      </label>
      {status === 'error' && <p role="alert" className="text-sm text-red-400">{message}</p>}
      <button type="submit" disabled={status === 'submitting'} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{status === 'submitting' ? 'Joining…' : 'Join waitlist'}</button>
    </form>
  );
}

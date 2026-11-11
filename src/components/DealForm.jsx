import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { LuFileText, LuUpload, LuX, LuLock } from 'react-icons/lu';
import { supabase, PRO_CHECKOUT_URL } from '../lib/supabase.js';
import { toNumber } from '../lib/format.js';

const PLATFORMS = [
  'Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Twitch',
  'Snapchat', 'Facebook', 'Pinterest', 'Podcast', 'Newsletter', 'Other',
];

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'INR', 'NGN', 'GHS', 'KES', 'ZAR',
  'BRL', 'MXN', 'JPY', 'KRW', 'SGD', 'PHP', 'IDR', 'AED', 'SAR', 'TRY', 'PLN', 'SEK', 'CHF',
];

const LOADING_STEPS = [
  'Reading the deal…',
  'Checking for scam signs…',
  'Looking at usage rights and exclusivity…',
  'Working out what you should charge…',
  'Writing your reply…',
];

const MAX_PDF_BYTES = 4 * 1024 * 1024;
const STATS_KEY = 'dealcheck:stats';

export const EXAMPLE_DEAL = `Hi! We love your content 😍 We're Glow Theory, a clean skincare brand, and we'd love you as a brand ambassador.

We're offering $300 for 1 Reel + 3 Stories about our new Vitamin C serum. We'll need the raw footage too.

As part of the deal we get usage rights to the content in perpetuity across all channels including paid ads, and you can't work with any other skincare or beauty brand for 12 months.

Payment is net 90 after the campaign ends. Can you confirm by tomorrow? 🙏`;

const DEFAULT_STATS = {
  platform: 'Instagram',
  followers: '',
  avgViews: '',
  engagementRate: '',
  niche: '',
  country: '',
  currency: 'USD',
  askingPrice: '',
};

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    return saved && typeof saved === 'object' ? { ...DEFAULT_STATS, ...saved } : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable: the form still works */
  }
}

const readPdf = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });

async function describeError(error) {
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status;
    if (status === 404) return { text: "Deal Check isn't switched on yet. Please try again later.", code: null };
    try {
      const body = await error.context.json();
      if (body?.error) return { text: body.error, code: body.code || null };
    } catch {
      /* fall through */
    }
  }
  return { text: "Can't reach Deal Check right now. Please try again.", code: null };
}

export default function DealForm({ onResult }) {
  const [dealText, setDealText] = useState('');
  const [pdf, setPdf] = useState(null); // { name, base64 }
  const [stats, setStats] = useState(loadStats);
  const [checking, setChecking] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null); // { text, code }
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!checking) return undefined;
    setStepIndex(0);
    const id = setInterval(() => setStepIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1)), 6000);
    return () => clearInterval(id);
  }, [checking]);

  const updateStat = (key) => (e) => setStats((s) => ({ ...s, [key]: e.target.value }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError({ text: 'Upload the contract as a PDF, or paste its text instead.', code: null });
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError({ text: 'That PDF is over 4 MB. Paste the key sections instead.', code: null });
      return;
    }
    try {
      setPdf({ name: file.name, base64: await readPdf(file) });
      setError(null);
    } catch {
      setError({ text: "Couldn't read that file. Try another one.", code: null });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (checking) return;
    if (!dealText.trim() && !pdf) {
      setError({ text: "Paste the brand's message or upload their contract first.", code: null });
      return;
    }
    if (!supabase) {
      setError({ text: 'Deal Check isn\'t connected yet. Add your Supabase keys to .env (see README).', code: null });
      return;
    }

    setChecking(true);
    setError(null);
    saveStats(stats);

    const { data, error: invokeError } = await supabase.functions.invoke('deal-check', {
      body: {
        dealText: dealText.trim(),
        pdfBase64: pdf?.base64 || undefined,
        pdfName: pdf?.name || undefined,
        creator: {
          platform: stats.platform,
          followers: toNumber(stats.followers),
          avgViews: toNumber(stats.avgViews),
          engagementRate: toNumber(stats.engagementRate),
          niche: stats.niche.trim() || null,
          country: stats.country.trim() || null,
          currency: stats.currency,
          askingPrice: toNumber(stats.askingPrice),
        },
      },
    });

    setChecking(false);

    if (invokeError) {
      setError(await describeError(invokeError));
      return;
    }
    if (!data?.result) {
      setError({ text: data?.error || 'Something went wrong. Please try again.', code: null });
      return;
    }
    onResult(data);
  };

  return (
    <>
      <form className="deal-form" onSubmit={submit}>
        <section className="card deal-input">
          <div className="label-row">
            <label htmlFor="deal-text" className="label">The brand's message or contract</label>
            {!dealText && (
              <button type="button" className="link-btn" onClick={() => setDealText(EXAMPLE_DEAL)}>
                Try an example
              </button>
            )}
          </div>
          <textarea
            id="deal-text"
            className="textarea"
            value={dealText}
            onChange={(e) => setDealText(e.target.value)}
            placeholder="Paste the DM, email or contract here…"
            rows={11}
            maxLength={40000}
          />
          <div className="upload-row">
            {pdf ? (
              <span className="file-chip">
                <LuFileText aria-hidden="true" /> <span className="file-name">{pdf.name}</span>
                <button type="button" aria-label="Remove PDF" onClick={() => setPdf(null)}>
                  <LuX aria-hidden="true" />
                </button>
              </span>
            ) : (
              <button type="button" className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                <LuUpload aria-hidden="true" /> Upload a contract (PDF)
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onPickFile} hidden />
            <span className="hint"><LuLock aria-hidden="true" /> We never store your deal, only the result.</span>
          </div>
        </section>

        <section className="card stats">
          <h3 className="label">Your numbers</h3>
          <p className="hint">The more you add, the sharper your rate.</p>

          <div className="field">
            <label htmlFor="f-platform">Platform for this deal</label>
            <select id="f-platform" value={stats.platform} onChange={updateStat('platform')}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-followers">Followers</label>
              <input id="f-followers" inputMode="numeric" placeholder="25,000" value={stats.followers} onChange={updateStat('followers')} />
            </div>
            <div className="field">
              <label htmlFor="f-views">Avg. views</label>
              <input id="f-views" inputMode="numeric" placeholder="8,000" value={stats.avgViews} onChange={updateStat('avgViews')} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-er">Engagement %</label>
              <input id="f-er" inputMode="decimal" placeholder="4.5" value={stats.engagementRate} onChange={updateStat('engagementRate')} />
            </div>
            <div className="field">
              <label htmlFor="f-niche">Niche</label>
              <input id="f-niche" placeholder="Beauty" value={stats.niche} onChange={updateStat('niche')} maxLength={80} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-country">Where you're based</label>
              <input id="f-country" placeholder="Canada" value={stats.country} onChange={updateStat('country')} maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="f-currency">Currency</label>
              <select id="f-currency" value={stats.currency} onChange={updateStat('currency')}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="f-ask">What you were going to charge (optional)</label>
            <input id="f-ask" inputMode="decimal" placeholder="500" value={stats.askingPrice} onChange={updateStat('askingPrice')} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={checking}>
            {checking ? 'Checking…' : 'Check this deal'}
          </button>
          <p className="hint center">Free. No account needed for your first check.</p>
        </section>
      </form>

      <div aria-live="polite">
        {checking && (
          <div className="status status-loading">
            <span className="spinner" aria-hidden="true" />
            {LOADING_STEPS[stepIndex]}
          </div>
        )}
        {error && (
          <div className={`status status-error${error.code ? ' is-upsell' : ''}`} role="alert">
            <span>{error.text}</span>
            {error.code === 'signup_required' && (
              <Link to="/login" className="btn btn-primary btn-sm">Create a free account</Link>
            )}
            {error.code === 'limit_reached' && (
              PRO_CHECKOUT_URL
                ? <a href={PRO_CHECKOUT_URL} className="btn btn-primary btn-sm">Go Pro</a>
                : <a href="/#pricing" className="btn btn-primary btn-sm">See Pro</a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

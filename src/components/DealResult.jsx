import { useEffect, useRef, useState } from 'react';
import {
  LuShieldAlert,
  LuFileText,
  LuCopy,
  LuCheck,
  LuArrowLeft,
  LuTriangleAlert,
  LuCircleHelp,
  LuThumbsUp,
  LuMessageSquareText,
} from 'react-icons/lu';
import { formatMoney, VERDICTS } from '../lib/format.js';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  };

  return (
    <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
      {copied ? <LuCheck aria-hidden="true" /> : <LuCopy aria-hidden="true" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function RateComparison({ result }) {
  const { fair_rate: rate, summary } = result;
  const offered = summary.offered_fee;
  const sameCurrency = summary.offered_currency && summary.offered_currency.toUpperCase() === rate.currency;
  if (typeof offered !== 'number' || offered <= 0 || !sameCurrency) return null;

  const mid = (rate.low + rate.high) / 2;
  if (offered < rate.low) {
    const gap = Math.round(((mid - offered) / mid) * 100);
    return (
      <p className="r-compare is-bad">
        They offered <strong>{formatMoney(offered, rate.currency)}</strong>, about {gap}% under a fair fee.
      </p>
    );
  }
  if (offered > rate.high) {
    return (
      <p className="r-compare is-warn">
        They offered <strong>{formatMoney(offered, rate.currency)}</strong>, above the usual range. Make sure it's real.
      </p>
    );
  }
  return (
    <p className="r-compare is-good">
      They offered <strong>{formatMoney(offered, rate.currency)}</strong>, which is within a fair range.
    </p>
  );
}

export default function DealResult({ check, onReset, resetLabel = 'Check another deal' }) {
  const { result } = check;
  const verdict = VERDICTS[result.verdict] || VERDICTS.negotiate;
  const scam = result.scam_risk || { level: 'none', signals: [] };
  const scamWarning = scam.level === 'medium' || scam.level === 'high';
  const counter = result.counter_offer;
  const counterText = counter.subject ? `Subject: ${counter.subject}\n\n${counter.message}` : counter.message;
  const deliverables = result.summary.deliverables || [];

  return (
    <div className="result">
      {onReset && (
        <button type="button" className="btn btn-ghost btn-sm r-back" onClick={onReset}>
          <LuArrowLeft aria-hidden="true" /> {resetLabel}
        </button>
      )}

      <section className={`r-verdict is-${verdict.tone}`} aria-label="Verdict">
        <div className="r-score" aria-label={`Deal score ${result.deal_score} out of 100`}>
          <span className="r-score-num">{result.deal_score}</span>
          <span className="r-score-of">/100</span>
        </div>
        <div>
          <p className="r-verdict-label">{verdict.label}</p>
          <h2 className="r-headline">{result.headline}</h2>
          {result.summary.brand && (
            <p className="r-meta">
              {result.summary.brand}
              {deliverables.length > 0 && ` · ${deliverables.length} deliverable${deliverables.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
      </section>

      {scamWarning && (
        <section className={`r-scam is-${scam.level}`} role="alert">
          <LuShieldAlert aria-hidden="true" />
          <div>
            <h3>{scam.level === 'high' ? 'This looks like a scam' : 'Some scam warning signs'}</h3>
            <ul>
              {scam.signals.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        </section>
      )}

      <div className="r-grid">
        <section className="card r-rate">
          <p className="kicker">What you should charge</p>
          <p className="r-range">
            {formatMoney(result.fair_rate.low, result.fair_rate.currency)}
            <span> – </span>
            {formatMoney(result.fair_rate.high, result.fair_rate.currency)}
          </p>
          <RateComparison result={result} />
          <p className="r-basis">{result.fair_rate.basis}</p>
          <p className="r-confidence">
            Confidence: <strong>{result.fair_rate.confidence}</strong>
            {check.benchmark_sample > 0 && ` · compared with ${check.benchmark_sample} real offers to creators like you`}
          </p>
        </section>

        <section className="card">
          <p className="kicker">What they're asking for</p>
          {deliverables.length > 0 ? (
            <ul className="r-deliverables">
              {deliverables.map((d) => <li key={d}>{d}</li>)}
            </ul>
          ) : (
            <p className="muted">No clear deliverables in the message.</p>
          )}
          <dl className="r-terms">
            {[
              ['Pay', result.summary.payment_terms],
              ['Usage', result.summary.usage_rights],
              ['Exclusivity', result.summary.exclusivity],
              ['Timeline', result.summary.timeline],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || <span className="muted">Not stated</span>}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {result.red_flags.length > 0 && (
        <section className="card">
          <h3 className="section-title"><LuTriangleAlert aria-hidden="true" /> Red flags</h3>
          <ul className="r-flags">
            {result.red_flags.map((f, i) => (
              <li key={`${f.title}-${i}`} className="r-flag">
                <div className="r-flag-head">
                  <span className={`sev is-${f.severity}`}>{f.severity}</span>
                  <h4>{f.title}</h4>
                </div>
                {f.quote && <blockquote>“{f.quote}”</blockquote>}
                <p>{f.why_it_matters}</p>
                <p className="r-ask"><strong>Ask for:</strong> {f.ask_for}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card r-reply">
        <div className="r-card-head">
          <h3 className="section-title"><LuMessageSquareText aria-hidden="true" /> Your reply, ready to send</h3>
          <CopyButton text={counterText} label="Copy reply" />
        </div>
        {counter.subject && <p className="r-subject"><strong>Subject:</strong> {counter.subject}</p>}
        <pre className="r-message">{counter.message}</pre>
      </section>

      <div className="r-grid">
        {result.missing_terms.length > 0 && (
          <section className="card">
            <h3 className="section-title"><LuFileText aria-hidden="true" /> Missing from the deal</h3>
            <ul className="r-list">
              {result.missing_terms.map((m) => (
                <li key={m.term}><strong>{m.term}.</strong> {m.why_it_matters}</li>
              ))}
            </ul>
          </section>
        )}

        {result.questions_for_brand.length > 0 && (
          <section className="card">
            <div className="r-card-head">
              <h3 className="section-title"><LuCircleHelp aria-hidden="true" /> Ask before you sign</h3>
              <CopyButton text={result.questions_for_brand.map((q) => `- ${q}`).join('\n')} />
            </div>
            <ul className="r-list">
              {result.questions_for_brand.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </section>
        )}
      </div>

      {result.good_points.length > 0 && (
        <section className="card">
          <h3 className="section-title"><LuThumbsUp aria-hidden="true" /> What's good about it</h3>
          <ul className="r-list">
            {result.good_points.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </section>
      )}

      <p className="fine-print">
        Deal Check gives guidance, not legal advice. For big or unusual contracts, have a lawyer look before you sign.
      </p>
    </div>
  );
}

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuBadgeDollarSign,
  LuInfinity,
  LuBan,
  LuShieldAlert,
  LuClock,
  LuFileQuestion,
  LuCheck,
  LuClipboardPaste,
  LuScanSearch,
  LuSend,
} from 'react-icons/lu';
import DealForm from '../components/DealForm.jsx';
import DealResult from '../components/DealResult.jsx';
import { PRO_CHECKOUT_URL } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';

const CATCHES = [
  { icon: LuBadgeDollarSign, title: 'Lowball pay', text: 'See what creators your size should earn for the work, not what the brand hopes you\'ll accept.' },
  { icon: LuInfinity, title: 'Forever usage rights', text: 'Spot clauses that let a brand run your face in ads for years without paying again.' },
  { icon: LuBan, title: 'Exclusivity traps', text: 'Catch bans that block you from your whole niche for months, for one small fee.' },
  { icon: LuShieldAlert, title: 'Fake brands and scams', text: '"Pay for shipping", login links, crypto payouts. Know the signs before you reply.' },
  { icon: LuClock, title: 'Slow or vague payment', text: 'Net 90, "after the campaign", no deposit. Ask for terms that get you paid.' },
  { icon: LuFileQuestion, title: 'What\'s missing', text: 'Revision limits, kill fees, posting dates. Get them in writing before you film.' },
];

const STEPS = [
  { icon: LuClipboardPaste, title: 'Paste the deal', text: 'A DM, an email or the full contract as a PDF. Add your numbers if you have them.' },
  { icon: LuScanSearch, title: 'Get the verdict', text: 'Take it, negotiate or walk away, with every red flag quoted from the deal.' },
  { icon: LuSend, title: 'Send the reply', text: 'A counter-offer with your rate and terms, written in the brand\'s own tone.' },
];

const FAQS = [
  {
    q: 'Is this legal advice?',
    a: 'No. Deal Check helps you understand a deal and negotiate it, the way a good manager would. For large or unusual contracts, have a lawyer review them before you sign.',
  },
  {
    q: 'Do you keep my contract?',
    a: 'No. The deal text is read once to make your report and never stored. We keep the result (things like the fee and the verdict) so you can find it later and so rate estimates get better for everyone. Those numbers are only ever shown as totals across many creators.',
  },
  {
    q: 'Which platforms and countries does it work for?',
    a: 'Any. Instagram, TikTok, YouTube, X, LinkedIn, Twitch, podcasts and newsletters, in 24 currencies, anywhere in the world.',
  },
  {
    q: 'How does it work out my rate?',
    a: 'It starts from what brands typically pay per thousand views on your platform and in your niche, then adjusts for engagement, usage rights, exclusivity and your market. As more creators use Deal Check, it also compares against real offers made to creators like you.',
  },
];

export default function Home() {
  const { user, plan } = useAuth();
  const [check, setCheck] = useState(null);
  const topRef = useRef(null);

  const showResult = (data) => {
    setCheck(data);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const reset = () => {
    setCheck(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <>
      <section className="hero" ref={topRef}>
        <div className="container">
          {check ? (
            <>
              <DealResult check={check} onReset={reset} />
              {!user && (
                <div className="card save-prompt">
                  <div>
                    <h3>Keep this report</h3>
                    <p>Create a free account to save your checks and get 3 more every month.</p>
                  </div>
                  <Link to="/login" className="btn btn-primary">Create a free account</Link>
                </div>
              )}
              {user && typeof check.remaining === 'number' && (
                <p className="hint center remaining">
                  {check.remaining} free check{check.remaining === 1 ? '' : 's'} left this month.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="hero-copy">
                <span className="eyebrow">For creators everywhere</span>
                <h1>
                  Is this brand deal <span className="accent">fair?</span>
                </h1>
                <p className="lead">
                  Paste a brand's DM, email or contract. In about a minute you'll see the red flags, what you
                  should really charge, and a reply you can send.
                </p>
                <ul className="hero-proof">
                  <li><LuCheck aria-hidden="true" /> First check free, no sign-up</li>
                  <li><LuCheck aria-hidden="true" /> Any platform, any currency</li>
                  <li><LuCheck aria-hidden="true" /> Spots scam offers</li>
                </ul>
              </div>
              <DealForm onResult={showResult} />
            </>
          )}
        </div>
      </section>

      <section className="section section-alt" id="catches">
        <div className="container">
          <div className="section-head">
            <h2>What Deal Check catches</h2>
            <p className="lead">The stuff brands hope you won't read closely.</p>
          </div>
          <ul className="feature-grid">
            {CATCHES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card feature">
                <span className="icon-tile"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
          </div>
          <ol className="steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="step">
                <span className="step-num">{i + 1}</span>
                <Icon aria-hidden="true" className="step-icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-alt" id="pricing">
        <div className="container">
          <div className="section-head">
            <h2>Pricing</h2>
            <p className="lead">One better deal pays for a year.</p>
          </div>
          <div className="plans">
            <div className="card plan">
              <h3>Free</h3>
              <p className="price"><strong>$0</strong></p>
              <ul>
                <li><LuCheck aria-hidden="true" /> 1 check without an account</li>
                <li><LuCheck aria-hidden="true" /> 3 checks a month with a free account</li>
                <li><LuCheck aria-hidden="true" /> Red flags, scam check, fair rate and reply</li>
              </ul>
              {user ? (
                <Link to="/history" className="btn btn-ghost btn-block">My checks</Link>
              ) : (
                <Link to="/login" className="btn btn-ghost btn-block">Create a free account</Link>
              )}
            </div>
            <div className="card plan plan-featured">
              <span className="plan-badge">For working creators</span>
              <h3>Pro</h3>
              <p className="price"><strong>$9</strong><span>/month</span></p>
              <ul>
                <li><LuCheck aria-hidden="true" /> Unlimited checks</li>
                <li><LuCheck aria-hidden="true" /> Full contract PDFs</li>
                <li><LuCheck aria-hidden="true" /> Every report saved</li>
              </ul>
              {plan === 'pro' ? (
                <span className="btn btn-primary btn-block is-static">You're on Pro</span>
              ) : PRO_CHECKOUT_URL ? (
                <a href={PRO_CHECKOUT_URL} className="btn btn-primary btn-block">Go Pro</a>
              ) : (
                <span className="btn btn-primary btn-block is-static" aria-disabled="true">Coming soon</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container narrow">
          <div className="section-head">
            <h2>Questions</h2>
          </div>
          <div className="faqs">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

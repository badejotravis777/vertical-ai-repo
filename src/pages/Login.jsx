import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LuMail } from 'react-icons/lu';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';

export default function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/history" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Sign-in isn't connected yet. Add your Supabase keys to .env (see README).");
      return;
    }
    setSending(true);
    setError('');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/history` },
    });
    setSending(false);
    if (otpError) setError(otpError.message || "Couldn't send the link. Please try again.");
    else setSent(true);
  };

  return (
    <section className="section">
      <div className="container auth">
        <div className="card auth-card">
          {sent ? (
            <>
              <span className="icon-tile"><LuMail aria-hidden="true" /></span>
              <h1>Check your email</h1>
              <p className="lead">We sent a sign-in link to <strong>{email.trim()}</strong>. Open it on this device to continue.</p>
              <button type="button" className="link-btn" onClick={() => setSent(false)}>Use a different email</button>
            </>
          ) : (
            <>
              <h1>Sign in to Deal Check</h1>
              <p className="lead">Save your reports and get 3 free checks every month. No password: we'll email you a link.</p>
              <form onSubmit={submit} className="auth-form">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                  {sending ? 'Sending…' : 'Email me a sign-in link'}
                </button>
                {error && <p className="status status-error" role="alert">{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

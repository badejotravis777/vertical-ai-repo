import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LuPlus } from 'react-icons/lu';
import DealResult from '../components/DealResult.jsx';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { VERDICTS } from '../lib/format.js';

export default function History() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from('deal_checks')
      .select('id, created_at, title, verdict, deal_score, result')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => setRows(error ? [] : data || []));
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (open) {
    return (
      <section className="section">
        <div className="container">
          <DealResult check={{ ...open, benchmark_sample: 0 }} onReset={() => setOpen(null)} resetLabel="All my checks" />
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="history-head">
          <h1>My checks</h1>
          <Link to="/" className="btn btn-primary btn-sm"><LuPlus aria-hidden="true" /> Check a deal</Link>
        </div>

        {rows === null ? (
          <p className="muted">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card empty">
            <h3>No checks yet</h3>
            <p className="muted">Paste your first brand deal and your report will be saved here.</p>
            <Link to="/" className="btn btn-primary">Check a deal</Link>
          </div>
        ) : (
          <ul className="history-list">
            {rows.map((row) => {
              const v = VERDICTS[row.verdict] || VERDICTS.negotiate;
              return (
                <li key={row.id}>
                  <button type="button" className="history-item" onClick={() => setOpen(row)}>
                    <span className={`history-score is-${v.tone}`}>{row.deal_score}</span>
                    <span className="history-text">
                      <span className="history-title">{row.title || 'Brand deal'}</span>
                      <small>{v.label} · {new Date(row.created_at).toLocaleDateString()}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

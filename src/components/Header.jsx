import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Header() {
  const { user, plan, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="header-logo" aria-label="Deal Check home">
          <Logo />
        </Link>
        <nav className="header-nav" aria-label="Main">
          <a href="/#how" className="nav-link hide-sm">How it works</a>
          <a href="/#pricing" className="nav-link hide-sm">Pricing</a>
          {user ? (
            <>
              <Link to="/history" className="nav-link">My checks{plan === 'pro' && <span className="pro-pill">Pro</span>}</Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo />
        <p>Guidance for creators, not legal advice. For big or unusual contracts, ask a lawyer.</p>
        <p className="muted">© {new Date().getFullYear()} Deal Check</p>
      </div>
    </footer>
  );
}

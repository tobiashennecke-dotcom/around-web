export function PreviewHeader() {
  return (
    <header className="pv-header">
      <div className="container pv-headerInner">
        <a href="#top" className="wordmark" aria-label="AROUND — zurück nach oben">
          ar<span className="o">o</span>und
        </a>
        <nav className="pv-headerNav" aria-label="Preview-Navigation">
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </div>
    </header>
  );
}

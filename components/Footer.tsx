import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer footerV13">
      <div className="container footerBrandRow">
        <div>
          <div className="eyebrow lime">THIS IS AROUND</div>
          <div className="footerStatement">Golf. Weiter gedacht.</div>
        </div>
        <div className="footerDrop" aria-hidden="true"><span className="drop drop--footer" /></div>
      </div>
      <div className="container footerGiant" aria-label="AROUND">THIS IS AROUND.</div>
      <div className="container footerLinks">
        <div className="footerLinkGroup">
          <Link href="/discover">Entdecken</Link>
          <Link href="/search?type=destination">Reisen</Link>
          <Link href="/search?type=story">Stories</Link>
          <Link href="/saved">My Around</Link>
        </div>
        <div className="footerMeta">
          <span>thisisaround.de</span>
          <span>@thisisaround.de</span>
          <span>© AROUND</span>
        </div>
      </div>
    </footer>
  );
}

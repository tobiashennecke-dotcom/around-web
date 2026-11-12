import Link from "next/link";
import { AroundMark } from "./AroundLogo";
import { ContactBand } from "./ContactBand";
import { getContactChannel, getTopicsIndex } from "@/lib/content";

export async function Footer() {
  const [contact, topics] = await Promise.all([getContactChannel(), getTopicsIndex().catch(() => [])]);
  const hasThemes = topics.some(topic => topic.count > 0);
  return (
    <>
    <ContactBand contact={contact} />
    <footer className="footer footerV13">
      <div className="container footerBrandRow">
        <div>
          <div className="eyebrow lime">THIS IS AROUND</div>
          <div className="footerStatement">Golf. Weiter gedacht.</div>
        </div>
        <div className="footerDrop" aria-hidden="true"><AroundMark className="footerMark" /></div>
      </div>
      <div className="container footerGiantWrap"><div className="footerGiant" aria-label="AROUND">THIS IS AROUND.</div></div>
      <div className="container footerLinks">
        <div className="footerLinkGroup">
          <Link href="/discover">Entdecken</Link>
          <Link href="/search?type=destination">Reisen</Link>
          <Link href="/search?type=story">Stories</Link>
          {hasThemes && <Link href="/themen">Themen</Link>}
          <Link href="/saved">My Around</Link>
        </div>
        <div className="footerMeta">
          <span>thisisaround.de</span>
          <span>@thisisaround.de</span>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <span>© AROUND</span>
        </div>
      </div>
    </footer>
    </>
  );
}

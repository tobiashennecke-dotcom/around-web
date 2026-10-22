"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HoleStation } from "@/lib/story-modules";

type Props = {
  holeNumber: number;
  par: number;
  length: number;
  teeLabel?: string;
  placeTitle: string;
  placeHref: string;
  stations: HoleStation[];
  /** y position (0 = top, 1 = bottom) per station, from the height profile. */
  profile: number[];
};

const X0 = 20;
const X1 = 980;

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * "Das Loch" (Story 2.0, spec 14): a course-independent line from tee to
 * flag. The ball follows the scroll, the remaining distance counts down and
 * the stations light up. With reduced motion it is a static diagram.
 */
export function StoryHoleLine({ holeNumber, par, length, teeLabel, placeTitle, placeHref, stations, profile }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isStatic, setIsStatic] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setIsStatic(media.matches);
    syncMotion();
    media.addEventListener?.("change", syncMotion);
    return () => media.removeEventListener?.("change", syncMotion);
  }, []);

  // The section is only as tall as the panel plus the scroll distance the
  // ball needs. The dark background sits on the panel itself, so there is
  // never an empty dark area below the content.
  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    if (isStatic) {
      section.style.height = "";
      return;
    }
    const size = () => {
      const travel = Math.round(Math.min(Math.max(window.innerHeight * 0.7, 360), 720));
      section.style.height = `${sticky.offsetHeight + travel}px`;
    };
    size();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null;
    observer?.observe(sticky);
    window.addEventListener("resize", size);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", size);
    };
  }, [isStatic, narrow]);

  useEffect(() => {
    if (isStatic) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      if (!section || !sticky) return;
      const rect = section.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const travel = Math.max(1, rect.height - sticky.offsetHeight);
      setProgress(Math.min(1, Math.max(0, (top - rect.top) / travel)));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isStatic]);

  // On phones the 1000-unit wide line is drawn taller and with thicker marks,
  // so it stays readable at ~350 px width.
  const k = narrow ? 2.4 : 1;
  const H = narrow ? 420 : 200;
  const xAt = (distance: number) => X0 + ((X1 - X0) * distance) / length;
  const points = stations.map((station, index) => ({ x: xAt(station.distance), y: 18 * k + (H - 36 * k) * (profile[index] ?? 0.5) }));
  const yAt = (x: number) => {
    if (points.length === 0) return H / 2;
    if (x <= points[0].x) return points[0].y;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (x <= b.x) return a.y + (b.y - a.y) * smooth((x - a.x) / Math.max(1, b.x - a.x));
    }
    return points[points.length - 1].y;
  };

  let path = `M ${X0} ${yAt(X0).toFixed(1)}`;
  for (let x = X0 + 10; x <= X1; x += 10) path += ` L ${x} ${yAt(x).toFixed(1)}`;

  const played = progress * length;
  const ballX = xAt(played);
  const ballY = yAt(ballX);
  const rest = Math.max(0, Math.round((length - played) / 5) * 5);
  const flagY = yAt(X1);
  const first = stations[0]?.elevation;
  const lastWithHeight = [...stations].reverse().find(station => typeof station.elevation === "number")?.elevation;
  const heights = typeof first === "number" && typeof lastWithHeight === "number" && first !== lastWithHeight ? ` · ${first} m → ${lastWithHeight} m` : "";

  return (
    <section ref={sectionRef} className={`storyHole ${isStatic ? "storyHole--static" : ""}`} aria-label={`Das Loch: Bahn ${holeNumber}, ${placeTitle}`}>
      <div ref={stickyRef} className="storyHoleSticky">
        <div className="storyHoleHead">
          <div className="storyHoleNumber" aria-hidden="true">{holeNumber}</div>
          <div className="storyHoleIntro">
            <div className="storyHoleEyebrow">Das Loch</div>
            <h3>Bahn {holeNumber}, <Link href={placeHref}>{placeTitle}</Link></h3>
            <p>Par {par} · {length} m{teeLabel ? ` von ${teeLabel}` : ""}{heights}</p>
            <div className="storyHoleRest" aria-live="off">
              {rest > 0 ? <>Noch {rest} m <span>bis zur Fahne</span></> : <>Auf dem Grün</>}
            </div>
          </div>
        </div>
        <svg className="storyHoleLine" viewBox={`0 0 1000 ${H}`} role="img" aria-label={`Linie vom Abschlag zur Fahne, ${length} Meter`}>
          <defs>
            <clipPath id={`storyHoleTrail-${holeNumber}`}><rect x="0" y="0" width={ballX} height={H} /></clipPath>
          </defs>
          <path d={path} className="storyHolePath" strokeWidth={3 * k} />
          <path d={path} className="storyHoleTrail" strokeWidth={4 * k} clipPath={`url(#storyHoleTrail-${holeNumber})`} />
          <rect x={X0 - 12 * k} y={points[0] ? points[0].y - 14 * k : 80} width={24 * k} height={9 * k} className="storyHoleTee" />
          <ellipse cx={X1 - 24 * k} cy={flagY} rx={52 * k} ry={9 * k} className="storyHoleGreen" />
          <line x1={X1} y1={flagY} x2={X1} y2={flagY - 56 * k} className="storyHolePole" strokeWidth={2.5 * k} />
          <path d={`M ${X1} ${flagY - 56 * k} L ${X1 + 24 * k} ${flagY - 48 * k} L ${X1} ${flagY - 40 * k} Z`} className="storyHoleFlag" />
          {points.slice(1, -1).map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={5 * k} className={played >= stations[index + 1].distance ? "storyHoleMark is-on" : "storyHoleMark"} />
          ))}
          <circle cx={ballX} cy={ballY} r={18 * k} className="storyHoleHalo" />
          <circle cx={ballX} cy={ballY} r={10 * k} className="storyHoleBall" strokeWidth={2 * k} />
        </svg>
        <ol className="storyHoleStations" style={{ gridTemplateColumns: `repeat(${Math.max(1, stations.length)}, minmax(0, 1fr))` }}>
          {stations.map(station => (
            <li key={`${station.name}-${station.distance}`} className={played + 0.5 >= station.distance ? "is-on" : undefined}>
              <strong>{station.name}{typeof station.elevation === "number" ? ` · ${station.elevation} m` : ""}</strong>
              <span>{station.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

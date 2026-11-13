"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics/track";
import { contentFromPath } from "@/lib/analytics/events";
import { CONSENT_CHANGED_EVENT, getAnonId, getConsent } from "@/lib/analytics/consent";

const SCROLL_MARKS = [25, 50, 75, 100];
const LINKED_KEY = "around-anon-linked-v1";
const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

function linkAnonymousHistory() {
  if (getConsent() !== "full") return;
  const anonId = getAnonId();
  if (!anonId) return;
  try {
    if (window.sessionStorage.getItem(LINKED_KEY) === anonId) return;
    window.sessionStorage.setItem(LINKED_KEY, anonId);
  } catch {
    // ignore
  }
  void fetch("/api/events/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonId })
  }).catch(() => undefined);
}

/**
 * Page views, content views, story read depth, booking clicks, account
 * creation and the link from anonymous history to the account.
 * All via track(), which respects the visitor's consent.
 */
export function AnalyticsTracker() {
  const pathname = usePathname() || "/";
  const lastPath = useRef<string | null>(null);

  // Page and content views.
  useEffect(() => {
    if (pathname.startsWith("/studio") || pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_viewed");
    const content = contentFromPath(pathname);
    if (content) track("content_viewed", { sourceType: content.sourceType, slug: content.slug });
  }, [pathname]);

  // Story read depth.
  useEffect(() => {
    const content = contentFromPath(pathname);
    if (content?.sourceType !== "story") return;
    const reached = new Set<number>();
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const percent = Math.round((window.scrollY / max) * 100);
      for (const mark of SCROLL_MARKS) {
        if (percent >= mark && !reached.has(mark)) {
          reached.add(mark);
          track("story_read", { sourceType: "story", slug: content!.slug, value: mark });
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Booking and availability clicks (links marked data-track="booking").
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.("a[data-track='booking']");
      if (!anchor) return;
      const content = contentFromPath(window.location.pathname);
      track("booking_clicked", { sourceType: content?.sourceType, slug: content?.slug });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Account creation + linking anonymous history after login.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    function handleUser(user: { id: string; created_at?: string } | null | undefined) {
      if (!user) return;
      const created = user.created_at ? new Date(user.created_at).getTime() : 0;
      const key = `around-account-created-${user.id}`;
      try {
        if (created && Date.now() - created < NEW_ACCOUNT_WINDOW_MS && !window.localStorage.getItem(key)) {
          window.localStorage.setItem(key, "1");
          track("account_created");
        }
      } catch {
        // ignore
      }
      linkAnonymousHistory();
    }

    supabase.auth.getUser().then(({ data }) => handleUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") handleUser(session?.user);
    });
    function onConsent() {
      supabase?.auth.getUser().then(({ data }) => { if (data.user) linkAnonymousHistory(); });
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsent);
    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener(CONSENT_CHANGED_EVENT, onConsent);
    };
  }, []);

  return null;
}

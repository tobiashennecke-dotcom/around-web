"use client";

import { LoginGate } from "./LoginGate";
import { ConsentBanner } from "./ConsentBanner";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { ProfileOnboarding } from "./ProfileOnboarding";

/** Global account, consent and analytics layer (mounted once in the root layout). */
export function AccountLayer() {
  return (
    <>
      <AnalyticsTracker />
      <LoginGate />
      <ProfileOnboarding />
      <ConsentBanner />
    </>
  );
}

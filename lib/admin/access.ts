import "server-only";

/**
 * Admin access is an explicit allowlist from the ADMIN_EMAILS env var
 * (comma-separated). No env value means nobody is admin.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

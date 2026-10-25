/**
 * Main app roles: USER (seeker) | SAATHI (provider) | ADMIN
 * AGENT is marketing partner — separate product, not main app.
 */

export type MainRole = "USER" | "SAATHI" | "ADMIN";
export type AnyRole = MainRole | "AGENT";

export function isAgentRole(role?: string | null): boolean {
  return role === "AGENT";
}

export function isMainAppRole(role?: string | null): boolean {
  return role === "USER" || role === "SAATHI" || role === "ADMIN";
}

/** Agent accounts cannot use seeker/provider features on main app */
export function agentBlockedMessage() {
  return "This email is registered as an Agent partner. Agents use a separate app — not SaathiPro member app.";
}

/** Seeker/provider cannot open agent flows on main app */
export function memberBlockedFromAgentMessage() {
  return "This email is a member account (seeker/provider). Agent partnership uses a separate app and a different signup.";
}

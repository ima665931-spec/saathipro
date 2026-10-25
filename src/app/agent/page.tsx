import Link from "next/link";

/**
 * Agents are NOT part of the main member app.
 * This route only explains separation — no agent dashboard here.
 */
export default function AgentSeparatedPage() {
  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-border rounded-2xl shadow-card p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-brand-gradient text-white flex items-center justify-center font-display font-bold">
          S
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">Agent partners — separate app</h1>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          SaathiPro main app is only for <strong className="text-ink">service seekers</strong> and{" "}
          <strong className="text-ink">service providers (Saathis)</strong>.
        </p>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          Promotion / marketing agents get their own dedicated app. One Gmail = one account type —
          an agent email cannot also be a seeker or provider on this app.
        </p>
        <p className="mt-4 text-xs text-ink-muted">Agent app: coming soon.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="btn-brand py-3 rounded-full text-sm">
            Back to SaathiPro
          </Link>
          <Link href="/register" className="text-sm font-medium text-accent underline">
            Join as seeker / provider
          </Link>
        </div>
      </div>
    </div>
  );
}

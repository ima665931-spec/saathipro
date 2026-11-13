import Link from "next/link";
import { SUPPORT, telegramUrl } from "@/lib/support";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 bg-cream">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-ink-muted">
        <p className="font-display font-bold text-ink mb-1">
          Saathi<span className="text-pink">Pro</span>
        </p>
        <p className="text-xs font-semibold text-accent mb-1">
          Soft launch · {SUPPORT.region}
        </p>
        <p>Professional companionship · Not a dating service</p>

        <div className="mt-4 flex flex-wrap justify-center gap-4 sm:gap-6">
          <Link href="/find" className="hover:text-accent">
            Find
          </Link>
          <Link href="/pricing" className="hover:text-accent">
            Pricing
          </Link>
          <Link href="/become-saathi" className="hover:text-accent">
            Become Saathi
          </Link>
          <Link href="/safety" className="hover:text-accent">
            Safety
          </Link>
          <Link href="/terms" className="hover:text-accent">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-accent">
            Privacy
          </Link>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={telegramUrl("Hi SaathiPro support")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#229ED9] text-white text-sm font-semibold hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.14-.02.22z" />
            </svg>
            Telegram support
          </a>
          <a
            href={`mailto:${SUPPORT.email}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            {SUPPORT.email}
          </a>
        </div>

        <p className="mt-6 text-[11px] text-ink-muted/80">
          © {new Date().getFullYear()} SaathiPro · Soft launch · Features may change
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { SUPPORT, whatsappUrl } from "@/lib/support";

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
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90"
          >
            WhatsApp support
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

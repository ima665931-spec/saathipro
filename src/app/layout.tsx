import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import InstallPrompt from "@/components/InstallPrompt";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const APP_URL = process.env.AUTH_URL || "https://saathipro.site";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "SaathiPro — Professional Social Support",
    template: "%s · SaathiPro",
  },
  description:
    "Book verified professional companions for movies, elder care, hangouts, travel and more. Soft launch Delhi NCR. Safe, consent-first.",
  applicationName: "SaathiPro",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SaathiPro",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon/192", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "SaathiPro",
    title: "SaathiPro — Professional Social Support",
    description:
      "Professional companions for movies, care, hangouts and more. Soft launch Delhi NCR.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#7c3aed" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <SessionProvider>
          {children}
          <InstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}

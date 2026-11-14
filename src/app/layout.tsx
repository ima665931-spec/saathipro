import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import InstallPrompt from "@/components/InstallPrompt";
import StandaloneRedirect from "@/components/StandaloneRedirect";
import AppShell from "@/components/app/AppShell";

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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <SessionProvider>
          <StandaloneRedirect />
          <AppShell>{children}</AppShell>
          <InstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}

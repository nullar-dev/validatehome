import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ValidateHome - Live Home Upgrade Rebates & Incentives",
    template: "%s | ValidateHome",
  },
  description:
    "Real-time status, eligibility, and net-cost calculations for home energy upgrade rebates and incentives in the US, UK, Australia, and Canada.",
  metadataBase: new URL("https://validatehome.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ValidateHome",
  },
  alternates: {
    languages: {
      "en-US": "/programs/us",
      "en-GB": "/programs/uk",
      "en-AU": "/programs/au",
      "en-CA": "/programs/ca",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-foreground"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}

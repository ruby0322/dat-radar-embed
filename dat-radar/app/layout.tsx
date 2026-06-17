import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAT Radar",
  description:
    "B2B embedded mNAV data feed for DAT.co analytics.",
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/">) {
  await params;
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
      >
        {children}
      </body>
    </html>
  );
}

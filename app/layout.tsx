import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: {
    default: "Ghost AI",
    template: "%s | Ghost AI",
  },
  description: "Ghost AI — Build and automate intelligent workflows with AI-powered agents.",
  keywords: ["AI", "workflow automation", "agents", "Ghost AI"],
  authors: [{ name: "Ghost AI" }],
  creator: "Ghost AI",
  metadataBase: new URL("https://ghost-ai.app"),
  openGraph: {
    title: "Ghost AI",
    description: "Build and automate intelligent workflows with AI-powered agents.",
    siteName: "Ghost AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost AI",
    description: "Build and automate intelligent workflows with AI-powered agents.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}

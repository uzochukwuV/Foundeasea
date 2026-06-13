import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const familyDisplay = Fraunces({ variable: "--font-family", subsets: ["latin"], weight: ["500", "600"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "FounderSea | Investor & Builder Command Center",
  description: "AI-ranked idea marketplace, revenue dashboard, and builder reputation layer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${familyDisplay.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
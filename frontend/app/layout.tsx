import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ContractProvider } from "./lib/contracts/provider";

const familyDisplay = Fraunces({ variable: "--font-family", subsets: ["latin"], weight: ["500", "600"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "FounderSea | Investor & Builder Command Center",
  description: "AI-ranked idea marketplace, revenue dashboard, and builder reputation layer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${familyDisplay.variable} ${inter.variable} ${outfit.variable} ${plex.variable} ${mono.variable}`}>
      <body>
        <ContractProvider>
          {children}
        </ContractProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { seedIfEmpty } from "@/lib/seed";
import "./globals.css";

const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Ops",
  description: "Brisbane private car hire operations — replace the spreadsheet.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await seedIfEmpty();
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

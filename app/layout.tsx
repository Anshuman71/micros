import type { Metadata } from "next";

import "./globals.css";
import { IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Micros",
  description:
    "Micros is a tool that helps you track your micronutrients intake.",
  generator: "micros.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.className} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

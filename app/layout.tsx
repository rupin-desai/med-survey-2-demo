import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semaglutide MASH Survey",
  description:
    "Polling survey on Semaglutide prescription patterns in MASH patients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

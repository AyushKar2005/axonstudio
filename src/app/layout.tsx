import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon Studio",
  description:
    "A browser-based neural network lab for visualizing, debugging, comparing, and exporting small ML models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlashProxy Dashboard",
  description: "Reseller dashboard for managing FlashProxy plans.",
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

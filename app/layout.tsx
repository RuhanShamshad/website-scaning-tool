import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Audit",
  description: "Browser-based website quality audits for public websites."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

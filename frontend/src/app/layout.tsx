import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATIRA // B2B PROCUREMENT & ESCROW MULTI-AGENT EXCHANGE",
  description: "Enterprise multi-party agent bargaining channel with automated matching settlement engines and real-time operator overrides.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#fafafa] text-[#111111] h-screen w-screen overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Inter } from 'next/font/google';
import { Web3Provider } from '../contexts/Web3Context';
import { ConnectWalletButton } from '../components/ConnectWalletButton';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Portal Trade - Decentralized Finance Platform",
  description: "A decentralized finance platform where you can supply assets to earn interest or provide collateral to get loans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Web3Provider>
          <header className="py-4 border-b border-[var(--card-border)] sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--pastel-blue)] to-[var(--pastel-pink)] flex items-center justify-center text-white">
                  PT
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--pastel-blue)] to-[var(--pastel-pink)]">
                  Portal Trade
                </span>
              </Link>
              
              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="hover:text-[var(--primary)] transition-colors">
                  Home
                </Link>
                <Link href="/dashboard" className="hover:text-[var(--primary)] transition-colors">
                  Dashboard
                </Link>
                <Link href="/market" className="hover:text-[var(--primary)] transition-colors">
                  Market
                </Link>
                <Link href="/supply" className="hover:text-[var(--primary)] transition-colors">
                  Supply
                </Link>
                <Link href="/borrow" className="hover:text-[var(--primary)] transition-colors">
                  Borrow
                </Link>
              </div>
              
              <ConnectWalletButton />
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
          <footer className="border-t border-[var(--card-border)] py-8 mt-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <Link href="/" className="text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--pastel-blue)] to-[var(--pastel-pink)] flex items-center justify-center text-white">
                      PT
                    </div>
                    Portal Trade
                  </Link>
                </div>
                <div className="flex gap-6">
                  <a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-[var(--primary)] transition-colors">Documentation</a>
                </div>
              </div>
            </div>
          </footer>
        </Web3Provider>
      </body>
    </html>
  );
}

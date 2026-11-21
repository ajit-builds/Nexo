import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Nexo - Tamper-Proof Digital Credential Network',
  description: 'Decentralized verifiable credentials for universities, students, and recruiters on Polygon Amoy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#0071e3] selection:text-white bg-[#f5f5f7] text-[#1d1d1f] min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

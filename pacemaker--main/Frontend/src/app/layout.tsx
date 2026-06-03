import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PaceMaker | The Ultimate Medical LMS',
  description: 'Advanced platform for medical students to prepare for NEET PG, INICET & FMGE.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col pt-16 selection:bg-primary-200 selection:text-primary-900">
        <Navbar />
        <main className="flex-1 flex flex-col relative">
          <div className="absolute inset-0 -z-10 h-full w-full bg-[#fdfbf7] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.05),transparent_40%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_40%)]"></div>
          </div>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

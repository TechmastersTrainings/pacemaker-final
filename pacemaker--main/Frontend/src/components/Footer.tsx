'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide the footer in the admin dashboard or forum page to prevent global window scrolling
  if (pathname.startsWith('/admin') || pathname === '/forum') {
    return null;
  }

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <p className="text-gray-400 font-medium">© 2026 PaceMaker Platform. All rights reserved.</p>
        </div>
        <div className="flex space-x-8">
          <Link href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Privacy Policy</Link>
          <Link href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Terms of Service</Link>
          <Link href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

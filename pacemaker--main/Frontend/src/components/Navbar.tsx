'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, User, Menu, X, LogOut, LayoutDashboard, GraduationCap, Users, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close mobile menu on route changes
    setIsMobileMenuOpen(false);

    // Check local storage for user
    const currentUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (currentUser) {
      setUserName(currentUser);
      setUserRole(role);
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    setUserName(null);
    setUserRole(null);
    window.location.href = '/';
  };

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100 py-1' 
        : 'bg-[#fdfbf7]/80 backdrop-blur-md border-b border-gray-200/40 py-2'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary-500" />
              <span className="font-bold text-xl tracking-tight text-gray-900">PaceMaker</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <Link href="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</Link>
            {userName ? (
              <>
                {(userRole === 'instructor' || userRole === 'admin') ? (
                  <Link href="/admin" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Command Center
                  </Link>
                ) : (
                  <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Student Dashboard
                  </Link>
                )}
                <Link href="/forum" className="text-gray-600 hover:text-primary-600 font-medium flex items-center gap-2 transition-colors relative group">
                  <MessageCircle className="w-4.5 h-4.5 text-gray-500 group-hover:text-primary-500 transition-colors" />
                  <span>Community</span>
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm">
                    3
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="#services" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Services</Link>
                <Link href="#courses" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Courses</Link>
                <Link href="#about" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">About Us</Link>
              </>
            )}
            <Link href="/pricing" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {userName ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                  <div className="bg-primary-50 p-2 rounded-full border border-primary-100 shadow-sm">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-tight">Hi, {userName}</span>
                    {userRole && <span className="text-[10px] uppercase font-black text-primary-500 tracking-widest">{userRole}</span>}
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-md"
                  title="Logout from your account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="hidden lg:flex items-center gap-2 border border-gray-200 hover:border-primary-500 hover:bg-white text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
                >
                  <GraduationCap className="h-4 w-4 text-primary-500" /> Student Login
                </Link>
                <Link 
                  href="/login" 
                  className="hidden lg:flex items-center gap-2 border border-gray-200 hover:border-primary-500 hover:bg-white text-gray-700 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
                >
                  <Users className="h-4 w-4 text-primary-500" /> Instructor Login
                </Link>
              </div>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-primary-600 p-2 rounded-xl hover:bg-gray-150 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md overflow-hidden pb-6 pt-4"
          >
            <div className="flex flex-col space-y-4 px-4">
              <Link href="/" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">Home</Link>
              {userName ? (
                <>
                  {(userRole === 'instructor' || userRole === 'admin') ? (
                    <Link href="/admin" className="text-primary-600 hover:text-primary-750 font-bold px-3 py-2 rounded-xl hover:bg-primary-50/50 transition-all flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Command Center
                    </Link>
                  ) : (
                    <Link href="/dashboard" className="text-primary-600 hover:text-primary-750 font-bold px-3 py-2 rounded-xl hover:bg-primary-50/50 transition-all flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Student Dashboard
                    </Link>
                  )}
                  <Link href="/forum" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Community
                  </Link>
                </>
              ) : (
                <>
                  <Link href="#services" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">Services</Link>
                  <Link href="#courses" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">Courses</Link>
                  <Link href="#about" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">About Us</Link>
                </>
              )}
              <Link href="/pricing" className="text-gray-600 hover:text-primary-600 font-bold px-3 py-2 rounded-xl hover:bg-gray-50 transition-all">Pricing</Link>
              
              {/* Auth section */}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                {userName ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-50 p-2 rounded-full border border-primary-100 shadow-sm">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 leading-tight">Hi, {userName}</span>
                        {userRole && <span className="text-[10px] uppercase font-black text-primary-500 tracking-widest">{userRole}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-sm font-bold transition-all duration-300 border border-red-100"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link 
                      href="/login" 
                      className="flex items-center justify-center gap-2 border border-gray-200 hover:border-primary-500 hover:bg-white text-gray-700 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                    >
                      <GraduationCap className="h-4 w-4 text-primary-500" /> Student Login
                    </Link>
                    <Link 
                      href="/login" 
                      className="flex items-center justify-center gap-2 border border-gray-200 hover:border-primary-500 hover:bg-white text-gray-700 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                    >
                      <Users className="h-4 w-4 text-primary-500" /> Instructor Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

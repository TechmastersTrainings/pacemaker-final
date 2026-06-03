'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Video, Database, 
  ClipboardList, BarChart, Settings, 
  BookOpen, Trophy, Clock
} from 'lucide-react';

export default function StudyMaterialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem('currentUser') || 'Student');
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Video, label: 'Live Ecosystem', href: '/dashboard/live' },
    { icon: Database, label: 'Question Bank', href: '/dashboard/qbank' },
    { icon: ClipboardList, label: 'Exam Builder', href: '/dashboard/exams' },
    { icon: BookOpen, label: 'Study Material', href: '/study-material' },
    { icon: Trophy, label: 'Achievements', href: '/dashboard/achievements' },
    { icon: BarChart, label: 'Performance', href: '/dashboard/performance' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-100 bg-white hidden md:flex flex-col z-10 shadow-sm">
        <div className="p-8 border-b border-gray-50">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary-500/20">
                 {userName?.[0]}
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-black text-gray-900 leading-tight truncate w-32">{userName}</span>
                 <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Medical Student</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Learning Hub</span>
          </div>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href === '/study-material' && pathname.startsWith('/study-material'));
            return (
              <Link 
                key={index}
                href={item.href} 
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold relative group ${
                  isActive 
                    ? 'text-primary-700 bg-primary-50 shadow-sm border border-primary-100/50' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full"></div>
                )}
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                <Clock className="w-3 h-3" /> Study Goal
             </div>
             <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                <div className="bg-primary-500 h-full w-[65%] rounded-full" />
             </div>
             <p className="text-[10px] font-bold text-gray-500">6.5 / 10 Hours Done</p>
          </div>
          <Link href="/settings" className="flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-gray-900 rounded-2xl hover:bg-gray-50 transition-all font-bold">
            <Settings className="w-5 h-5 text-gray-400" />
            My Account
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#fdfbf7] p-8 lg:p-12 custom-scrollbar">
         {children}
      </main>
    </div>
  );
}

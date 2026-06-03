'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight, Activity, BookOpen, Users, GraduationCap } from 'lucide-react';
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('currentUser'));
  }, []);

  return (
    <div className="flex-1 flex flex-col pt-12">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary-600 font-semibold text-sm mb-6 border border-primary-500/20">
                <Activity className="w-4 h-4" />
                <span>Next-Gen Medical Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Elevate Your Medical Journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">PaceMaker</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Step into a cutting-edge learning experience tailored for tomorrow's top doctors. Immerse yourself in premium video lectures, master real-world clinical scenarios, and conquer your exams.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link href="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2">
                  Join the Academy <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#services" className="bg-white text-gray-900 border border-gray-200 hover:border-primary-500 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-sm flex items-center justify-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary-500" /> Discover Services
                </Link>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-200/30 blur-3xl rounded-full -z-10"></div>
              <div className="relative w-full aspect-[4/3] mt-8 flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white glass-panel">
                <img src="/images/hero.png" alt="Medical Professional" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3">Our Core Ecosystem</h2>
            <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Services we provide for your success</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Live Ecosystem', desc: 'Real-time interactive sessions with India\'s top medical faculty.', icon: <Activity className="w-8 h-8 text-primary-600" />, href: isLoggedIn ? '/dashboard/live' : '/register' },
              { title: 'Intelligent Q-Bank', desc: 'Customizable question banks with AI-driven performance analytics.', icon: <BookOpen className="w-8 h-8 text-primary-600" />, href: isLoggedIn ? '/dashboard/qbank' : '/register' },
              { title: 'Mock Exam Series', desc: 'Simulated national level entrance exams with detailed ranking.', icon: <Users className="w-8 h-8 text-primary-600" />, href: isLoggedIn ? '/dashboard/exams' : '/register' },
            ].map((s, i) => (
              <Link href={s.href} key={i} className="p-10 rounded-[2.5rem] border border-gray-100 bg-white hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">{s.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{s.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-32 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div>
              <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-3">Available Curriculum</h2>
              <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Our Professional Courses</p>
            </div>
            <Link href="/pricing" className="text-primary-600 font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
              View all plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Anatomy Masterclass', subject: 'Anatomy' },
              { title: 'Clinical Physiology', subject: 'Physiology' },
              { title: 'Biochemistry Elite', subject: 'Biochemistry' },
              { title: 'Advanced Pathology', subject: 'Pathology' }
            ].map((course, i) => (
              <Link 
                href={isLoggedIn ? `/dashboard/qbank` : '/register'} 
                key={i} 
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group block"
              >
                <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-blue-50 flex items-center justify-center text-primary-400/50 font-black text-xs uppercase tracking-[0.2em]">
                    SUBJECT {i + 1}
                  </div>
                  {!isLoggedIn && (
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Unlock Now</span>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{course.title}</h4>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-12 md:p-20 rounded-[3rem] border border-primary-100 bg-gradient-to-br from-primary-50 to-transparent relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-6">Our Mission</h2>
              <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">Empowering the next generation of healers through technology.</h3>
              <p className="text-xl text-gray-600 font-medium leading-relaxed mb-10">
                PaceMaker was founded with a singular vision: to make high-quality medical education accessible, interactive, and intelligent. We combine pedagogical excellence with cutting-edge technology to ensure every aspirant reaches their full potential.
              </p>
            </div>
            <Activity className="absolute -bottom-20 -right-20 w-80 h-80 text-primary-100/50" />
          </div>
        </div>
      </section>
    </div>
  );
}

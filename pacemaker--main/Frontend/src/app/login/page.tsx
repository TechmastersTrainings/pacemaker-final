'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, BookOpen, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { authService } from '@/services/authService';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const registered = searchParams.get('registered');
  const prefillEmail = searchParams.get('email');
  const role = searchParams.get('role');

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Backend Login via authService (handles local storage and token)
      const authData = await authService.login({ email, password });
      
      const userRole = authData.role.toLowerCase();
      
      // 2. Navigation based on role
      if (userRole === 'admin' || userRole === 'instructor') {
        router.push('/admin'); 
      } else {
        router.push('/dashboard'); 
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full md:max-w-[400px] glass-panel rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden bg-white border border-gray-200"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl z-0"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
              <BookOpen className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-center text-gray-900 mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-center text-gray-600 font-medium mb-10">Resume your medical preparation.</p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm font-bold text-red-800">{error}</p>
            </motion.div>
          )}

          {registered && !error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">Registration Successful!</p>
                <p className="text-xs font-medium text-green-600">Please sign in to access your {role} dashboard.</p>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="doctor@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Password</label>
                <Link href="#" className="text-xs font-black text-primary-600 hover:text-primary-500 uppercase tracking-widest">Forgot?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary-600/30"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'} <ArrowRight className="h-6 w-6" />
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-600 font-bold">
            New aspirant?{' '}
            <Link href="/register" className="font-black text-primary-600 hover:text-primary-500 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="text-center space-y-4">
          <BookOpen className="w-10 h-10 text-primary-500 animate-pulse mx-auto" />
          <p className="text-sm font-bold text-gray-500">Loading PaceMaker...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

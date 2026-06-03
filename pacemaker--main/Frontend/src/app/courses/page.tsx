'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Brain, Activity, Globe, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseGridSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

function CoursesPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  const courses = [
    { id: 'neet-pg', name: 'NEET PG Pro', desc: 'Comprehensive coverage of all 19 subjects for NEET PG.', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'inicet', name: 'INICET Masterclass', desc: 'High-yield clinical scenarios tailored for AIIMS INICET.', icon: Brain, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { id: 'fmge', name: 'FMGE Crash Course', desc: 'Focused, exam-oriented preparation for foreign graduates.', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'usmle', name: 'USMLE Step 1', desc: 'Conceptual mastery for the United States Medical Licensing Examination.', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const handleSelect = (courseId: string) => {
    localStorage.setItem('selectedCourse', courseId);
    const user = localStorage.getItem('currentUser');
    if (user && user !== 'Student') {
      router.push('/?loggedin=true');
    } else {
      router.push('/register');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
          <div className="inline-flex h-8 w-48 bg-gray-200 animate-pulse rounded-full mb-6"></div>
          <div className="h-12 w-64 bg-gray-200 animate-pulse rounded-2xl mx-auto mb-6"></div>
          <div className="h-6 w-96 bg-gray-200 animate-pulse rounded-xl mx-auto"></div>
        </div>
        <CourseGridSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
      
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary-600 font-bold text-sm mb-6 border border-primary-500/20 shadow-sm"
        >
          Curriculum Selection
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6"
        >
          Choose Your Pathway
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600"
        >
          Select the examination you are targeting. PaceMaker will adapt its curriculum, Q-Bank, and video modules to match your exact needs.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {courses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.2 }}
            onClick={() => handleSelect(course.id)}
            className="glass-panel p-8 rounded-3xl border border-gray-200 shadow-lg hover:shadow-2xl hover:border-primary-500 cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col h-full bg-white"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${course.bg} blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`}></div>
            
            <div className={`w-16 h-16 rounded-2xl ${course.bg} flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
              <course.icon className={`w-8 h-8 ${course.color}`} />
            </div>
            
            <div className="relative z-10 flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">{course.name}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{course.desc}</p>
            </div>
            
            <div className="relative z-10 mt-8 flex items-center text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              Start Pathway <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function CoursesPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <CoursesPage />
    </ErrorBoundary>
  );
}


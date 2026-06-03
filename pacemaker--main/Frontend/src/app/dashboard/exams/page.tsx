'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, ClipboardList, Clock, 
  HelpCircle, ChevronRight, Trophy, BookOpen,
  Filter, Play, Timer, Star, AlertCircle, Share2, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { examService, Exam } from '@/services/examService';
import { StudyMaterialGridSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const allExams = await examService.getAllExams();
        setExams(allExams);
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchExams();
  }, []);

  const subjects = Array.from(new Set(exams.map(e => e.subject)));
  const filteredExams = exams.filter(e => 
    (filterSubject === 'All' || e.subject === filterSubject) &&
    (e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-transparent p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <StudyMaterialGridSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase">
            <ClipboardList className="w-4 h-4" />
            Assessment Engine
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Exam <span className="text-primary-600">Builder</span></h1>
          <p className="text-gray-600 font-medium">Practice with high-yield clinical exams and mock tests.</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95">
          <Plus className="w-5 h-5" />
          Refresh Assessments
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 mb-10 flex flex-col lg:flex-row gap-6 justify-between items-center">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search exams by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-3xl bg-gray-50 border border-transparent outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-lg font-medium transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full lg:w-auto custom-scrollbar">
          {['All', ...subjects].map(s => (
            <button 
              key={s}
              onClick={() => setFilterSubject(s)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap text-sm ${
                filterSubject === s 
                  ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Exam List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExams.map((exam) => (
          <motion.div 
            key={exam.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col"
          >
            <div className="p-10 flex-1">
              <div className="flex justify-between items-center mb-6">
                <span className="px-4 py-1.5 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-100">
                  {exam.subject}
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                   ACTIVE
                </span>
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-6 leading-tight group-hover:text-primary-600 transition-colors">
                {exam.title}
              </h3>

              <div className="flex items-center gap-6 text-gray-400 font-bold text-sm">
                 <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{exam.duration} Mins</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>{exam.questions.length} Qs</span>
                 </div>
              </div>
            </div>

            <div className="px-10 pb-10 pt-4 flex items-center justify-between gap-4 border-t border-gray-50 bg-gray-50/30">
               <div className="flex items-center gap-2">
                  <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-100 transition-all text-gray-400 hover:text-primary-600 shadow-sm">
                     <Star className="w-4 h-4" />
                  </button>
                  <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-100 transition-all text-gray-400 hover:text-primary-600 shadow-sm">
                     <Share2 className="w-4 h-4" />
                  </button>
               </div>
               <Link 
                href={`/exam/${exam.id}`}
                className="px-8 py-3 bg-gray-900 hover:bg-primary-600 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-primary-600/20 active:scale-95"
              >
                <Eye className="w-4 h-4" />
                Start Test
              </Link>
            </div>
          </motion.div>
        ))}

        {filteredExams.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900">No mock exams found</h3>
            <p className="text-gray-500 mt-2">Check back later for new high-yield assessments.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentExamsPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <StudentExamsPage />
    </ErrorBoundary>
  );
}


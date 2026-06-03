'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, MessageSquare, Download, Clock, User, CheckCircle, 
  X, Search, Send, GraduationCap, ChevronLeft, ChevronRight, Award, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getLeaderboardStudents, getLeaderboardSettings, exportToCSV, 
  addCongratsMessage, CongratsMessage, StudentRankItem
} from '@/lib/leaderboardStore';
import { leaderboardService, AVAILABLE_BADGES } from '@/services/leaderboardService';
import ErrorBoundary from '@/components/ErrorBoundary';

const INSTRUCTOR_SUBJECT_MAP: Record<string, string[]> = {
  'Dr. Aman Gupta': ['Cardiology', 'Physiology'],
  'Dr. Sarah Jenkins': ['Anatomy', 'Biochemistry'],
  'Dr. Instructor': ['Pharmacology', 'Pathology', 'Microbiology']
};

type Toast = {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
};

export default function InstructorLeaderboardPage() {
  return (
    <ErrorBoundary>
      <InstructorLeaderboard />
    </ErrorBoundary>
  );
}

function InstructorLeaderboard() {
  const [students, setStudents] = useState<StudentRankItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [instructorName, setInstructorName] = useState('Dr. Aman Gupta');
  const [allowedSubjects, setAllowedSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timeframe, setTimeframe] = useState<'allTime' | 'monthly' | 'weekly'>('allTime');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Send message modal states
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('Outstanding performance in the tests! Keep pushing the limits! 🥇');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setMounted(true);
    const name = localStorage.getItem('currentUser') || 'Dr. Aman Gupta';
    setInstructorName(name);

    // Get subjects allowed for this instructor
    const subjects = INSTRUCTOR_SUBJECT_MAP[name] || ['Overall', 'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'Social & Preventive Medicine', 'Cardiology'];
    setAllowedSubjects(subjects);
    setSelectedSubject(subjects[0]);

    setSettings(getLeaderboardSettings());

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadLeaderboardData = async () => {
      try {
        if (timeframe === 'weekly') {
          const data = await leaderboardService.getWeeklyLeaderboard();
          const mapped: StudentRankItem[] = data.map((entry, index) => ({
            userId: String(entry.userId),
            name: entry.name || `User ${entry.userId}`,
            avatar: entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${entry.userId}`,
            averageScore: entry.totalScore,
            totalMarks: entry.totalScore * 10,
            accuracy: 85,
            totalTests: 10,
            weeklyAverageScore: entry.totalScore,
            weeklyTests: 12,
            weeklyAccuracy: 88,
            monthlyAverageScore: entry.totalScore,
            monthlyTests: 40,
            monthlyAccuracy: 86,
            streakWeeks: 3,
            hasPerfectScore: entry.totalScore === 100,
            badges: index === 0 ? ['top3'] : index === 1 ? ['consistent'] : index === 2 ? ['improved'] : [],
            scoresBySubject: {}
          }));
          setStudents(mapped);
        } else if (timeframe === 'monthly') {
          const data = await leaderboardService.getMonthlyLeaderboard();
          const mapped: StudentRankItem[] = data.map((entry, index) => ({
            userId: String(entry.userId),
            name: entry.name || `User ${entry.userId}`,
            avatar: entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${entry.userId}`,
            averageScore: entry.totalScore,
            totalMarks: entry.totalScore * 10,
            accuracy: 85,
            totalTests: 10,
            weeklyAverageScore: entry.totalScore,
            weeklyTests: 12,
            weeklyAccuracy: 88,
            monthlyAverageScore: entry.totalScore,
            monthlyTests: 40,
            monthlyAccuracy: 86,
            streakWeeks: 3,
            hasPerfectScore: entry.totalScore === 100,
            badges: index === 0 ? ['top3'] : index === 1 ? ['consistent'] : index === 2 ? ['improved'] : [],
            scoresBySubject: {}
          }));
          setStudents(mapped);
        } else {
          // timeframe === 'allTime'
          const data = await leaderboardService.getMonthlyLeaderboard();
          const mapped: StudentRankItem[] = data.map((entry, index) => ({
            userId: String(entry.userId),
            name: entry.name || `User ${entry.userId}`,
            avatar: entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${entry.userId}`,
            averageScore: entry.totalScore,
            totalMarks: entry.totalScore * 10,
            accuracy: 85,
            totalTests: 10,
            weeklyAverageScore: entry.totalScore,
            weeklyTests: 12,
            weeklyAccuracy: 88,
            monthlyAverageScore: entry.totalScore,
            monthlyTests: 40,
            monthlyAccuracy: 86,
            streakWeeks: 3,
            hasPerfectScore: entry.totalScore === 100,
            badges: index === 0 ? ['top3'] : index === 1 ? ['consistent'] : index === 2 ? ['improved'] : [],
            scoresBySubject: {}
          }));
          setStudents(mapped);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setStudents(getLeaderboardStudents());
      }
    };

    if (mounted) {
      loadLeaderboardData();
    }
  }, [timeframe, selectedSubject, mounted]);

  const triggerToast = (type: 'success' | 'info' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper to extract score based on subject & timeframe
  const getStudentStats = (student: StudentRankItem) => {
    if (selectedSubject === 'Overall') {
      if (timeframe === 'weekly') {
        return {
          score: student.weeklyAverageScore,
          tests: student.weeklyTests,
          accuracy: student.weeklyAccuracy
        };
      }
      if (timeframe === 'monthly') {
        return {
          score: student.monthlyAverageScore,
          tests: student.monthlyTests,
          accuracy: student.monthlyAccuracy
        };
      }
      return {
        score: student.averageScore,
        tests: student.totalTests,
        accuracy: student.accuracy
      };
    } else {
      const subData = student.scoresBySubject[selectedSubject];
      return {
        score: subData ? subData.averageScore : 0,
        tests: subData ? subData.totalTests : 0,
        accuracy: subData ? subData.accuracy : 0
      };
    }
  };

  // Process, filter, and sort students
  const processedStudents = students
    .filter(student => {
      // Exclude banned students
      if (settings && settings.excludedStudents && settings.excludedStudents.includes(student.userId)) {
        return false;
      }
      
      const minTests = settings?.minTestsRequired || 5;
      const stats = getStudentStats(student);
      
      // Filter by minimum tests
      return stats.tests >= minTests;
    })
    .map(s => {
      const stats = getStudentStats(s);
      return {
        ...s,
        currentScore: stats.score,
        currentTests: stats.tests,
        currentAccuracy: stats.accuracy
      };
    })
    .sort((a, b) => {
      if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
      if (b.currentAccuracy !== a.currentAccuracy) return b.currentAccuracy - a.currentAccuracy;
      return b.currentTests - a.currentTests;
    })
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  // Search filter
  const searchedStudents = processedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(searchedStudents.length / itemsPerPage);
  const paginatedStudents = searchedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenCongrats = (student: any) => {
    setSelectedStudent(student);
    setMessageText(messageTemplate);
    setIsMsgModalOpen(true);
  };

  const handleSendCongrats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !messageText.trim()) return;

    try {
      const msg: CongratsMessage = {
        id: `cng_${Date.now()}`,
        instructorName,
        studentId: selectedStudent.userId,
        studentName: selectedStudent.name,
        message: messageText,
        date: new Date().toLocaleDateString()
      };
      
      addCongratsMessage(msg);
      triggerToast('success', `Congratulatory message sent to ${selectedStudent.name}!`);
      setIsMsgModalOpen(false);
      setSelectedStudent(null);
    } catch (e) {
      console.error(e);
      triggerToast('error', 'Failed to send message.');
    }
  };

  const handleExportReport = () => {
    const headers = ['Rank', 'Name', 'Subject', 'Timeframe', 'Tests Taken', 'Average Score (%)', 'Accuracy (%)', 'Streak (Weeks)'];
    const rows = processedStudents.map(s => [
      s.rank,
      s.name,
      selectedSubject,
      timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'All Time',
      s.currentTests,
      s.currentScore,
      s.currentAccuracy,
      s.streakWeeks
    ]);
    
    exportToCSV(headers, rows, `PaceMaker_Class_Performance_${selectedSubject}_${timeframe}.csv`);
    triggerToast('success', 'Class performance report exported.');
  };

  return (
    <div className="max-w-7xl mx-auto pb-16">
      
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 ${
                t.type === 'success' ? 'bg-teal-50 border-teal-100 text-teal-800' :
                t.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />}
              {t.type === 'error' && <X className="w-5 h-5 text-red-600 shrink-0" />}
              <span className="text-xs font-black leading-normal">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-200/50 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase">
            <GraduationCap className="w-4 h-4" />
            Faculty Portal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Course <span className="text-primary-600">Leaderboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Monitor scores, reward top achievers, and extract custom performance files.
          </p>
        </div>
        
        <button
          onClick={handleExportReport}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          Export Class Report
        </button>
      </div>

      {/* Info Warning */}
      {allowedSubjects.length === 0 && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
            No specific course mappings found for {instructorName}. Exposing default platform modules as fallback.
          </p>
        </div>
      )}

      {/* Filter and control panel */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Course and timeframe toggles */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mr-2">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => { setSelectedSubject(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-black text-gray-600 outline-none focus:ring-2 focus:ring-primary-500"
            >
              {allowedSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-1.5 flex gap-1.5">
            <button
              onClick={() => { setTimeframe('allTime'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'allTime' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              All Time
            </button>
            <button
              onClick={() => { setTimeframe('monthly'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'monthly' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => { setTimeframe('weekly'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'weekly' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative max-w-sm w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={10}>10 / Page</option>
            <option value={25}>25 / Page</option>
            <option value={50}>50 / Page</option>
          </select>
        </div>

      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="py-4 px-6 text-center w-16">Rank</th>
                <th className="py-4 px-6">Aspirant</th>
                <th className="py-4 px-6 text-center">Tests Taken</th>
                <th className="py-4 px-6 text-center">Average Score</th>
                <th className="py-4 px-6 text-center">Accuracy</th>
                <th className="py-4 px-6">Badges</th>
                <th className="py-4 px-6 text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!isLoaded ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6 text-center">
                      <div className="h-8 w-8 bg-gray-100 rounded-xl mx-auto"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0"></div>
                        <div className="space-y-1.5 w-full">
                          <div className="h-4 w-28 bg-gray-100 rounded"></div>
                          <div className="h-3 w-16 bg-gray-50 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-4 w-12 bg-gray-100 rounded mx-auto"></div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-4 w-16 bg-gray-100 rounded mx-auto"></div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-4 w-16 bg-gray-100 rounded mx-auto"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="h-8 w-24 bg-gray-100 rounded-xl mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((stud) => (
                  <tr key={stud.userId} className="group transition-all hover:bg-gray-50/50">
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex w-8 h-8 rounded-xl items-center justify-center text-xs font-bold ${
                        stud.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        stud.rank === 2 ? 'bg-slate-100 text-slate-800' :
                        stud.rank === 3 ? 'bg-amber-100 text-amber-800' :
                        'text-gray-500'
                      }`}>
                        {stud.rank}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={stud.avatar} alt={stud.name} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{stud.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">ID: {stud.userId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-gray-700">{stud.currentTests}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-extrabold text-primary-600">{stud.currentScore}%</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-extrabold text-emerald-600">{stud.currentAccuracy}%</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1">
                        {stud.badges.map(bid => (
                          <span key={bid} className="text-md" title={AVAILABLE_BADGES.find(b => b.id === bid)?.name}>
                            {AVAILABLE_BADGES.find(b => b.id === bid)?.emoji}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleOpenCongrats(stud)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Congrats
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Trophy className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No student scores found in {selectedSubject}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              Showing {Math.min(searchedStudents.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(searchedStudents.length, currentPage * itemsPerPage)} of {searchedStudents.length} entries
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-gray-700 px-3">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Congratulate Message Modal */}
      <AnimatePresence>
        {isMsgModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMsgModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-2xl w-full max-w-lg z-10 space-y-6 relative"
            >
              <button
                onClick={() => setIsMsgModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary-50 border border-primary-100">
                  <Award className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest block">Congratulate Achiever</span>
                  <h3 className="text-lg font-black text-gray-900 block">Motivation Campaign</h3>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-10 h-10 rounded-xl bg-white border border-gray-100" />
                <div>
                  <span className="text-xs font-bold text-gray-800 block">{selectedStudent.name}</span>
                  <span className="text-[10px] font-medium text-gray-400">Ranked #{selectedStudent.rank} in {selectedSubject}</span>
                </div>
              </div>

              <form onSubmit={handleSendCongrats} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    Message Templates
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Outstanding performance in the tests! Keep pushing the limits! 🥇',
                      'Superb accuracy! You are setting a great benchmark for your peers! 🎯',
                      'Incredible streak and consistency. Keep up the momentum! 🔥'
                    ].map((temp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setMessageTemplate(temp); setMessageText(temp); }}
                        className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                          messageTemplate === temp
                            ? 'bg-primary-50/50 border-primary-300 text-primary-900 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    Custom Message
                  </label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={(e) => { setMessageText(e.target.value); setMessageTemplate(''); }}
                    placeholder="Type custom congratulations..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all resize-none"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-50 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMsgModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

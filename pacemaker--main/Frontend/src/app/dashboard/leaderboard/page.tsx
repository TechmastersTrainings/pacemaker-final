'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, Search, Download, ChevronLeft, ChevronRight, 
  Sparkles, Award, Star, BookOpen, Clock, Activity, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area
} from 'recharts';
import { 
  getLeaderboardStudents, getLeaderboardSettings, exportToCSV, 
  StudentRankItem, recalculateLeaderboard
} from '@/lib/leaderboardStore';
import { leaderboardService, AVAILABLE_BADGES } from '@/services/leaderboardService';
import ErrorBoundary from '@/components/ErrorBoundary';

const SUBJECTS = [
  'Overall', 'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 
  'Pharmacology', 'Microbiology', 'Forensic Medicine', 
  'Social & Preventive Medicine', 'Cardiology'
];

export default function StudentLeaderboardPage() {
  return (
    <ErrorBoundary>
      <StudentLeaderboard />
    </ErrorBoundary>
  );
}

function StudentLeaderboard() {
  const [students, setStudents] = useState<StudentRankItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'allTime' | 'monthly' | 'weekly'>('allTime');
  const [subject, setSubject] = useState<string>('Overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentUser(localStorage.getItem('currentUser') || 'Student');
    
    // Trigger sync & load
    recalculateLeaderboard();
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
  }, [timeframe, subject, mounted]);

  // Filter students based on min tests required in overall or subject
  const minTestsFilter = (student: StudentRankItem) => {
    if (!settings) return true;
    const minTests = settings.minTestsRequired || 5;

    // Check if student is excluded by admin
    if (settings.excludedStudents && settings.excludedStudents.includes(student.userId)) {
      return false;
    }

    if (subject === 'Overall') {
      if (timeframe === 'weekly') return student.weeklyTests >= minTests;
      if (timeframe === 'monthly') return student.monthlyTests >= minTests;
      return student.totalTests >= minTests;
    } else {
      const subData = student.scoresBySubject[subject];
      return subData ? subData.totalTests >= minTests : false;
    }
  };

  // Helper to extract score based on subject & timeframe
  const getStudentStats = (student: StudentRankItem) => {
    if (subject === 'Overall') {
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
      const subData = student.scoresBySubject[subject];
      return {
        score: subData ? subData.averageScore : 0,
        tests: subData ? subData.totalTests : 0,
        accuracy: subData ? subData.accuracy : 0
      };
    }
  };

  // Process, filter, and sort students
  const processedStudents = students
    .filter(minTestsFilter)
    .map(s => {
      const stats = getStudentStats(s);
      return {
        ...s,
        currentScore: stats.score,
        currentTests: stats.tests,
        currentAccuracy: stats.accuracy
      };
    })
    // Sort descending by score, tiebreaker on accuracy then total tests
    .sort((a, b) => {
      if (b.currentScore !== a.currentScore) return b.currentScore - a.currentScore;
      if (b.currentAccuracy !== a.currentAccuracy) return b.currentAccuracy - a.currentAccuracy;
      return b.currentTests - a.currentTests;
    })
    // Map in ranks
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  // Filtered by search query
  const searchedStudents = processedStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Self student item
  const currentStudentRankItem = processedStudents.find(s => 
    s.name.toLowerCase() === currentUser.toLowerCase()
  );

  // Top 3 Podium Students
  const top3 = processedStudents.slice(0, 3);

  // Paginated students list
  const totalPages = Math.ceil(searchedStudents.length / itemsPerPage);
  const paginatedStudents = searchedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Recharts Top 10 Data
  const top10Data = processedStudents.slice(0, 10).map(s => ({
    name: s.name.replace('Dr. ', ''),
    score: s.currentScore,
    accuracy: s.currentAccuracy
  }));

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Timeframe', 'Subject', 'Tests Taken', 'Average Score (%)', 'Accuracy (%)', 'Badges Earned'];
    const rows = processedStudents.map(s => [
      s.rank,
      s.name,
      timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'All Time',
      subject,
      s.currentTests,
      s.currentScore,
      s.currentAccuracy,
      s.badges.map(b => AVAILABLE_BADGES.find(ab => ab.id === b)?.emoji || '').join(' ')
    ]);
    exportToCSV(headers, rows, `PaceMaker_Leaderboard_${subject}_${timeframe}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen pb-16">
      
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-sm tracking-wide uppercase">
            <Trophy className="w-4 h-4" />
            Arena of Excellence
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            PaceMaker <span className="text-teal-600">Leaderboard</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Benchmark your performance against the top medical aspirants nationwide.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 text-sm font-bold rounded-2xl transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Ranks highlights for current student */}
      {currentStudentRankItem ? (
        <div className="mb-10 p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent rounded-[2.5rem] border border-teal-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/20">
              #{currentStudentRankItem.rank}
            </div>
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest block">Your Position</span>
              <span className="text-lg font-black text-gray-900 block">{currentStudentRankItem.name}</span>
              <span className="text-xs font-medium text-gray-400">
                Subject: <span className="text-gray-700 font-bold">{subject}</span> • Timeframe: <span className="text-gray-700 font-bold capitalize">{timeframe === 'allTime' ? 'All Time' : timeframe}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-12 text-center">
            <div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Tests</span>
              <span className="text-xl font-black text-gray-800 block">{currentStudentRankItem.currentTests}</span>
            </div>
            <div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Avg Score</span>
              <span className="text-xl font-black text-teal-600 block">{currentStudentRankItem.currentScore}%</span>
            </div>
            <div>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Accuracy</span>
              <span className="text-xl font-black text-emerald-600 block">{currentStudentRankItem.currentAccuracy}%</span>
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Badges Earned</span>
              <div className="flex gap-1.5 mt-1">
                {currentStudentRankItem.badges.length > 0 ? (
                  currentStudentRankItem.badges.map(bid => {
                    const badge = AVAILABLE_BADGES.find(b => b.id === bid);
                    return (
                      <span 
                        key={bid} 
                        className="text-lg" 
                        title={`${badge?.name}: ${badge?.description}`}
                      >
                        {badge?.emoji}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-400 font-bold">No badges yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-center gap-4">
          <Award className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-sm font-black text-amber-800">Rank Not Generated Yet</h4>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">
              Take at least {settings?.minTestsRequired || 5} tests in the selected subject/timeframe to qualify and appear on the leaderboard.
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Medal Podiums */}
      {!isLoaded ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-[2.5rem] bg-gray-50 border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : top3.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-end">
          
          {/* 2nd Place Silver */}
          {top3[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative text-center order-2 md:order-1"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-[#c0c0c0] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-silver/40">
                🥈
              </div>
              <img 
                src={top3[1].avatar} 
                alt={top3[1].name}
                className="w-20 h-20 rounded-full bg-gray-50 mx-auto mb-4 border border-gray-100"
              />
              <h3 className="text-lg font-black text-gray-900 line-clamp-1">{top3[1].name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Silver Medalist</p>
              
              <div className="flex gap-1.5 justify-center mt-3 h-6">
                {top3[1].badges.map(bid => (
                  <span key={bid} title={AVAILABLE_BADGES.find(b => b.id === bid)?.name} className="text-md">
                    {AVAILABLE_BADGES.find(b => b.id === bid)?.emoji}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50 bg-gray-50/50 rounded-2xl p-3">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Avg Score</span>
                  <span className="text-lg font-black text-gray-800 block">{top3[1].currentScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Accuracy</span>
                  <span className="text-lg font-black text-[#c0c0c0] block">{top3[1].currentAccuracy}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 1st Place Gold */}
          {top3[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-teal-500/20 rounded-[2.5rem] p-10 shadow-md hover:shadow-2xl transition-all duration-300 relative text-center order-1 md:order-2 md:mb-4 bg-gradient-to-b from-teal-500/[0.02] to-transparent"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-[1.25rem] bg-[#ffd700] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-yellow-500/20">
                🥇
              </div>
              <img 
                src={top3[0].avatar} 
                alt={top3[0].name}
                className="w-24 h-24 rounded-full bg-gray-50 mx-auto mb-4 border-2 border-teal-500/20"
              />
              <h3 className="text-xl font-black text-gray-900 line-clamp-1">{top3[0].name}</h3>
              <p className="text-xs font-black text-teal-600 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Overall Champion
              </p>

              <div className="flex gap-1.5 justify-center mt-3 h-6">
                {top3[0].badges.map(bid => (
                  <span key={bid} title={AVAILABLE_BADGES.find(b => b.id === bid)?.name} className="text-md">
                    {AVAILABLE_BADGES.find(b => b.id === bid)?.emoji}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50 bg-teal-50/50 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Avg Score</span>
                  <span className="text-2xl font-black text-teal-700 block">{top3[0].currentScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block">Accuracy</span>
                  <span className="text-2xl font-black text-emerald-600 block">{top3[0].currentAccuracy}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3rd Place Bronze */}
          {top3[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative text-center order-3"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-[#cd7f32] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-800/40">
                🥉
              </div>
              <img 
                src={top3[2].avatar} 
                alt={top3[2].name}
                className="w-20 h-20 rounded-full bg-gray-50 mx-auto mb-4 border border-gray-100"
              />
              <h3 className="text-lg font-black text-gray-900 line-clamp-1">{top3[2].name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Bronze Medalist</p>

              <div className="flex gap-1.5 justify-center mt-3 h-6">
                {top3[2].badges.map(bid => (
                  <span key={bid} title={AVAILABLE_BADGES.find(b => b.id === bid)?.name} className="text-md">
                    {AVAILABLE_BADGES.find(b => b.id === bid)?.emoji}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50 bg-gray-50/50 rounded-2xl p-3">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Avg Score</span>
                  <span className="text-lg font-black text-gray-800 block">{top3[2].currentScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Accuracy</span>
                  <span className="text-lg font-black text-amber-700 block">{top3[2].currentAccuracy}%</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      ) : (
        <div className="py-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center mb-12">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No medalist data generated</p>
        </div>
      )}

      {/* Control filters bar */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-1.5 flex gap-1.5">
            <button
              onClick={() => { setTimeframe('allTime'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'allTime' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              All Time
            </button>
            <button
              onClick={() => { setTimeframe('monthly'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'monthly' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => { setTimeframe('weekly'); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${timeframe === 'weekly' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Weekly
            </button>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-black text-gray-600 outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
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
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={10}>10 / Page</option>
            <option value={25}>25 / Page</option>
            <option value={50}>50 / Page</option>
          </select>
        </div>

      </div>

      {/* Main Grid: Table & Recharts Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Leaderboard Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Aspirant</th>
                    <th className="py-4 px-6 text-center">Tests</th>
                    <th className="py-4 px-6 text-center">Avg Score</th>
                    <th className="py-4 px-6 text-center">Accuracy</th>
                    <th className="py-4 px-6">Badges</th>
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
                        <td className="py-4 px-6">
                          <div className="h-4 w-12 bg-gray-100 rounded mx-auto"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 bg-gray-100 rounded mx-auto"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="h-4 w-16 bg-gray-100 rounded mx-auto"></div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-1">
                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                            <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedStudents.length > 0 ? (
                    paginatedStudents.map((stud) => {
                      const isSelf = stud.name.toLowerCase() === currentUser.toLowerCase();
                      return (
                        <tr 
                          key={stud.userId}
                          className={`group transition-all hover:bg-gray-50/50 ${isSelf ? 'bg-teal-500/[0.04] font-semibold' : ''}`}
                        >
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
                              <img 
                                src={stud.avatar} 
                                alt={stud.name} 
                                className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform"
                              />
                              <div className="flex flex-col">
                                <span className={`text-sm ${isSelf ? 'text-teal-700 font-extrabold' : 'text-gray-800 font-bold'}`}>
                                  {stud.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold">User ID: {stud.userId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center text-sm font-bold text-gray-700">{stud.currentTests}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-extrabold text-teal-600">{stud.currentScore}%</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-extrabold text-emerald-600">{stud.currentAccuracy}%</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-1.5">
                              {stud.badges.map(bid => {
                                const badge = AVAILABLE_BADGES.find(b => b.id === bid);
                                return (
                                  <span 
                                    key={bid} 
                                    className="text-md cursor-help"
                                    title={`${badge?.name}: ${badge?.description}`}
                                  >
                                    {badge?.emoji}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <Trophy className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No records found</p>
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
        </div>

        {/* Right Column: Recharts Chart */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-widest mb-2">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Visual Analytics
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-6">Top 10 Performance</h3>
            </div>
            
            <div className="h-80 w-full flex items-center justify-center">
              {mounted && top10Data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Data} margin={{ top: 10, right: 5, left: -25, bottom: 20 }}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      cursor={{ fill: 'rgba(20, 184, 166, 0.04)' }}
                    />
                    <Bar dataKey="score" fill="#0d9488" radius={[8, 8, 0, 0]}>
                      {top10Data.map((entry, index) => {
                        let barColor = '#0d9488'; // teal default
                        if (index === 0) barColor = '#ffd700'; // Gold
                        else if (index === 1) barColor = '#c0c0c0'; // Silver
                        else if (index === 2) barColor = '#cd7f32'; // Bronze
                        return <Cell key={`cell-${index}`} fill={barColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <Trophy className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No chart data</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>Time: All Time</span>
              <span>Subject: {subject}</span>
            </div>
          </div>

          {/* Leaderboard reset notifier */}
          <div className="bg-gradient-to-tr from-teal-600 to-cyan-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-md shadow-teal-700/10">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="bg-white/10 rounded-xl p-2.5 w-10 h-10 flex items-center justify-center border border-white/10">
                <Clock className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-md">Weekly Ranks Cycle</h4>
                <p className="text-white/80 text-xs mt-1.5 font-medium leading-relaxed">
                  The weekly leaderboard resets automatically on <span className="font-bold text-teal-200 capitalize">{settings?.resetDay || 'Monday'}</span> mornings. Keep taking tests to retain your active weekly streak 🔥 and climb ranks!
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

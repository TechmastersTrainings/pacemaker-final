'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, Settings, ShieldAlert, CheckCircle, RefreshCw, X, Search,
  AlertTriangle, Filter, EyeOff, Save, Info, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getLeaderboardSettings, saveLeaderboardSettings, getLeaderboardStudents, 
  saveLeaderboardStudents, recalculateLeaderboard, StudentRankItem, LeaderboardSettings 
} from '@/lib/leaderboardStore';
import { getExams } from '@/lib/examStore';
import { examService, Exam } from '@/services/examService';
import { leaderboardService } from '@/services/leaderboardService';
import ErrorBoundary from '@/components/ErrorBoundary';

type Toast = {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
};

export default function AdminLeaderboardPage() {
  return (
    <ErrorBoundary>
      <AdminLeaderboard />
    </ErrorBoundary>
  );
}

function AdminLeaderboard() {
  const [settings, setSettings] = useState<LeaderboardSettings>({
    minTestsRequired: 5,
    resetDay: 'Monday',
    excludedExams: [],
    excludedStudents: []
  });
  
  const [students, setStudents] = useState<StudentRankItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchExamQuery, setSearchExamQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    setSettings(getLeaderboardSettings());
    
    const loadData = async () => {
      try {
        const examList = await examService.getAllExams();
        setExams(examList);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setExams(getExams());
      }

      try {
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
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setStudents(getLeaderboardStudents());
      }
    };
    
    loadData();
  }, []);

  const triggerToast = (type: 'success' | 'info' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveLeaderboardSettings(settings);
      recalculateLeaderboard();
      // Reload students
      setStudents(getLeaderboardStudents());
      triggerToast('success', 'Leaderboard settings saved successfully.');
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Failed to save settings.');
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    triggerToast('info', 'Recalculating ranks and syncing student scores...');
    
    // Simulate complex background calculations
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      recalculateLeaderboard();
      const updated = getLeaderboardStudents();
      setStudents(updated);
      triggerToast('success', 'Leaderboard ranks recalculated successfully.');
    } catch (e) {
      console.error(e);
      triggerToast('error', 'Recalculation failed.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Toggle student exclusion
  const handleToggleExcludeStudent = (userId: string) => {
    const excluded = [...settings.excludedStudents];
    const idx = excluded.indexOf(userId);
    
    if (idx >= 0) {
      excluded.splice(idx, 1);
      triggerToast('success', 'Student restored to leaderboard.');
    } else {
      excluded.push(userId);
      triggerToast('info', 'Student excluded from leaderboard.');
    }
    
    const nextSettings = { ...settings, excludedStudents: excluded };
    setSettings(nextSettings);
    saveLeaderboardSettings(nextSettings);
    
    // Auto recalculate to apply exclusion
    recalculateLeaderboard();
    setStudents(getLeaderboardStudents());
  };

  // Toggle exam exclusion
  const handleToggleExcludeExam = (examId: string) => {
    const excluded = [...settings.excludedExams];
    const idx = excluded.indexOf(examId);
    
    if (idx >= 0) {
      excluded.splice(idx, 1);
    } else {
      excluded.push(examId);
    }
    
    const nextSettings = { ...settings, excludedExams: excluded };
    setSettings(nextSettings);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    s.userId.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );

  // Filter exams based on search query
  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchExamQuery.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchExamQuery.toLowerCase())
  );

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
                t.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                t.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
              {t.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />}
              {t.type === 'error' && <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
              <span className="text-xs font-black leading-normal">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-200/50 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase">
            <Trophy className="w-4 h-4" />
            Platform Control
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Leaderboard <span className="text-primary-600">Settings</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage test inclusion criteria, reset schedules, and override list details.
          </p>
        </div>
        
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          Recalculate Scores
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Form Settings & Exclusions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* General policy settings */}
          <form onSubmit={handleSaveSettings} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary-600" />
              General Criteria
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Minimum Tests Required
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={settings.minTestsRequired}
                  onChange={(e) => setSettings({ ...settings, minTestsRequired: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  required
                />
                <span className="text-[10px] text-gray-400 font-medium block">
                  Minimum test attempts needed to qualify for rank generation.
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                  Weekly Reset Day
                </label>
                <select
                  value={settings.resetDay}
                  onChange={(e) => setSettings({ ...settings, resetDay: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                >
                  <option value="Monday">Monday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <span className="text-[10px] text-gray-400 font-medium block">
                  Day of the week when weekly scores are archived/cleared.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>

          {/* Test Exclusion settings */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-amber-500" />
                  Test Exclusions
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Select specific test papers to exclude from leaderboard calculations entirely.
                </p>
              </div>
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test..."
                  value={searchExamQuery}
                  onChange={(e) => setSearchExamQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 max-h-72 overflow-y-auto custom-scrollbar">
              {filteredExams.length > 0 ? (
                filteredExams.map(ex => {
                  const isExcluded = settings.excludedExams.includes(String(ex.id));
                  return (
                    <div 
                      key={ex.id}
                      onClick={() => handleToggleExcludeExam(String(ex.id))}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${isExcluded ? 'bg-amber-500/[0.02]' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800">{ex.title}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{ex.subject} • {ex.questions.length} Questions</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${isExcluded ? 'bg-amber-500' : 'bg-gray-200'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isExcluded ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  No published exams found in store
                </div>
              )}
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                Excluding an exam will remove all score history associated with it from the leaderboard data. Changes take effect on next score recalculation.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: User Exclusions / Banning override */}
        <div>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-red-500" />
                  Manual Overrides
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Restrict specific student accounts from appearing on the leaderboard.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(stud => {
                    const isExcluded = settings.excludedStudents.includes(stud.userId);
                    return (
                      <div key={stud.userId} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <img src={stud.avatar} alt={stud.name} className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800 leading-tight">{stud.name}</span>
                            <span className="text-[9px] text-gray-400 font-semibold">{stud.userId}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleExcludeStudent(stud.userId)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                            isExcluded 
                              ? 'bg-red-50 border border-red-100 text-red-600 hover:bg-red-100' 
                              : 'bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-100 text-gray-500'
                          }`}
                        >
                          {isExcluded ? 'Excluded' : 'Exclude'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    No students found matching query
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-red-800 font-semibold leading-relaxed">
                Excluding a student immediately hides them from the public student leaderboard page. They can still take tests but won't be displayed to peers.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

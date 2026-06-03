'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Flame, Zap, Award, Medal, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { examService } from '@/services/examService';
import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

function AchievementsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [badges, setBadges] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const exams = await examService.getAllExams();
        let attempts: any = {};
        try {
          attempts = JSON.parse(localStorage.getItem('lms_exam_attempts_v1') || '{}');
        } catch (e) {}

    const submittedAttempts = Object.values(attempts).filter((a: any) => a.submittedAt);
    
    // Calculate XP: 500 per attempt + 200 per pass
    const calculatedXp = (submittedAttempts.length * 500) + (submittedAttempts.filter((a: any) => a.passed).length * 200);
    setXp(calculatedXp);
    
    // Level: 1 level per 2000 XP
    const calculatedLevel = Math.floor(calculatedXp / 2000) + 1;
    setLevel(calculatedLevel);

    // Badges Logic
    const newBadges = [
      { 
        title: 'Early Bird', 
        desc: 'Completed a session before 8 AM', 
        earned: submittedAttempts.some((a: any) => new Date(a.submittedAt).getHours() < 8),
        icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50'
      },
      { 
        title: 'First Step', 
        desc: 'Completed your first exam', 
        earned: submittedAttempts.length > 0,
        icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50'
      },
      { 
        title: 'Perfect Score', 
        desc: 'Score 100% in any quiz', 
        earned: submittedAttempts.some((a: any) => {
           const exam = exams.find(e => e.id === a.examId);
           return exam && a.score === exam.totalMarks;
        }),
        icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50'
      },
      { 
        title: 'Streak Starter', 
        desc: '3 exams in 3 days', 
        earned: submittedAttempts.length >= 3,
        icon: Medal, color: 'text-purple-500', bg: 'bg-purple-50'
      }
    ];
    setBadges(newBadges);

    // Recent Activity
    const activity = submittedAttempts.slice(-3).map((a: any) => ({
      title: a.passed ? 'Exam Passed' : 'Exam Attempted',
      time: new Date(a.submittedAt).toLocaleDateString(),
      type: a.passed ? 'badge' : 'course'
    })).reverse();
    setRecentActivity(activity);

      } catch (err) {
        console.error('Error loading achievements:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadAchievements();
  }, []);

  const stats = [
    { label: 'Total XP', value: xp.toLocaleString(), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Rank', value: `#${Math.max(1, 100 - Math.floor(xp/100))}`, icon: Trophy, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Level', value: level.toString(), icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Points', value: Math.floor(xp/10).toString(), icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  const handleViewHistory = () => {
    window.location.href = '/dashboard/exams';
  };

  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-primary-200">
            <Trophy className="w-3.5 h-3.5" /> Rewards & Recognition
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your <span className="text-primary-600">Achievements</span></h1>
          <p className="text-gray-500 font-medium mt-2 max-w-lg">Track your progress, unlock exclusive badges, and climb the leaderboard through consistent learning.</p>
        </div>
        
        <div className="bg-white px-8 py-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
           <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Weekly Rank</p>
              <p className="text-2xl font-black text-gray-900">#{Math.max(1, 100 - Math.floor(xp/100))}</p>
           </div>
           <div className="w-px h-10 bg-gray-100"></div>
           <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Percentile</p>
              <p className="text-2xl font-black text-emerald-600">Top {Math.max(1, 15 - Math.floor(xp/1000))}%</p>
           </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Badge Collection */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Award className="w-6 h-6 text-primary-600" />
            Badge Collection
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {badges.map((badge, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (i * 0.05) }}
                className={`relative p-6 rounded-[2.5rem] border transition-all duration-300 ${
                  badge.earned 
                    ? 'bg-white border-gray-100 shadow-sm hover:shadow-xl' 
                    : 'bg-gray-50/50 border-dashed border-gray-200 grayscale opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-3xl ${badge.bg} flex items-center justify-center shrink-0`}>
                    <badge.icon className={`w-8 h-8 ${badge.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${badge.earned ? 'text-gray-900' : 'text-gray-400'}`}>{badge.title}</h3>
                    <p className="text-xs font-medium text-gray-500 mt-1 leading-relaxed">{badge.desc}</p>
                    {badge.earned && (
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Earned
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Level Progress & Activity */}
        <div className="space-y-8">
          {/* Level Progress */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Current Level</p>
                  <h3 className="text-4xl font-black">Level {level}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next Level</p>
                  <p className="text-sm font-black text-primary-400">{level + 1}</p>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp % 2000) / 20}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-primary-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                />
              </div>
              
              <p className="text-xs font-medium text-gray-400 text-center">
                <span className="text-white font-bold">{2000 - (xp % 2000)} XP</span> more to reach Level {level + 1}
              </p>
            </div>
            <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
          </div>

          {/* Recent Milestones */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Recent Milestones</h3>
            <div className="space-y-6">
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== recentActivity.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-gray-50"></div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                    activity.type === 'badge' ? 'bg-amber-50 text-amber-500' :
                    activity.type === 'level' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {activity.type === 'badge' ? <Award className="w-5 h-5" /> :
                     activity.type === 'level' ? <Zap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic">No recent activity to show.</p>
              )}
            </div>
            
            <button 
              onClick={handleViewHistory}
              className="w-full mt-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AchievementsPage />
    </ErrorBoundary>
  );
}


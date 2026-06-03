'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, BookOpen, Clock, Activity, Target, Flame, 
  CheckCircle2, Play, ChevronRight, BarChart, GraduationCap, Video, Zap, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { examService } from '@/services/examService';
import { dashboardService } from '@/services/dashboardService';
import apiClient from '@/lib/apiClient';

export default function StudentDashboardPage() {
  return (
    <ErrorBoundary>
      <StudentDashboard />
    </ErrorBoundary>
  );
}

function StudentDashboard() {
  const [userName, setUserName] = useState<string>('Student');
  const [isLoaded, setIsLoaded] = useState(false);
  const [latestExams, setLatestExams] = useState<any[]>([]);
  const [latestLive, setLatestLive] = useState<any[]>([]);

  // Dynamic Student Stats
  const [overallScore, setOverallScore] = useState<number>(0);
  const [studyHours, setStudyHours] = useState<string>('0h');
  const [courseProgress, setCourseProgress] = useState<any[]>([
    { subject: 'Anatomy', progress: 0, total: 45, completed: 0, color: 'bg-teal-500' },
    { subject: 'Physiology', progress: 0, total: 30, completed: 0, color: 'bg-blue-500' },
    { subject: 'Pathology', progress: 0, total: 50, completed: 0, color: 'bg-emerald-500' },
    { subject: 'Pharmacology', progress: 0, total: 20, completed: 0, color: 'bg-amber-500' },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const user = localStorage.getItem('currentUser');
        if (user) setUserName(user);

        // 1. Fetch Exams from Backend
        const exams = await examService.getAllExams();
        if (exams && exams.length > 0) {
          setLatestExams(exams.slice(0, 2));
        } else {
          // Fallback to local storage if API returns empty
          const savedExams = localStorage.getItem('lms_exams_v1');
          if (savedExams) {
            setLatestExams(JSON.parse(savedExams).slice(0, 2));
          }
        }

        // 2. Fetch Live Sessions
        const savedLive = localStorage.getItem('lms_live_sessions_v3');
        if (savedLive) {
          const parsed = JSON.parse(savedLive);
          setLatestLive(parsed.filter((s: any) => s.status === 'live' || s.status === 'scheduled').slice(0, 1));
        }

        // 3. Fetch Student Overall Analytics from Backend
        try {
          const stats = await dashboardService.getStudentAnalytics();
          if (stats) {
            setOverallScore(stats.overallScore || 0);
            setStudyHours(stats.totalTimeSpent || '0h');
          }
        } catch (err) {
          console.error("Error fetching overall analytics:", err);
        }

        // 4. Fetch Subject-specific progress dynamically from Backend
        try {
          const updatedProgress = await Promise.all([
            { subject: 'Anatomy', color: 'bg-teal-500', id: 1, total: 45 },
            { subject: 'Physiology', color: 'bg-blue-500', id: 2, total: 30 },
            { subject: 'Pathology', color: 'bg-emerald-500', id: 3, total: 50 },
            { subject: 'Pharmacology', color: 'bg-amber-500', id: 4, total: 20 },
          ].map(async (subj) => {
            try {
              const data = await dashboardService.getSubjectPerformance(subj.id);
              if (data) {
                return {
                  subject: subj.subject,
                  progress: Math.round(data.score || 0),
                  total: subj.total,
                  completed: data.correctAnswers || 0,
                  color: subj.color
                };
              }
            } catch (e) {
              console.error(`Error fetching subject ${subj.id} progress:`, e);
            }
            return {
              subject: subj.subject,
              progress: 0,
              total: subj.total,
              completed: 0,
              color: subj.color
            };
          }));
          setCourseProgress(updatedProgress);
        } catch (err) {
          console.error("Error updating subject progress:", err);
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoaded(true);
      }
    }

    fetchData();
  }, []);

  const kpis = [
    { title: 'Enrolled Courses', value: overallScore > 0 ? '4' : '0', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Classes Completed', value: overallScore > 0 ? '42' : '0', icon: Video, color: 'text-teal-500', bg: 'bg-teal-50' },
    { title: 'Study Hours', value: studyHours, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Current Streak', value: overallScore > 0 ? '14 Days' : '0 Days', icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] pt-24 pb-32 selection:bg-teal-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Welcome Hero */}
        <div className="relative rounded-[3rem] overflow-hidden bg-white border border-gray-100 shadow-sm mb-12">
           <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-transparent"></div>
           <div className="relative z-10 px-8 py-16 md:px-16 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div>
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-xs font-black uppercase tracking-widest mb-6 border border-teal-100"
                 >
                    <Trophy className="w-4 h-4" /> Keep up the great work!
                 </motion.div>
                 <motion.h1 
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                   className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight"
                 >
                   Welcome back, <br/>
                   <span className="text-teal-600">{userName}</span>
                 </motion.h1>
                 <motion.p 
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                   className="text-gray-500 font-medium max-w-lg"
                 >
                   You are in the top 15% of students this week. Continue your Cardiology module to maintain your streak.
                 </motion.p>
              </div>
              
              {/* Overall Progress Circular Display */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                className="shrink-0 flex flex-col items-center justify-center p-8 bg-white rounded-full shadow-2xl shadow-teal-500/10 border-8 border-teal-50 w-56 h-56 relative"
              >
                 <div className="absolute inset-0 border-8 border-teal-500 rounded-full border-t-transparent border-l-transparent rotate-45"></div>
                 <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{overallScore}<span className="text-2xl text-teal-600">%</span></h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Overall Progress</p>
              </motion.div>
           </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {kpis.map((kpi, index) => (
             <motion.div 
               key={index}
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
               className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-center text-center group"
             >
                <div className={`w-16 h-16 rounded-3xl ${kpi.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                   <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">{kpi.value}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kpi.title}</p>
             </motion.div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Course Progress Section */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Target className="w-6 h-6 text-teal-600" />
                    Enrolled Courses Progress
                 </h2>
                 <button className="text-sm font-bold text-teal-600 hover:text-teal-700">View All</button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-8">
                 {courseProgress.map((course, i) => (
                   <div key={i} className="group">
                      <div className="flex justify-between items-end mb-4">
                         <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{course.subject}</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                               {course.completed} / {course.total} Classes Completed
                            </p>
                         </div>
                         <span className="text-2xl font-black text-gray-900">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           whileInView={{ width: `${course.progress}%` }}
                           viewport={{ once: true }}
                           transition={{ duration: 1, ease: "easeOut" }}
                           className={`h-full rounded-full ${course.color}`}
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Quick Actions & Activity */}
           <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                 <Activity className="w-6 h-6 text-red-500" />
                 Continue Learning
              </h2>
              
              {latestLive.length > 0 ? (
                <div className="bg-teal-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-teal-600/20">
                   <div className="relative z-10">
                      <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block mb-6 backdrop-blur-sm">
                         {latestLive[0].status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                      </div>
                      <h3 className="text-2xl font-black mb-2 leading-tight">{latestLive[0].title}</h3>
                      <p className="text-teal-50 text-sm font-medium mb-8">Instructor: {latestLive[0].instructor} • {latestLive[0].time}</p>
                      <Link href={latestLive[0].meetingLink} className="w-full py-4 bg-white text-teal-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg">
                         <Play className="w-5 h-5 fill-current" /> Join Session
                      </Link>
                   </div>
                   <Activity className="absolute -bottom-8 -right-8 w-40 h-40 text-white/10" />
                </div>
              ) : (
                <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                   <h3 className="text-xl font-bold mb-2">No Live Classes</h3>
                   <p className="text-gray-400 text-sm mb-6">Check back later for new scheduled sessions.</p>
                   <Link href="/dashboard/live" className="text-xs font-black uppercase tracking-widest text-teal-400 hover:underline">View Schedule</Link>
                </div>
              )}
              
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Exam Builder</h3>
                    <Link href="/dashboard/exams" className="text-xs font-bold text-primary-600 hover:underline">View All</Link>
                 </div>
                 <div className="space-y-4">
                    {latestExams.length > 0 ? latestExams.map((exam, i) => (
                      <Link href={`/exam/${exam.id}`} key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-all group">
                         <div className={`p-3 rounded-xl bg-primary-50`}>
                            <ClipboardList className={`w-5 h-5 text-primary-500`} />
                         </div>
                         <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{exam.title}</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{exam.subject} • {exam.duration}m</p>
                         </div>
                         <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-600" />
                      </Link>
                    )) : (
                      <div className="text-center py-6">
                         <p className="text-xs text-gray-400 font-medium">No new exams available</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Recent Achievements</h3>
                 <div className="space-y-4">
                    {[
                      { title: 'Perfect Score', desc: '100% in Anatomy Quiz', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                      { title: '7 Day Streak', desc: 'Consistent learning', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { title: 'Fast Learner', desc: 'Completed 5 classes today', icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
                    ].map((achievement, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                         <div className={`p-3 rounded-xl ${achievement.bg}`}>
                            <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-gray-900">{achievement.title}</h4>
                            <p className="text-xs text-gray-500 font-medium">{achievement.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

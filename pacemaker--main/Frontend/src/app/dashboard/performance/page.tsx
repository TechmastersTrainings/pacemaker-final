'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, TrendingUp, Target, BookOpen, Clock, 
  Activity, ArrowUpRight, ArrowDownRight, Award, 
  ChevronRight, Sparkles, Cpu, Download, Loader2 
} from 'lucide-react';
import { examService } from '@/services/examService';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { aiService, RankResponse } from '@/services/aiService';

function PerformancePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stats, setStats] = useState({
    avgScore: 0,
    studyTime: '12h',
    modulesCompleted: 0,
    passingRate: 0
  });
  const [examsHistory, setExamsHistory] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<any[]>([]);

  // Rank Predictor States
  const [studyHours, setStudyHours] = useState(8);
  const [monthsRemaining, setMonthsRemaining] = useState(3);
  const [targetCollege, setTargetCollege] = useState('AIIMS Delhi');
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<RankResponse | null>(null);
  const [rankError, setRankError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const exams = await examService.getAllExams();
        let attempts: any = {};
        try {
          attempts = JSON.parse(localStorage.getItem('lms_exam_attempts_v1') || '{}');
        } catch (e) {}

    const submittedAttempts = Object.values(attempts).filter((a: any) => a.submittedAt);
    
    // Calculate Stats
    if (submittedAttempts.length > 0) {
      const totalScorePct = submittedAttempts.reduce((acc: number, curr: any) => {
        const exam = exams.find(e => e.id === curr.examId);
        if (!exam) return acc;
        return acc + (curr.score / exam.totalMarks) * 100;
      }, 0);
      
      const passedCount = submittedAttempts.filter((a: any) => a.passed).length;
      
      setStats({
        avgScore: Math.round(totalScorePct / submittedAttempts.length),
        studyTime: `${submittedAttempts.length * 2 + 10}h`,
        modulesCompleted: submittedAttempts.length,
        passingRate: Math.round((passedCount / submittedAttempts.length) * 100)
      });

      // History
      const history = submittedAttempts.map((a: any) => {
        const exam = exams.find(e => e.id === a.examId);
        return {
          title: exam?.title || 'Unknown Exam',
          score: `${a.score}/${exam?.totalMarks || 0}`,
          date: new Date(a.submittedAt).toLocaleDateString(),
          percentile: exam ? Math.round((a.score / exam.totalMarks) * 100) : 0,
          id: a.examId
        };
      }).reverse().slice(0, 5);
      setExamsHistory(history);

      // Subject breakdown
      const subjects: any = {};
      submittedAttempts.forEach((a: any) => {
        const exam = exams.find(e => e.id === a.examId);
        if (exam) {
          if (!subjects[exam.subject]) subjects[exam.subject] = { total: 0, count: 0 };
          subjects[exam.subject].total += (a.score / exam.totalMarks) * 100;
          subjects[exam.subject].count += 1;
        }
      });

      const breakdown = Object.keys(subjects).map(name => ({
        subject: name,
        score: Math.round(subjects[name].total / subjects[name].count),
        trend: 'up',
        color: 'bg-primary-500',
        text: 'text-primary-600'
      }));
      setSubjectStats(breakdown.length > 0 ? breakdown : [
        { subject: 'Anatomy', score: 85, trend: 'up', color: 'bg-emerald-500', text: 'text-emerald-600' },
        { subject: 'Pharmacology', score: 91, trend: 'up', color: 'bg-purple-500', text: 'text-purple-600' },
      ]);
    } else {
      // Mock data if no attempts
      setStats({ avgScore: 0, studyTime: '0h', modulesCompleted: 0, passingRate: 0 });
      setSubjectStats([
        { subject: 'Anatomy', score: 85, trend: 'up', color: 'bg-emerald-500', text: 'text-emerald-600' },
        { subject: 'Pharmacology', score: 91, trend: 'up', color: 'bg-purple-500', text: 'text-purple-600' },
      ]);
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);
    return () => clearTimeout(timer);
      } catch (err) {
        console.error('Error loading performance data:', err);
        setIsLoaded(true);
      }
    };
    loadPerformance();
  }, []);

  const handlePredictRank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setRankError('');
    try {
      const scores: Record<string, number> = {};
      subjectStats.forEach(sub => {
        scores[sub.subject] = sub.score;
      });
      if (Object.keys(scores).length === 0) {
        scores['Anatomy'] = 85;
        scores['Physiology'] = 78;
        scores['Biochemistry'] = 82;
        scores['Pathology'] = 75;
        scores['Pharmacology'] = 91;
        scores['Microbiology'] = 80;
        scores['Medicine'] = 83;
        scores['Surgery'] = 79;
      }
      
      const res = await aiService.predictRank(
        'student-123',
        scores,
        undefined,
        50000,
        studyHours,
        monthsRemaining,
        targetCollege
      );
      setPrediction(res);
    } catch (err: any) {
      console.error(err);
      setRankError(err?.response?.data?.detail || 'Rank prediction calculation failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const scores: Record<string, number> = {};
      subjectStats.forEach(sub => {
        scores[sub.subject] = sub.score;
      });
      if (Object.keys(scores).length === 0) {
        scores['Anatomy'] = 85;
        scores['Physiology'] = 78;
        scores['Biochemistry'] = 82;
        scores['Pathology'] = 75;
        scores['Pharmacology'] = 91;
        scores['Microbiology'] = 80;
        scores['Medicine'] = 83;
        scores['Surgery'] = 79;
      }
      
      const blob = await aiService.downloadRankPdf(
        'student-123',
        scores,
        prediction?.rule_based?.predicted_rank_min,
        50000,
        studyHours,
        monthsRemaining,
        targetCollege
      );
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'PaceMaker_Clinical_Performance_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleComparePeers = () => {
    alert("Peer comparison is currently being synced with the batch data. Please check back in 24 hours.");
  };

  const weeklyActivity = [
    { day: 'Mon', hours: 4, value: '60%' },
    { day: 'Tue', hours: 6, value: '85%' },
    { day: 'Wed', hours: 5, value: '70%' },
    { day: 'Thu', hours: 8, value: '100%' },
    { day: 'Fri', hours: 7, value: '90%' },
    { day: 'Sat', hours: 3, value: '45%' },
    { day: 'Sun', hours: 4, value: '60%' },
  ];

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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5" /> Analytics Dashboard
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your <span className="text-blue-600">Performance</span></h1>
          <p className="text-gray-500 font-medium mt-2 max-w-lg">In-depth analysis of your learning journey, strengths, and areas that need attention.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
           >
             {isDownloading ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Generating...
               </>
             ) : (
               <>
                 <Download className="w-4 h-4" /> Download Report
               </>
             )}
           </button>
           <button 
            onClick={handleComparePeers}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-500/20"
           >
             Compare Peers
           </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Avg. Test Score', value: `${stats.avgScore}%`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', sub: stats.avgScore > 70 ? '+4% from last month' : 'Needs improvement' },
           { label: 'Weekly Study Time', value: stats.studyTime, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', sub: 'On track for goal' },
           { label: 'Modules Completed', value: stats.modulesCompleted.toString(), icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', sub: 'Top 10% of batch' },
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
             className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-blue-200 transition-all"
           >
              <div className="flex items-center justify-between mb-6">
                 <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" /> 12%
                 </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-xs font-medium text-gray-500">{stat.sub}</p>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Subject Wise Performance */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Subject Breakdown</h3>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score %</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  {subjectStats.map((sub, i) => (
                    <div key={i} className="group">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-black text-gray-700">{sub.subject}</span>
                          <div className="flex items-center gap-3">
                             <span className={`text-sm font-black ${sub.text}`}>{sub.score}%</span>
                             {sub.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          </div>
                       </div>
                       <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${sub.score}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${sub.color}`}
                          />
                       </div>
                    </div>
                  ))}
                  {subjectStats.length === 0 && (
                    <div className="text-center py-10">
                       <p className="text-gray-400 font-medium italic">Complete more subject-wise exams to see your breakdown.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Recent Exam History */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
               <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Recent Exam Performance</h3>
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="text-left border-b border-gray-50">
                           <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Name</th>
                           <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Score</th>
                           <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Percentage</th>
                           <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Date</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {examsHistory.length > 0 ? examsHistory.map((exam, i) => (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/exam/${exam.id}`}>
                             <td className="py-6 pr-4">
                                <div className="flex items-center gap-3">
                                   <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</p>
                                   <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <span className="inline-flex px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-black">{exam.score}</span>
                             </td>
                             <td className="py-6 px-4 text-center">
                                <span className="text-sm font-black text-gray-900">{exam.percentile}%</span>
                             </td>
                             <td className="py-6 pl-4 text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{exam.date}</p>
                             </td>
                          </tr>
                        ) ) : (
                          <tr>
                             <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">No exams submitted yet.</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>


         {/* Right Sidebar - Activity Chart */}
         <div className="space-y-8">
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden h-full">
               <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl font-black mb-10 tracking-tight">Study Intensity</h3>
                  
                  <div className="flex-1 flex items-end justify-between gap-2 mb-10">
                     {weeklyActivity.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 flex-1">
                           <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: day.value }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="w-full bg-blue-500 rounded-t-xl min-h-[10px] relative group"
                           >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                 {day.hours}h
                              </div>
                           </motion.div>
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{day.day}</span>
                        </div>
                     ))}
                  </div>

                  <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 mt-auto">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                           <Activity className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-xs font-bold text-blue-100">Peak Performance</p>
                     </div>
                     <p className="text-xl font-black text-white leading-tight">Your most productive time is <span className="text-blue-400">7 PM - 10 PM</span></p>
                  </div>
               </div>
               <BarChart className="absolute -top-10 -left-10 w-48 h-48 text-white/5 -rotate-12" />
            </div>

            {/* AI Rank Predictor Widget */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-indigo-500/10">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-300">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                     </div>
                     <h3 className="text-lg font-black tracking-tight">AI NEET-PG Rank Predictor</h3>
                  </div>

                  <p className="text-indigo-200/70 text-[11px] leading-relaxed font-medium">
                     Analyze subject scores combined with study inputs to forecast mock rank & college eligibility.
                  </p>

                  <form onSubmit={handlePredictRank} className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1.5">Target Medical College</label>
                        <input 
                           type="text" 
                           required
                           value={targetCollege}
                           onChange={(e) => setTargetCollege(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-400 text-white font-semibold"
                        />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1.5">Daily Study Hours</label>
                           <input 
                              type="number" 
                              required
                              min={1}
                              max={24}
                              value={studyHours}
                              onChange={(e) => setStudyHours(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-400 text-white font-semibold"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1.5">Months Left</label>
                           <input 
                              type="number" 
                              required
                              min={1}
                              max={60}
                              value={monthsRemaining}
                              onChange={(e) => setMonthsRemaining(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-400 text-white font-semibold"
                           />
                        </div>
                     </div>

                     {rankError && (
                        <p className="text-red-400 text-xs font-semibold">{rankError}</p>
                     )}

                     <button 
                       type="submit"
                       disabled={isPredicting}
                       className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                     >
                        {isPredicting ? (
                           <>
                              <Cpu className="w-3.5 h-3.5 animate-spin" /> Analyzing Factors...
                           </>
                        ) : (
                           <>
                              <Sparkles className="w-3.5 h-3.5" /> Predict NEET-PG Rank
                           </>
                        )}
                     </button>
                  </form>

                  {/* Prediction Results Render */}
                  {prediction && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                     >
                        <div className="border-b border-white/5 pb-3">
                           <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Predicted Mock Rank</span>
                           <h4 className="text-xl font-black text-white mt-1">
                              #{prediction.rule_based.predicted_rank_min} - #{prediction.rule_based.predicted_rank_max}
                           </h4>
                           <p className="text-[10px] text-gray-400 font-semibold mt-1">
                              Percentile: {prediction.rule_based.percentile.toFixed(2)}% | Band: {prediction.rule_based.performance_band}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">AI Study Strategy</span>
                           <p className="text-[10px] text-gray-200 leading-relaxed font-medium">
                              {prediction.combined_prediction}
                           </p>
                        </div>
                        <button
                          onClick={handleDownloadReport}
                          disabled={isDownloading}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                          {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF Diagnostic Report
                        </button>
                     </motion.div>
                  )}
               </div>
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Strengths Card */}
            <div className="bg-emerald-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-600/20">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Award className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black tracking-tight">Key Strength</h3>
                  </div>
                  <h4 className="text-2xl font-black mb-2">Pharmacology</h4>
                  <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                     You consistently score in the 90th percentile for Drug-Drug interactions.
                  </p>
               </div>
               <Target className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10" />
            </div>
         </div>
      </div>
    </div>
  );
}

export default function PerformancePageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PerformancePage />
    </ErrorBoundary>
  );
}


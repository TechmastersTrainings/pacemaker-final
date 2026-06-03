'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, CheckCircle2, ChevronLeft, ChevronRight, 
  Flag, AlertCircle, Trash2, Save, Send,
  Maximize2, X, Bookmark, BookmarkCheck,
  RefreshCcw, Trophy, BookOpen, User,
  ChevronDown, Timer, LayoutGrid, FileText, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  examService,
  Exam, ExamAttempt, ExamQuestion 
} from '@/services/examService';

export default function StudentMockExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [examState, setExamState] = useState<'loading' | 'instructions' | 'active' | 'results'>('loading');
  
  // Attempt Data
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  
  // UI States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showResultsDetail, setShowResultsDetail] = useState(false);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const data = await examService.getExamById(examId);
        if (!data) {
          router.push('/dashboard');
          return;
        }
        setExam(data);
        
        // Check for existing progress (client-side)
        const savedAttempt = examService.getAttempt(examId);
        if (savedAttempt && !savedAttempt.submittedAt) {
          setAttempt(savedAttempt);
          const elapsed = (Date.now() - new Date(savedAttempt.startedAt).getTime()) / 1000;
          const remaining = (data.duration * 60) - elapsed;
          if (remaining > 0) {
            setTimeLeft(Math.floor(remaining));
            setExamState('active');
          } else {
            handleAutoSubmit(savedAttempt);
          }
        } else {
          setExamState('instructions');
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        router.push('/dashboard');
      }
    };
    loadExam();
  }, [examId, router]);

  // Timer Logic
  useEffect(() => {
    if (examState !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(attempt!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, attempt]);

  const startExam = () => {
    const newAttempt: ExamAttempt = {
      examId,
      answers: {},
      markedForReview: [],
      startedAt: new Date().toISOString()
    };
    setAttempt(newAttempt);
    examService.saveAttempt(newAttempt);
    setTimeLeft(exam!.duration * 60);
    setExamState('active');
  };

  const handleAnswer = (questionId: string, value: any) => {
    if (!attempt) return;
    const updated = {
      ...attempt,
      answers: { ...attempt.answers, [questionId]: value }
    };
    setAttempt(updated);
    examService.saveAttempt(updated);
  };

  const toggleMarkForReview = (questionId: string) => {
    if (!attempt) return;
    const isMarked = attempt.markedForReview.includes(questionId);
    const updated = {
      ...attempt,
      markedForReview: isMarked 
        ? attempt.markedForReview.filter(id => id !== questionId)
        : [...attempt.markedForReview, questionId]
    };
    setAttempt(updated);
    examService.saveAttempt(updated);
  };

  const clearResponse = (questionId: string) => {
    if (!attempt) return;
    const newAnswers = { ...attempt.answers };
    delete newAnswers[questionId];
    const updated = { ...attempt, answers: newAnswers };
    setAttempt(updated);
    examService.saveAttempt(updated);
  };

  const calculateScore = (currentAttempt: ExamAttempt) => {
    if (!exam) return 0;
    let score = 0;
    exam.questions.forEach(q => {
      const studentAnswer = currentAttempt.answers[q.id];
      if (q.type === 'mcq') {
        if (studentAnswer === q.correct) score += q.marks;
      } else if (q.type === 'truefalse') {
        if (studentAnswer === q.tfCorrect) score += q.marks;
      }
    });
    return score;
  };

  const handleFinalSubmit = () => {
    if (!attempt || !exam) return;
    const score = calculateScore(attempt);
    const passed = (score / exam.questions.reduce((sum, q) => sum + q.marks, 0)) * 100 >= exam.passingPercentage;
    
    const finalAttempt: ExamAttempt = {
      ...attempt,
      submittedAt: new Date().toISOString(),
      score,
      passed
    };
    
    setAttempt(finalAttempt);
    examService.saveAttempt(finalAttempt);
    setExamState('results');
    setIsSubmitModalOpen(false);
  };

  const handleAutoSubmit = (currAttempt: ExamAttempt) => {
    const score = calculateScore(currAttempt);
    const passed = (score / exam!.questions.reduce((sum, q) => sum + q.marks, 0)) * 100 >= exam!.passingPercentage;
    
    const finalAttempt: ExamAttempt = {
      ...currAttempt,
      submittedAt: new Date().toISOString(),
      score,
      passed
    };
    examService.saveAttempt(finalAttempt);
    setAttempt(finalAttempt);
    setExamState('results');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (examState === 'loading' || !exam) return null;

  // Instructions View
  if (examState === 'instructions') {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="p-12 md:p-20">
            <div className="flex items-center gap-4 text-primary-600 font-bold text-sm tracking-widest uppercase mb-8">
              <BookOpen className="w-5 h-5" />
              Examination Portal
            </div>
            
            <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">{exam.title}</h1>
            <p className="text-xl text-gray-600 font-medium leading-relaxed mb-12">{exam.description || 'No specific description provided for this examination.'}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { label: 'Total Duration', value: `${exam.duration} Minutes`, icon: Clock, color: 'bg-blue-50 text-blue-600' },
                { label: 'Total Questions', value: `${exam.questions.length} Items`, icon: FileText, color: 'bg-teal-50 text-teal-600' },
                { label: 'Passing Score', value: `${exam.passingPercentage}% Required`, icon: Trophy, color: 'bg-amber-50 text-amber-600' }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                  <span className="text-lg font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary-50 rounded-[2rem] p-10 mb-16 border border-primary-100">
               <h4 className="font-black text-primary-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> Exam Instructions
               </h4>
               <ul className="space-y-4">
                  {[
                    'You cannot pause the timer once the exam starts.',
                    'The exam will be auto-submitted when the time expires.',
                    'Your progress is saved automatically if you refresh the page.',
                    'Ensure you have a stable internet connection for submission.'
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-4 text-sm font-bold text-primary-800">
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 text-[10px]">
                        {i + 1}
                      </div>
                      {rule}
                    </li>
                  ))}
               </ul>
            </div>

            <div className="flex justify-center">
               <button 
                onClick={startExam}
                className="px-16 py-6 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-4 group"
               >
                  Begin Assessment
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Exam View
  if (examState === 'active' && attempt) {
    const currentQ = exam.questions[currentQIndex];
    const isAnswered = attempt.answers[currentQ.id] !== undefined;
    const isMarked = attempt.markedForReview.includes(currentQ.id);

    return (
      <div className="fixed inset-0 bg-[#fdfbf7] flex flex-col z-[200]">
        {/* Exam Header */}
        <header className="h-24 bg-white border-b border-gray-100 px-10 flex items-center justify-between shrink-0 shadow-sm">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center">
                    <span className="text-white font-black text-lg">PM</span>
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{exam.title}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{exam.subject} • Mock Exam</p>
                 </div>
              </div>

              <div className="h-10 w-px bg-gray-100 mx-4" />

              <div className="flex items-center gap-6">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Remaining</span>
                    <div className={`text-2xl font-black tabular-nums ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                       {formatTime(timeLeft)}
                    </div>
                 </div>
                 <div className="h-8 w-8 rounded-full border-4 border-gray-100 border-t-primary-600 animate-[spin_10s_linear_infinite]" />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 transition-all active:scale-95"
              >
                 Submit Final Exam
              </button>
           </div>
        </header>

        {/* Main Engine Layout */}
        <div className="flex-1 flex overflow-hidden">
           {/* Question Content Area */}
           <div className="flex-1 overflow-y-auto bg-white p-12 md:p-20 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                       <span className="text-4xl font-black text-gray-200">Question {currentQIndex + 1}</span>
                       <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                          {currentQ.type}
                       </span>
                    </div>
                    <div className="text-sm font-bold text-gray-400">
                       {currentQ.marks} Marks
                    </div>
                 </div>

                 <h3 className="text-3xl font-bold text-gray-900 leading-snug mb-12">
                    {currentQ.text}
                 </h3>

                 {/* Question Types */}
                 <div className="space-y-6">
                    {currentQ.type === 'mcq' && currentQ.options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(currentQ.id, i)}
                        className={`w-full p-8 rounded-[2rem] border-2 text-left transition-all flex items-center gap-6 group ${
                          attempt.answers[currentQ.id] === i 
                            ? 'bg-primary-50 border-primary-500 shadow-xl shadow-primary-500/5' 
                            : 'bg-white border-gray-100 hover:border-primary-200 hover:bg-gray-50/50'
                        }`}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all ${
                            attempt.answers[currentQ.id] === i 
                              ? 'bg-primary-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600'
                         }`}>
                            {String.fromCharCode(65 + i)}
                         </div>
                         <span className={`text-xl font-bold ${attempt.answers[currentQ.id] === i ? 'text-primary-900' : 'text-gray-700'}`}>
                            {opt}
                         </span>
                      </button>
                    ))}

                    {currentQ.type === 'truefalse' && (
                       <div className="flex flex-col gap-6">
                          {[true, false].map((val) => (
                            <button
                              key={val.toString()}
                              onClick={() => handleAnswer(currentQ.id, val)}
                              className={`w-full p-8 rounded-[2rem] border-2 text-left transition-all flex items-center gap-6 ${
                                attempt.answers[currentQ.id] === val
                                  ? 'bg-primary-50 border-primary-500 shadow-xl' 
                                  : 'bg-white border-gray-100 hover:border-primary-200'
                              }`}
                            >
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                                  attempt.answers[currentQ.id] === val 
                                    ? 'bg-primary-600 text-white shadow-lg' 
                                    : 'bg-gray-100 text-gray-400'
                               }`}>
                                  {val ? 'T' : 'F'}
                               </div>
                               <span className={`text-xl font-bold ${attempt.answers[currentQ.id] === val ? 'text-primary-900' : 'text-gray-700'}`}>
                                  {val ? 'True' : 'False'}
                               </span>
                            </button>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Question Footer Controls */}
                 <div className="mt-20 pt-10 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <button 
                        onClick={() => toggleMarkForReview(currentQ.id)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                          isMarked ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                       >
                          {isMarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                          {isMarked ? 'Marked for Review' : 'Mark for Review'}
                       </button>
                       <button 
                        onClick={() => clearResponse(currentQ.id)}
                        className="flex items-center gap-2 px-6 py-4 text-gray-400 hover:text-red-500 font-bold text-sm transition-all"
                       >
                          <RefreshCcw className="w-4 h-4" /> Clear Response
                       </button>
                    </div>

                    <div className="flex items-center gap-4">
                       <button 
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                        className="p-5 rounded-2xl border border-gray-200 text-gray-400 hover:text-primary-600 hover:border-primary-600 disabled:opacity-20 transition-all"
                       >
                          <ChevronLeft className="w-6 h-6" />
                       </button>
                       <button 
                        disabled={currentQIndex === exam.questions.length - 1}
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-primary-600 disabled:opacity-20 transition-all flex items-center gap-3"
                       >
                          Next Question
                          <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Navigator Sidebar */}
           <div className="w-[450px] border-l border-gray-100 bg-[#fdfbf7] flex flex-col p-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 mb-10">
                 <LayoutGrid className="w-6 h-6 text-primary-600" />
                 <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Question Navigation</h4>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Answered</span>
                    <span className="text-xl font-black text-teal-600">{Object.keys(attempt.answers).length}</span>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Review</span>
                    <span className="text-xl font-black text-amber-600">{attempt.markedForReview.length}</span>
                 </div>
              </div>

              {/* Navigator Grid */}
              <div className="grid grid-cols-5 gap-4">
                 {exam.questions.map((q, i) => {
                    const ans = attempt.answers[q.id] !== undefined;
                    const rev = attempt.markedForReview.includes(q.id);
                    const isCurrent = currentQIndex === i;

                    let btnClass = "bg-white border-gray-100 text-gray-400";
                    if (rev) btnClass = "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20";
                    else if (ans) btnClass = "bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20";
                    else if (isCurrent) btnClass = "border-primary-500 text-primary-600 bg-primary-50 font-black";

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentQIndex(i)}
                        className={`h-14 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center relative ${btnClass} ${isCurrent ? 'ring-4 ring-primary-500/10 scale-110 z-10' : 'hover:border-primary-300'}`}
                      >
                         {i + 1}
                         {isCurrent && <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary-600" />}
                      </button>
                    );
                 })}
              </div>

              {/* Legend */}
              <div className="mt-auto pt-10 border-t border-gray-100 grid grid-cols-2 gap-y-4 gap-x-2">
                 {[
                   { label: 'Answered', color: 'bg-teal-500' },
                   { label: 'Marked', color: 'bg-amber-500' },
                   { label: 'Current', color: 'bg-primary-50 border-primary-500 border' },
                   { label: 'Not Visited', color: 'bg-white border-gray-100 border' }
                 ].map((l, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-md ${l.color}`} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{l.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Submit Confirmation Modal */}
        <AnimatePresence>
           {isSubmitModalOpen && (
             <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubmitModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-12 text-center"
                >
                   <div className="w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-8">
                      <Send className="w-8 h-8" />
                   </div>
                   <h3 className="text-3xl font-black text-gray-900 mb-4">Submit Final Exam?</h3>
                   <p className="text-gray-500 font-medium mb-10">
                      You have answered <span className="text-teal-600 font-bold">{Object.keys(attempt.answers).length}</span> out of <span className="font-bold">{exam.questions.length}</span> questions.
                      You cannot change your answers after submission.
                   </p>
                   <div className="flex flex-col gap-4">
                      <button 
                        onClick={handleFinalSubmit}
                        className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 transition-all"
                      >
                         Yes, Submit Now
                      </button>
                      <button 
                        onClick={() => setIsSubmitModalOpen(false)}
                        className="w-full py-5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-black transition-all"
                      >
                         Wait, Go Back
                      </button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </div>
    );
  }

  // Results View
  if (examState === 'results' && attempt) {
    const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0);
    const scorePct = (attempt.score! / totalMarks) * 100;

    return (
      <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-12">
         <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 mb-10"
            >
               <div className="p-12 md:p-20 flex flex-col items-center text-center">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-10 shadow-2xl ${attempt.passed ? 'bg-teal-500 text-white rotate-12' : 'bg-red-500 text-white -rotate-12'}`}>
                     {attempt.passed ? <Trophy className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                  </div>

                  <h1 className="text-5xl font-black text-gray-900 mb-4">
                    {attempt.passed ? 'Excellent Work!' : 'Keep Practicing!'}
                  </h1>
                  <p className="text-xl text-gray-500 font-medium mb-16">
                    You have completed the <span className="font-bold text-gray-900">{exam.title}</span>.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
                     {[
                       { label: 'Score Obtained', value: `${attempt.score} / ${totalMarks}`, icon: FileText, color: 'text-primary-600' },
                       { label: 'Percentage', value: `${scorePct.toFixed(1)}%`, icon: BarChart3, color: 'text-blue-600' },
                       { label: 'Passing Status', value: attempt.passed ? 'Passed' : 'Failed', icon: CheckCircle2, color: attempt.passed ? 'text-teal-600' : 'text-red-600' },
                       { label: 'Time Spent', value: '24:12 Mins', icon: Clock, color: 'text-amber-600' }
                     ].map((stat, i) => (
                       <div key={i} className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col items-center">
                          <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                          <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                       </div>
                     ))}
                  </div>

                  <div className="mt-20 flex flex-wrap justify-center gap-6">
                     <button 
                      onClick={() => setShowResultsDetail(!showResultsDetail)}
                      className="px-12 py-5 bg-gray-900 text-white rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:bg-primary-600 transition-all"
                     >
                        <BookOpen className="w-5 h-5" />
                        {showResultsDetail ? 'Hide Review' : 'Detailed Review'}
                     </button>
                     <button 
                      onClick={() => { examService.clearAttempt(examId); window.location.reload(); }}
                      className="px-12 py-5 bg-white border-2 border-gray-100 text-gray-900 rounded-[2rem] font-black flex items-center gap-3 hover:border-primary-600 hover:text-primary-600 transition-all"
                     >
                        <RefreshCcw className="w-5 h-5" /> Retake Exam
                     </button>
                     <button 
                      onClick={() => router.push('/dashboard')}
                      className="px-12 py-5 bg-white border-2 border-gray-100 text-gray-400 rounded-[2rem] font-black hover:bg-gray-50 transition-all"
                     >
                        Return to Dashboard
                     </button>
                  </div>
               </div>
            </motion.div>

            {/* Detailed Review Section */}
            <AnimatePresence>
               {showResultsDetail && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="space-y-8"
                  >
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">
                           <LayoutGrid className="w-4 h-4 text-primary-600" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Question Wise Breakdown</h3>
                     </div>

                     {exam.questions.map((q, idx) => {
                        const studentAnswer = attempt.answers[q.id];
                        let isCorrect = false;
                        if (q.type === 'mcq') isCorrect = studentAnswer === q.correct;
                        else if (q.type === 'truefalse') isCorrect = studentAnswer === q.tfCorrect;

                        return (
                          <div key={q.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm overflow-hidden relative">
                             <div className={`absolute left-0 top-0 bottom-0 w-2 ${isCorrect ? 'bg-teal-500' : 'bg-red-500'}`} />
                             
                             <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                   <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {idx + 1}</span>
                                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      isCorrect ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'
                                   }`}>
                                      {isCorrect ? 'Correct' : 'Incorrect'}
                                   </span>
                                </div>
                                <div className="text-sm font-bold text-gray-400">{q.marks} Marks</div>
                             </div>

                             <h4 className="text-2xl font-bold text-gray-900 mb-8 leading-snug">{q.text}</h4>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {q.type === 'mcq' && q.options?.map((opt, i) => (
                                  <div 
                                    key={i} 
                                    className={`p-5 rounded-2xl border flex items-center gap-4 ${
                                      i === q.correct ? 'bg-teal-50 border-teal-500 text-teal-700' : 
                                      (studentAnswer === i && !isCorrect) ? 'bg-red-50 border-red-500 text-red-700' : 
                                      'bg-gray-50 border-gray-100 text-gray-500'
                                    }`}
                                  >
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                        i === q.correct ? 'bg-teal-500 text-white' : 
                                        (studentAnswer === i && !isCorrect) ? 'bg-red-500 text-white' : 
                                        'bg-white text-gray-400'
                                     }`}>
                                        {String.fromCharCode(65 + i)}
                                     </div>
                                     <span className="font-bold text-sm">{opt}</span>
                                  </div>
                                ))}

                                {q.type === 'truefalse' && [true, false].map((val) => (
                                  <div 
                                    key={val.toString()}
                                    className={`p-5 rounded-2xl border flex items-center gap-4 ${
                                      val === q.tfCorrect ? 'bg-teal-50 border-teal-500 text-teal-700' : 
                                      (studentAnswer === val && !isCorrect) ? 'bg-red-50 border-red-500 text-red-700' : 
                                      'bg-gray-50 border-gray-100 text-gray-500'
                                    }`}
                                  >
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                        val === q.tfCorrect ? 'bg-teal-500 text-white' : 
                                        (studentAnswer === val && !isCorrect) ? 'bg-red-500 text-white' : 
                                        'bg-white text-gray-400'
                                     }`}>
                                        {val ? 'T' : 'F'}
                                     </div>
                                     <span className="font-bold text-sm">{val ? 'True' : 'False'}</span>
                                  </div>
                                ))}
                             </div>

                             {q.explanation && (
                                <div className="p-8 bg-amber-50/50 rounded-2xl border border-amber-100">
                                   <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <HelpCircle className="w-4 h-4" /> Professional Explanation
                                   </h5>
                                   <p className="text-sm font-medium text-amber-900 leading-relaxed">{q.explanation}</p>
                                </div>
                             )}
                          </div>
                        );
                     })}
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    );
  }

  return null;
}

function BarChart3(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  );
}

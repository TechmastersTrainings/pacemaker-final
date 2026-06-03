'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Database, ChevronRight, BookOpen, 
  Activity, GraduationCap, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, HelpCircle, Trophy,
  Clock, Filter, Play, BarChart, Eye, Download, FileText, X, Sparkles, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';
import { aiService } from '@/services/aiService';

type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctOption: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  createdAt: string;
};

type UploadedFile = {
  id: string;
  name: string;
  type: 'json' | 'pdf';
  size: string;
  status: 'Processing' | 'Ready' | 'Extracting MCQs';
  timestamp: string;
  file?: File;
  folder?: string;
};

const INITIAL_QUESTIONS: Question[] = [
  {
    id: '1',
    subject: 'Anatomy',
    topic: 'Upper Limb',
    difficulty: 'Medium',
    questionText: 'Which of the following nerves is most commonly injured in a fracture of the surgical neck of the humerus?',
    options: {
      a: 'Radial nerve',
      b: 'Axillary nerve',
      c: 'Median nerve',
      d: 'Ulnar nerve'
    },
    correctOption: 'b',
    explanation: 'The axillary nerve and the posterior circumflex humeral artery pass through the quadrangular space and are closely related to the surgical neck of the humerus. Fractures in this region commonly lead to axillary nerve injury, resulting in paralysis of the deltoid and teres minor muscles.',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    subject: 'Physiology',
    topic: 'Cardiovascular',
    difficulty: 'Hard',
    questionText: 'During the cardiac cycle, the first heart sound (S1) is primarily caused by:',
    options: {
      a: 'Closure of semilunar valves',
      b: 'Opening of AV valves',
      c: 'Closure of atrioventricular (AV) valves',
      d: 'Rapid ventricular filling'
    },
    correctOption: 'c',
    explanation: 'S1 marks the beginning of systole and is caused by the sudden closure of the mitral and tricuspid valves as ventricular pressure exceeds atrial pressure.',
    createdAt: new Date().toISOString()
  }
];

function StudentQBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'quiz'>('browse');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedFile | null>(null);

  // AI MCQ states
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'exam-level'>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const subjects = ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Medicine', 'Surgery', 'AI Generated'];

  useEffect(() => {
    const saved = localStorage.getItem('lms_qbank_questions_v1');
    const savedFiles = localStorage.getItem('lms_qbank_files_v1');
    if (saved && JSON.parse(saved).length > 0) {
      setQuestions(JSON.parse(saved));
    } else {
      setQuestions(INITIAL_QUESTIONS);
      localStorage.setItem('lms_qbank_questions_v1', JSON.stringify(INITIAL_QUESTIONS));
    }
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error("Failed to parse files", e);
      }
    }
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  const filteredQuestions = questions.filter(q => 
    selectedSubject === 'All' || q.subject === selectedSubject
  );

  const startQuiz = () => {
    if (filteredQuestions.length === 0) return;
    setActiveTab('quiz');
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizScore(0);
    setShowResults(false);
  };

  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setGenerationError('');
    try {
      const res = await aiService.generateMCQ(aiTopic, aiCount, aiDifficulty);
      if (res && res.questions && res.questions.length > 0) {
        const formatted: Question[] = res.questions.map((q) => ({
          id: `ai-${q.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          subject: 'AI Generated',
          topic: res.topic,
          difficulty: (res.difficulty.charAt(0).toUpperCase() + res.difficulty.slice(1)) as any,
          questionText: q.question,
          options: {
            a: q.options.A,
            b: q.options.B,
            c: q.options.C,
            d: q.options.D,
          },
          correctOption: q.correct_answer.toLowerCase() as any,
          explanation: q.explanation,
          createdAt: new Date().toISOString(),
        }));

        // Merge with existing questions and persist to localStorage so Exam Builder can pick them up
        const existing: Question[] = JSON.parse(localStorage.getItem('lms_qbank_questions_v1') || '[]');
        const merged = [...existing.filter(q => q.subject !== 'AI Generated'), ...formatted];
        localStorage.setItem('lms_qbank_questions_v1', JSON.stringify(merged));
        
        setQuestions(formatted);
        setSelectedSubject('AI Generated');
        
        // Start quiz immediately
        setActiveTab('quiz');
        setCurrentQuizIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setQuizScore(0);
        setShowResults(false);
      } else {
        setGenerationError('Failed to generate questions. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.response?.data?.detail || 'An error occurred during quiz generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetQuestions = () => {
    const saved = localStorage.getItem('lms_qbank_questions_v1');
    if (saved) {
      setQuestions(JSON.parse(saved));
    } else {
      setQuestions(INITIAL_QUESTIONS);
    }
    setSelectedSubject('All');
  };

  const handleOptionSelect = (opt: 'a' | 'b' | 'c' | 'd') => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    if (opt === filteredQuestions[currentQuizIndex].correctOption) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuizIndex < filteredQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-xs font-black uppercase tracking-widest mb-6 border border-primary-100"
              >
                 <GraduationCap className="w-4 h-4" />
                 Adaptive Question Bank
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                 Master the <span className="text-primary-600">High-Yield</span> <br/>
                 Clinical Scenarios.
              </h1>
           </div>
           
           <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
              <button 
                onClick={() => setActiveTab('browse')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Browse Subjects
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Practice Quiz
              </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div 
              key="browse" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-12"
            >
               {/* Left Sidebar: Filters */}
               <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                     <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary-500" /> Subjects
                     </h3>
                      <div className="flex flex-col gap-2">
                        {['All', ...subjects].map(s => (
                          <button 
                            key={s} onClick={() => setSelectedSubject(s)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${selectedSubject === s ? 'bg-primary-50 text-primary-600 border border-primary-100' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                             {s}
                             <ChevronRight className={`w-4 h-4 transition-transform ${selectedSubject === s ? 'translate-x-1' : 'opacity-0'}`} />
                          </button>
                        ))}
                      </div>
                      {selectedSubject === 'AI Generated' && (
                         <button 
                           onClick={resetQuestions}
                           className="mt-4 w-full py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                         >
                           <X className="w-3.5 h-3.5" /> Restore Default QBank
                         </button>
                      )}
                  </div>

                  {/* AI Custom Quiz Generator Card */}
                  <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-purple-950/30 border border-purple-500/20">
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-2">
                           <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 text-purple-300">
                              <Sparkles className="w-5 h-5 animate-pulse" />
                           </div>
                           <h4 className="text-lg font-black tracking-tight">AI Custom Quiz</h4>
                        </div>
                        <p className="text-purple-200/70 text-[11px] leading-relaxed">
                           Generate custom high-yield questions on any medical topic instantly using Groq AI.
                        </p>
                        <form onSubmit={handleGenerateAiQuiz} className="space-y-4">
                           <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300 mb-1.5">Enter Topic</label>
                              <input 
                                 type="text" 
                                 required
                                 value={aiTopic}
                                 onChange={(e) => setAiTopic(e.target.value)}
                                 placeholder="e.g. Aortic Dissection, Malaria..." 
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 placeholder:text-white/20 text-white font-medium"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300 mb-1.5">Difficulty</label>
                                 <select 
                                    value={aiDifficulty}
                                    onChange={(e: any) => setAiDifficulty(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-purple-400 text-white font-semibold [&>option]:text-slate-900"
                                 >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="exam-level">Exam Level</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300 mb-1.5">Questions</label>
                                 <select 
                                    value={aiCount}
                                    onChange={(e) => setAiCount(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-purple-400 text-white font-semibold [&>option]:text-slate-900"
                                 >
                                    <option value={3}>3 Qs</option>
                                    <option value={5}>5 Qs</option>
                                    <option value={10}>10 Qs</option>
                                 </select>
                              </div>
                           </div>
                           
                           {generationError && (
                              <p className="text-red-400 text-xs font-semibold">{generationError}</p>
                           )}

                           <button 
                             type="submit"
                             disabled={isGenerating}
                             className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/20"
                           >
                              {isGenerating ? (
                                 <>
                                    <Cpu className="w-3.5 h-3.5 animate-spin" /> Generating...
                                 </>
                              ) : (
                                 <>
                                    <Sparkles className="w-3.5 h-3.5" /> Generate Quiz
                                 </>
                              )}
                           </button>
                        </form>
                     </div>
                     <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  </div>

                  {/* Document Library for Students */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                     <h4 className="font-black text-gray-900 text-sm flex items-center gap-2 uppercase tracking-widest">
                        <BookOpen className="w-4 h-4 text-primary-500" /> Study Resources
                     </h4>
                     <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {uploadedFiles.length > 0 ? Object.entries(
                          uploadedFiles.reduce((acc, file) => {
                            const key = file.folder || 'General Resources';
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(file);
                            return acc;
                          }, {} as Record<string, UploadedFile[]>)
                        ).map(([folderName, files]) => (
                          <div key={folderName} className="space-y-3">
                            <div className="flex items-center gap-2 px-1 mb-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                {folderName === 'General Resources' ? <Database className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                {folderName}
                              </span>
                            </div>
                            <div className="space-y-2 pl-2 border-l border-gray-100 ml-1.5">
                              {files.map(file => (
                                <div 
                                  key={file.id} 
                                  onClick={() => setSelectedDoc(file)}
                                  className="p-3 rounded-2xl border border-gray-50 hover:border-primary-100 bg-gray-50/30 hover:bg-white transition-all group cursor-pointer relative"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl ${file.type === 'json' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                      {file.type === 'json' ? <Database className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-900 truncate pr-6" title={file.name}>{file.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-medium">{file.size}</span>
                                      </div>
                                    </div>
                                    <Eye className="absolute right-3 top-3 w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                  </div>
                                  <div className="mt-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                      file.status === 'Ready' ? 'bg-green-50 text-green-600' : 'bg-primary-50 text-primary-600'
                                    }`}>
                                      {file.status === 'Extracting MCQs' ? 'AI Processing' : 'Reference'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No extra resources</p>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary-600/20">
                     <div className="relative z-10">
                        <h4 className="text-xl font-black mb-4">Start Session</h4>
                        <p className="text-primary-50 text-sm font-medium mb-8 opacity-90 leading-relaxed">
                           Focus on {selectedSubject === 'All' ? 'Mixed' : selectedSubject} topics with our adaptive practice mode.
                        </p>
                        <button 
                          onClick={startQuiz}
                          className="w-full py-4 bg-white text-primary-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                        >
                           <Play className="w-4 h-4 fill-current" /> Begin Practice
                        </button>
                     </div>
                     <Activity className="absolute -bottom-8 -right-8 w-32 h-32 text-white/10" />
                  </div>
               </div>

               {/* Right Side: Subjects List */}
               <div className="lg:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {filteredQuestions.length > 0 ? filteredQuestions.map((q, i) => (
                       <motion.div 
                         key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                         className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                       >
                          <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{q.subject}</span>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                  q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : 
                                  q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                  {q.difficulty}
                                </span>
                             </div>
                             <BookOpen className="w-5 h-5 text-gray-200 group-hover:text-primary-500 transition-colors" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-relaxed">{q.questionText}</h3>
                          <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-4">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{q.topic}</span>
                             <button 
                               onClick={() => { setActiveTab('quiz'); setCurrentQuizIndex(questions.indexOf(q)); setIsAnswered(false); setSelectedOption(null); }}
                               className="text-primary-600 hover:text-primary-700 text-sm font-black flex items-center gap-1 group/btn"
                             >
                               Solve Now <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                             </button>
                          </div>
                       </motion.div>
                     )) : (
                       <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center">
                          <HelpCircle className="w-16 h-16 text-gray-200 mb-6" />
                          <h3 className="text-2xl font-black text-gray-900">No content here yet</h3>
                          <p className="text-gray-500 max-w-xs mt-2 font-medium">Select a different subject or check back later for new high-yield content.</p>
                       </div>
                     )}
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
              className="max-w-4xl mx-auto"
            >
               {showResults ? (
                 <div className="bg-white p-12 md:p-20 rounded-[3rem] border border-gray-100 shadow-2xl text-center space-y-8">
                    <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-primary-500/10">
                       <Trophy className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Practice Session Complete!</h2>
                    <p className="text-gray-500 text-xl font-medium max-w-md mx-auto">Great job. Consistent practice is the key to mastering clinical exams.</p>
                    
                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mt-12">
                       <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Score</p>
                          <p className="text-3xl font-black text-primary-600">{quizScore}/{filteredQuestions.length}</p>
                       </div>
                       <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Accuracy</p>
                          <p className="text-3xl font-black text-teal-600">{Math.round((quizScore / filteredQuestions.length) * 100)}%</p>
                       </div>
                    </div>

                    <div className="pt-10 flex justify-center gap-4">
                       <button onClick={() => setActiveTab('browse')} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-transform">
                          Return to Library
                       </button>
                       <button onClick={startQuiz} className="px-10 py-5 bg-primary-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 shadow-xl shadow-primary-600/20 transition-transform">
                          Try Again
                       </button>
                    </div>
                 </div>
               ) : filteredQuestions.length > 0 ? (
                 <div className="space-y-8">
                    {/* Quiz Progress */}
                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-4">
                          <button onClick={() => setActiveTab('browse')} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                             <ArrowLeft className="w-5 h-5 text-gray-500" />
                          </button>
                          <div>
                             <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{filteredQuestions[currentQuizIndex].subject}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredQuestions[currentQuizIndex].topic}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-primary-600">Q {currentQuizIndex + 1} / {filteredQuestions.length}</p>
                          <div className="w-32 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }} animate={{ width: `${((currentQuizIndex + 1) / filteredQuestions.length) * 100}%` }}
                               className="h-full bg-primary-500"
                             />
                          </div>
                       </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white p-10 md:p-16 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                          <Database className="w-40 h-40" />
                       </div>
                       
                       <div className="relative z-10">
                          <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-snug mb-12">
                             {filteredQuestions[currentQuizIndex].questionText}
                          </h3>

                          <div className="grid grid-cols-1 gap-4 mb-12">
                             {Object.entries(filteredQuestions[currentQuizIndex].options).map(([key, value]) => {
                               const isCorrect = key === filteredQuestions[currentQuizIndex].correctOption;
                               const isSelected = selectedOption === key;
                               
                               let style = "border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-primary-200";
                               if (isAnswered) {
                                 if (isCorrect) style = "border-green-500 bg-green-50 text-green-700 shadow-sm shadow-green-500/10";
                                 else if (isSelected) style = "border-red-500 bg-red-50 text-red-700";
                                 else style = "border-gray-100 bg-white opacity-50";
                               } else if (isSelected) {
                                 style = "border-primary-500 bg-primary-50 text-primary-700";
                               }

                               return (
                                 <button 
                                   key={key} onClick={() => handleOptionSelect(key as any)}
                                   disabled={isAnswered}
                                   className={`w-full p-6 md:p-8 rounded-[2rem] border-2 flex items-center justify-between text-left transition-all duration-300 font-bold text-lg ${style}`}
                                 >
                                    <div className="flex items-center gap-6">
                                       <span className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 text-sm font-black transition-colors ${isSelected ? 'bg-current text-white border-transparent' : 'border-current/10'}`}>
                                          {key.toUpperCase()}
                                       </span>
                                       {value}
                                    </div>
                                    {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                                    {isAnswered && isSelected && !isCorrect && <AlertCircle className="w-6 h-6 text-red-500" />}
                                 </button>
                               );
                             })}
                          </div>

                          <AnimatePresence>
                             {isAnswered && (
                               <motion.div 
                                 initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                 className="overflow-hidden"
                               >
                                  <div className="p-8 md:p-10 bg-gray-900 rounded-[2.5rem] text-white">
                                     <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-primary-500 rounded-lg">
                                           <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-xl font-black tracking-tight uppercase">Detailed Explanation</h4>
                                     </div>
                                     <p className="text-gray-300 leading-relaxed font-medium mb-8 text-lg">
                                        {filteredQuestions[currentQuizIndex].explanation}
                                     </p>
                                     <button 
                                       onClick={nextQuestion}
                                       className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98]"
                                     >
                                        {currentQuizIndex < filteredQuestions.length - 1 ? 'Next Question' : 'View Session Summary'}
                                        <ArrowRight className="w-5 h-5" />
                                     </button>
                                  </div>
                               </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                 </div>
                 </div>
               ) : (
                 <div className="py-32 text-center">
                    <h3 className="text-2xl font-black text-gray-900">No questions found for this quiz</h3>
                    <button onClick={() => setActiveTab('browse')} className="mt-6 px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold">Back to Library</button>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Document Viewer Modal for Students */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDoc(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${selectedDoc.type === 'json' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {selectedDoc.type === 'json' ? <Database className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 truncate max-w-md">{selectedDoc.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedDoc.type} Resource</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-bold text-gray-400">{selectedDoc.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedDoc(null)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all group">
                    <X className="w-6 h-6 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
                {selectedDoc.type === 'pdf' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-12">
                     <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-primary-500" />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 mb-2">{selectedDoc.name}</h3>
                     <p className="text-gray-500 max-w-sm mb-8">This resource is available as part of your study module. Please contact your instructor for the printed version or live access.</p>
                     <button className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download Resource
                     </button>
                  </div>
                ) : (
                  <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl mb-8">
                         <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4" /> Question Bank Metadata
                         </h4>
                         <p className="text-amber-700/70 text-sm">This file contains structured MCQs already integrated into your practice library.</p>
                      </div>
                      <div className="p-12 border-2 border-dashed border-gray-200 rounded-[2.5rem] text-center">
                         <p className="text-gray-400 font-bold italic">Source questions are processed and available in the "Browse Subjects" tab.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentQBankPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <StudentQBankPage />
    </ErrorBoundary>
  );
}


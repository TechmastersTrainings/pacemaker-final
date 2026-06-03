'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, ClipboardList, Trash2, Edit3, X, 
  Settings2, Play, Layout, Save, HelpCircle, 
  ChevronRight, GripVertical, BookOpen, Clock, 
  CheckCircle2, AlertCircle, Copy, Eye, Share2,
  Trash, ArrowRight, Check, MinusCircle, Database, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  examService, Exam, ExamQuestion
} from '@/services/examService';

type QuestionType = 'mcq' | 'truefalse' | 'match';
const DEFAULT_SETTINGS = {
  shuffleQuestions: false,
  shuffleOptions: false,
  showExplanation: true,
  timerMode: 'countdown' as const,
  attemptsAllowed: 1 as const
};
const generateId = () => Math.random().toString(36).substring(2, 9);
import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

function AdminExamBuilder() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isListLoaded, setIsListLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Builder States
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'questions' | 'settings'>('details');
  
  // Question Bank Integration
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allExams = await examService.getAllExams();
        setExams(allExams);
      } catch (err) {
        console.error('Error fetching exams:', err);
      }
    
      // Load existing Q-Bank questions
      const savedBank = localStorage.getItem('lms_qbank_questions_v1');
      if (savedBank) {
        setBankQuestions(JSON.parse(savedBank));
      }
      setIsListLoaded(true);
    };
    fetchData();
  }, []);

  const refreshBankQuestions = () => {
    const savedBank = localStorage.getItem('lms_qbank_questions_v1');
    if (savedBank) {
      setBankQuestions(JSON.parse(savedBank));
    }
  };

  const handleCreateNew = () => {
    const newExam: Exam = {
      id: generateId(),
      title: '',
      subject: 'Anatomy',
      duration: 60,
      totalMarks: 0,
      passingPercentage: 50,
      description: '',
      questions: [],
      settings: { ...DEFAULT_SETTINGS },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 0
    };
    setEditingExam(newExam);
    setIsModalOpen(true);
    setActiveTab('details');
    refreshBankQuestions();
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam({ ...exam });
    setIsModalOpen(true);
    setActiveTab('details');
    refreshBankQuestions();
  };

  const handleSave = async () => {
    if (editingExam) {
      const updatedExam = { ...editingExam, updatedAt: new Date().toISOString() };
      try {
        await examService.createExam(updatedExam);
        const allExams = await examService.getAllExams();
        setExams(allExams);
      } catch (err) {
        console.error('Error saving exam:', err);
      }
      setIsModalOpen(false);
      setEditingExam(null);
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    const duplicated: Exam = {
      ...exam,
      id: generateId(),
      title: `${exam.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 0
    };
    try {
      await examService.createExam(duplicated);
      const allExams = await examService.getAllExams();
      setExams(allExams);
    } catch (err) {
      console.error('Error duplicating exam:', err);
    }
  };

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      // Note: Delete endpoint not available on backend yet, removing from local state
      setExams(prev => prev.filter(e => e.id !== id));
    }
  };

  // Builder Logic
  const addQuestion = (type: QuestionType) => {
    if (!editingExam) return;
    const newQ: ExamQuestion = {
      id: generateId(),
      type,
      text: 'New Question',
      marks: 1,
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      correct: type === 'mcq' ? 0 : undefined,
      tfCorrect: type === 'truefalse' ? true : undefined,
      leftItems: type === 'match' ? ['', '', ''] : undefined,
      rightItems: type === 'match' ? ['', '', ''] : undefined,
      matchAnswer: type === 'match' ? [0, 1, 2] : undefined
    };
    setEditingExam({
      ...editingExam,
      questions: [...editingExam.questions, newQ]
    });
  };

  const removeQuestion = (id: string) => {
    if (!editingExam) return;
    setEditingExam({
      ...editingExam,
      questions: editingExam.questions.filter(q => q.id !== id)
    });
  };

  const updateQuestion = (id: string, updates: Partial<ExamQuestion>) => {
    if (!editingExam) return;
    setEditingExam({
      ...editingExam,
      questions: editingExam.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    });
  };

  // Native Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const onDragStart = (index: number) => setDraggedIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (index: number) => {
    if (draggedIndex === null || !editingExam) return;
    const items = [...editingExam.questions];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setEditingExam({ ...editingExam, questions: items });
    setDraggedIndex(null);
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isListLoaded) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-10 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <AdminTableSkeleton />
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase mb-1">
            <Layout className="w-4 h-4" />
            Assessment Engine
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Exam <span className="text-primary-600">Builder</span></h1>
          <p className="text-gray-600 font-medium mt-1 text-lg">Design professional medical exams and mock tests.</p>
        </div>
        
        <button 
          onClick={handleCreateNew}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-500/20 active:scale-95 text-lg"
        >
          <Plus className="w-6 h-6" />
          Create New Exam
        </button>
      </div>

      {/* Search & List */}
      <div className="mb-8">
        <div className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search exams by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-3xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-lg font-medium transition-all text-gray-900 shadow-sm"
          />
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExams.map((exam) => (
          <motion.div 
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1.5 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-100">
                  {exam.subject}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  exam.status === 'published' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {exam.status}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 mb-4 line-clamp-1">{exam.title || 'Untitled Exam'}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">{exam.duration} Mins</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-bold">{exam.questions.length} Qs</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(exam)} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="Edit"><Edit3 className="w-5 h-5" /></button>
                  <button onClick={() => handleDuplicate(exam)} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Duplicate"><Copy className="w-5 h-5" /></button>
                  <button onClick={() => handleDelete(exam.id)} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete"><Trash2 className="w-5 h-5" /></button>
                </div>
                <Link href={`/exam/${exam.id}`} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-all flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredExams.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <ClipboardList className="w-16 h-16 text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-900">No exams created yet</h3>
            <p className="text-gray-500 mt-2">Start by creating your first assessment.</p>
          </div>
        )}
      </div>

      {/* Builder Modal */}
      <AnimatePresence>
        {isModalOpen && editingExam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[95vw] h-[90vh] bg-[#fdfbf7] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-12 py-8 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <input 
                      value={editingExam.title}
                      onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                      placeholder="Enter Exam Title..."
                      className="text-3xl font-black text-gray-900 outline-none bg-transparent placeholder:text-gray-300 w-[400px]"
                    />
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-black text-primary-600 uppercase tracking-widest">{editingExam.subject}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-xs font-bold text-gray-400">{editingExam.questions.length} Questions Added</span>
                    </div>
                  </div>

                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 ml-8">
                    {[
                      { id: 'details', label: '1. Basic Info', icon: ClipboardList },
                      { id: 'questions', label: '2. Question Builder', icon: Layout },
                      { id: 'settings', label: '3. Exam Settings', icon: Settings2 },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                          activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={() => setEditingExam({ ...editingExam, status: editingExam.status === 'published' ? 'draft' : 'published' })} className={`px-6 py-4 rounded-2xl font-bold transition-all border ${
                    editingExam.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {editingExam.status === 'published' ? 'Status: Published' : 'Status: Draft'}
                  </button>
                  <button onClick={handleSave} className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 flex items-center gap-2 hover:bg-primary-700 transition-all">
                    <Save className="w-5 h-5" />
                    Save & Finish
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden flex">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="flex-1 overflow-y-auto p-12 bg-white">
                    <div className="max-w-3xl mx-auto space-y-12">
                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Subject / Department</label>
                          <select 
                            value={editingExam.subject}
                            onChange={(e) => setEditingExam({ ...editingExam, subject: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-5 outline-none focus:border-primary-500 font-bold text-lg"
                          >
                            {['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Medicine', 'Surgery', 'OBG', 'Pediatrics'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Duration (Minutes)</label>
                          <input 
                            type="number"
                            value={editingExam.duration}
                            onChange={(e) => setEditingExam({ ...editingExam, duration: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-5 outline-none focus:border-primary-500 font-bold text-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Passing Percentage (%)</label>
                          <input 
                            type="number"
                            value={editingExam.passingPercentage}
                            onChange={(e) => setEditingExam({ ...editingExam, passingPercentage: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-5 outline-none focus:border-primary-500 font-bold text-lg"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Exam Description</label>
                          <textarea 
                            value={editingExam.description}
                            onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                            placeholder="Briefly describe the topics covered in this exam..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-5 outline-none focus:border-primary-500 font-medium h-32 resize-none"
                          />
                        </div>
                      </div>

                      <div className="pt-10 flex justify-center">
                        <button onClick={() => setActiveTab('questions')} className="px-12 py-5 bg-gray-900 text-white rounded-[2rem] font-bold shadow-2xl flex items-center gap-3 group">
                          Next: Build Questions
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left: Question List */}
                    <div className="flex-1 overflow-y-auto p-12 bg-white custom-scrollbar">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-black text-gray-900">Exam Blueprint</h3>
                          <div className="flex items-center gap-3">
                            <button onClick={() => addQuestion('mcq')} className="px-5 py-3 bg-primary-50 text-primary-700 rounded-xl font-bold text-sm border border-primary-100 flex items-center gap-2">
                              <Plus className="w-4 h-4" /> Add MCQ
                            </button>
                            <button onClick={() => addQuestion('truefalse')} className="px-5 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm border border-blue-100 flex items-center gap-2">
                              <Plus className="w-4 h-4" /> Add T/F
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {editingExam.questions.map((q, idx) => (
                            <motion.div 
                              key={q.id}
                              draggable
                              onDragStart={() => onDragStart(idx)}
                              onDragOver={onDragOver}
                              onDrop={() => onDrop(idx)}
                              className={`p-8 bg-gray-50 rounded-[2.5rem] border transition-all relative group ${
                                draggedIndex === idx ? 'opacity-50 scale-95 border-primary-500' : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {/* Drag Handle */}
                              <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-2 bg-white rounded-lg shadow-md border border-gray-100">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>

                              <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                  <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-sm text-gray-900 shadow-sm border border-gray-100">
                                    {idx + 1}
                                  </span>
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                    q.type === 'mcq' ? 'bg-primary-50 text-primary-600' : 'bg-blue-50 text-blue-600'
                                  }`}>
                                    {q.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1">
                                    <span className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks</span>
                                    <input 
                                      type="number"
                                      value={q.marks}
                                      onChange={(e) => updateQuestion(q.id, { marks: parseInt(e.target.value) })}
                                      className="w-12 bg-transparent outline-none font-bold text-sm text-center border-l border-gray-100 ml-2"
                                    />
                                  </div>
                                  <button onClick={() => removeQuestion(q.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              <textarea 
                                value={q.text}
                                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                placeholder="Enter question content..."
                                className="w-full bg-transparent outline-none font-bold text-xl text-gray-900 placeholder:text-gray-300 mb-6 resize-none h-auto min-h-[60px]"
                                rows={2}
                              />

                              {q.type === 'mcq' && q.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex gap-3">
                                      <button 
                                        onClick={() => updateQuestion(q.id, { correct: optIdx })}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all border ${
                                          q.correct === optIdx ? 'bg-green-500 text-white border-green-500 shadow-lg' : 'bg-white text-gray-300 border-gray-100 hover:bg-gray-50'
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optIdx)}
                                      </button>
                                      <input 
                                        value={opt}
                                        onChange={(e) => {
                                          const newOpts = [...q.options!];
                                          newOpts[optIdx] = e.target.value;
                                          updateQuestion(q.id, { options: newOpts });
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                        className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary-500"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {q.type === 'truefalse' && (
                                <div className="flex gap-4">
                                  {['True', 'False'].map((val) => (
                                    <button
                                      key={val}
                                      onClick={() => updateQuestion(q.id, { tfCorrect: val === 'True' })}
                                      className={`px-8 py-3 rounded-xl font-bold text-sm transition-all border ${
                                        (val === 'True' && q.tfCorrect) || (val === 'False' && !q.tfCorrect)
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                                          : 'bg-white text-gray-400 border-gray-100'
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                          
                          {editingExam.questions.length === 0 && (
                            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                              <p className="text-gray-400 font-medium">No questions yet. Click the buttons above or drag from the bank.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Question Bank Sidebar */}
                    <div className="w-[400px] bg-white border-l border-gray-100 flex flex-col p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <Database className="w-5 h-5 text-primary-500" />
                        <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Question Bank Repository</h4>
                      </div>
                      
                      <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Search in bank..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-primary-500"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {bankQuestions
                          .filter(bq => bq.questionText.toLowerCase().includes(bankSearch.toLowerCase()))
                          .map(bq => (
                            <div 
                              key={bq.id}
                              className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary-200 transition-all cursor-pointer group"
                              onClick={() => {
                                const newQ: ExamQuestion = {
                                  id: generateId(),
                                  type: 'mcq',
                                  text: bq.questionText,
                                  marks: 1,
                                  options: [bq.options.a, bq.options.b, bq.options.c, bq.options.d],
                                  correct: bq.correctOption.charCodeAt(0) - 97,
                                  explanation: bq.explanation
                                };
                                setEditingExam({ ...editingExam, questions: [...editingExam.questions, newQ] });
                              }}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-1.5">
                                  {bq.subject === 'AI Generated' && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-black uppercase tracking-widest">
                                      <Sparkles className="w-2.5 h-2.5" /> AI
                                    </span>
                                  )}
                                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{bq.subject === 'AI Generated' ? bq.topic : bq.subject}</span>
                                </div>
                                <Plus className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
                              </div>
                              <p className="text-xs font-bold text-gray-700 line-clamp-2 leading-relaxed">{bq.questionText}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="flex-1 overflow-y-auto p-12 bg-white">
                    <div className="max-w-2xl mx-auto space-y-10">
                      <div className="grid grid-cols-1 gap-6">
                        {[
                          { id: 'shuffleQuestions', label: 'Shuffle Questions Order', desc: 'Randomize the order of questions for each student attempt.', icon: Layout },
                          { id: 'shuffleOptions', label: 'Shuffle MCQ Options', desc: 'Randomize the order of A, B, C, D options for each student.', icon: Share2 },
                          { id: 'showExplanation', label: 'Show Explanation After Submit', desc: 'Students can see detailed rationales after completing the exam.', icon: HelpCircle },
                        ].map(s => (
                          <div key={s.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                <s.icon className="w-5 h-5 text-primary-500" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{s.label}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setEditingExam({
                                ...editingExam,
                                settings: { ...editingExam.settings, [s.id]: !editingExam.settings[s.id as keyof typeof editingExam.settings] }
                              })}
                              className={`w-14 h-8 rounded-full transition-all relative ${editingExam.settings[s.id as keyof typeof editingExam.settings] ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${editingExam.settings[s.id as keyof typeof editingExam.settings] ? 'right-1' : 'left-1'}`} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-8 pt-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Timer Mode</label>
                          <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-100">
                            {['countdown', 'stopwatch'].map(m => (
                              <button
                                key={m}
                                onClick={() => setEditingExam({ ...editingExam, settings: { ...editingExam.settings, timerMode: m as any } })}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                  editingExam.settings.timerMode === m ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Attempts Allowed</label>
                          <select 
                            value={editingExam.settings.attemptsAllowed}
                            onChange={(e) => setEditingExam({ ...editingExam, settings: { ...editingExam.settings, attemptsAllowed: parseInt(e.target.value) as any } })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-primary-500 font-bold"
                          >
                            <option value={1}>1 Attempt</option>
                            <option value={2}>2 Attempts</option>
                            <option value={3}>3 Attempts</option>
                            <option value={99}>Unlimited</option>
                          </select>
                        </div>
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

export default function AdminExamBuilderWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminExamBuilder />
    </ErrorBoundary>
  );
}




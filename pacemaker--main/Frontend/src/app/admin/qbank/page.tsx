'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Database, Trash2, Edit3, X, 
  Loader2, CheckCircle2, FileUp, Filter, 
  ChevronRight, BookOpen, GraduationCap,
  MessageSquare, AlertCircle, Save, HelpCircle, Eye, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';


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

function AdminQBankManagement() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // AI Generator states removed — AiTutorDrawer (Ask AI Tutor) is now provided globally by admin layout

  const [formData, setFormData] = useState<Omit<Question, 'id' | 'createdAt'>>({
    subject: 'Anatomy',
    topic: '',
    difficulty: 'Medium',
    questionText: '',
    options: { a: '', b: '', c: '', d: '' },
    correctOption: 'a',
    explanation: ''
  });

  const subjects = ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'Medicine', 'Surgery', 'OBG', 'Pediatrics'];

  useEffect(() => {
    const saved = localStorage.getItem('lms_qbank_questions_v1');
    const savedFiles = localStorage.getItem('lms_qbank_files_v1');
    if (saved) {
      try {
        setQuestions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse questions", e);
      }
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

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lms_qbank_questions_v1', JSON.stringify(questions));
      // Save metadata without the actual File objects (which can't be stringified)
      const metadataOnly = uploadedFiles.map(({ file, ...rest }) => rest);
      localStorage.setItem('lms_qbank_files_v1', JSON.stringify(metadataOnly));
    }
  }, [questions, uploadedFiles, isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setQuestions(prev => prev.map(q => q.id === isEditing ? { ...q, ...formData } : q));
    } else {
      const newQuestion: Question = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      setQuestions(prev => [newQuestion, ...prev]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      subject: 'Anatomy', topic: '', difficulty: 'Medium', questionText: '',
      options: { a: '', b: '', c: '', d: '' }, correctOption: 'a', explanation: ''
    });
    setIsEditing(null);
    setIsModalOpen(false);
  };

  const handleEdit = (question: Question) => {
    setFormData({
      subject: question.subject, topic: question.topic, difficulty: question.difficulty,
      questionText: question.questionText, options: { ...question.options },
      correctOption: question.correctOption, explanation: question.explanation
    });
    setIsEditing(question.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this question permanently?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
    setIsBulkMenuOpen(false);
  };

  const processFiles = (fileList: File[]) => {
    const newUploads: UploadedFile[] = fileList.map(file => {
      // @ts-ignore - webkitRelativePath exists on File from directory uploads
      const path = file.webkitRelativePath || '';
      const folderName = path ? path.split('/')[0] : undefined;

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.name.endsWith('.json') ? 'json' : 'pdf',
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        status: file.name.endsWith('.json') ? 'Ready' : 'Extracting MCQs',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        file: file,
        folder: folderName
      };
    });

    setUploadedFiles(prev => [...newUploads, ...prev]);

    let jsonFiles = fileList.filter(f => f.name.endsWith('.json'));
    let pdfFiles = fileList.filter(f => f.name.endsWith('.pdf'));

    if (jsonFiles.length > 0) {
      jsonFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
              const formattedData = data.map((q: any) => ({
                ...q,
                id: q.id || Math.random().toString(36).substr(2, 9),
                createdAt: q.createdAt || new Date().toISOString()
              }));
              setQuestions(prev => [...formattedData, ...prev]);
            }
          } catch (err) {
            console.error("Invalid JSON format in file:", file.name);
          }
        };
        reader.readAsText(file);
      });
      // JSON files process almost instantly in this demo
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen bg-transparent text-gray-900 p-6 md:p-10 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-gray-200 rounded text-gray-400"></div>
          </div>
        </div>
        <AdminTableSkeleton />
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent text-gray-900 p-6 md:p-10 pb-32">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary-600 font-bold text-sm tracking-wide uppercase">
            <Database className="w-4 h-4" />
            Medical Question Bank
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Q-Bank <span className="text-primary-600">Editor</span></h1>
          <p className="text-gray-600 font-medium">Create high-yield clinical MCQs and manage your medical assessment database.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" ref={fileInputRef} onChange={handleBulkUpload} accept=".json,.pdf" multiple className="hidden" 
          />
          <input 
            type="file" ref={folderInputRef} onChange={handleBulkUpload} className="hidden" {...{ webkitdirectory: "", directory: "" } as any}
          />
          
          <div className="relative">
            <button 
              onClick={() => setIsBulkMenuOpen(!isBulkMenuOpen)}
              className="bg-white border border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <FileUp className="w-5 h-5" />
              Bulk Upload
            </button>

            <AnimatePresence>
              {isBulkMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsBulkMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                  >
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      Upload Files (JSON/PDF)
                    </button>
                    <button 
                      onClick={() => folderInputRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Upload Folder
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Database Size</p>
            <p className="text-4xl font-black text-gray-900">{questions.length}</p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
               <span className="text-gray-500 font-medium">Active Items</span>
               <span className="text-green-600 font-bold">100% Sync</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
             <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-500" /> Filter by Subject
             </h4>
             <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {['All', ...subjects].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSubjectFilter(s)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${subjectFilter === s ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          {/* Document Library */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
             <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-500" /> Document Library
             </h4>
             <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {uploadedFiles.length > 0 ? Object.entries(
                  uploadedFiles.reduce((acc, file) => {
                    const key = file.folder || 'Direct Uploads';
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(file);
                    return acc;
                  }, {} as Record<string, UploadedFile[]>)
                ).map(([folderName, files]) => (
                  <div key={folderName} className="space-y-2">
                    <div className="flex items-center gap-2 px-1 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {folderName === 'Direct Uploads' ? <Database className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
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
                                <span className="text-[10px] text-gray-300">•</span>
                                <span className="text-[10px] text-gray-400 font-medium">{file.timestamp}</span>
                              </div>
                            </div>
                            <Eye className="absolute right-3 top-3 w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              file.status === 'Ready' ? 'bg-green-50 text-green-600' : 'bg-primary-50 text-primary-600 animate-pulse'
                            }`}>
                              {file.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No documents yet</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
           {/* Search Bar */}
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search questions by content or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-5 rounded-3xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-lg font-medium transition-all text-gray-900 shadow-sm"
              />
           </div>

           {/* Question List */}
           <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                  <motion.div 
                    layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    key={q.id}
                    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                             {q.subject}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : 
                            q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                             {q.difficulty}
                          </span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{q.topic}</span>
                       </div>
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(q)} className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(q.id)} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 leading-relaxed mb-6">{q.questionText}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.entries(q.options).map(([key, value]) => (
                         <div key={key} className={`p-4 rounded-2xl border text-sm font-medium ${q.correctOption === key ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                            <span className="font-black mr-2 uppercase">{key}:</span> {value}
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center">
                     <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
                        <HelpCircle className="w-10 h-10 text-gray-300" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900">No questions found</h3>
                     <p className="text-sm text-gray-500 mt-1 font-medium">Try adjusting your filters or add a new question to the bank.</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 md:p-12">
                 <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                    <div>
                       <h2 className="text-3xl font-black text-gray-900">{isEditing ? 'Edit Question' : 'New MCQ Creation'}</h2>
                       <p className="text-gray-500 font-medium">Ensure clinical accuracy and high-yield focus for each item.</p>
                    </div>
                    <button onClick={resetForm} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                       <X className="w-6 h-6 text-gray-400" />
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Subject</label>
                          <select 
                            value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-primary-500 transition-all font-bold text-gray-900"
                          >
                             {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Topic</label>
                          <input 
                            required type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-primary-500 transition-all font-bold text-gray-900"
                            placeholder="e.g. Brachial Plexus"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Difficulty</label>
                          <div className="flex bg-gray-50 rounded-2xl border border-gray-100 p-1">
                             {['Easy', 'Medium', 'Hard'].map((d) => (
                               <button 
                                 key={d} type="button" onClick={() => setFormData({...formData, difficulty: d as any})}
                                 className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.difficulty === d ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                               >
                                 {d}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Question Content</label>
                       <textarea 
                         required rows={4} value={formData.questionText} onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-6 outline-none focus:border-primary-500 transition-all font-bold text-lg text-gray-900 resize-none"
                         placeholder="A 45-year-old male presents with..."
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {['a', 'b', 'c', 'd'].map((opt) => (
                         <div key={opt} className="space-y-2 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Option {opt.toUpperCase()}</label>
                            <div className="flex gap-4 items-center">
                               <input 
                                 required type="text" value={formData.options[opt as keyof typeof formData.options]} 
                                 onChange={(e) => setFormData({...formData, options: {...formData.options, [opt]: e.target.value}})}
                                 className={`flex-1 bg-gray-50 border rounded-2xl px-6 py-4 outline-none transition-all font-bold text-gray-900 ${formData.correctOption === opt ? 'border-green-500 ring-2 ring-green-500/10' : 'border-gray-100 focus:border-primary-500'}`}
                                 placeholder={`Option ${opt.toUpperCase()}`}
                               />
                               <button 
                                 type="button" onClick={() => setFormData({...formData, correctOption: opt as any})}
                                 className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.correctOption === opt ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                               >
                                  <CheckCircle2 className="w-6 h-6" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Explanation & High-Yield Points</label>
                       <textarea 
                         required rows={4} value={formData.explanation} onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-6 outline-none focus:border-primary-500 transition-all font-medium text-gray-700"
                         placeholder="Explain why the correct option is right and others are wrong..."
                       />
                    </div>

                    <div className="pt-8 flex gap-6">
                       <button type="button" onClick={resetForm} className="flex-1 py-5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Discard Changes</button>
                       <button type="submit" className="flex-[2] py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                          <Save className="w-5 h-5" />
                          {isEditing ? 'Save Question' : 'Publish to Bank'}
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Document Viewer Modal */}
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
                  {selectedDoc.file && (
                    <button 
                      onClick={() => {
                        const url = URL.createObjectURL(selectedDoc.file!);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = selectedDoc.name;
                        a.click();
                      }}
                      className="p-4 bg-gray-50 rounded-2xl hover:bg-primary-50 hover:text-primary-600 transition-all group"
                      title="Download Resource"
                    >
                      <Download className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                    </button>
                  )}
                  <button onClick={() => setSelectedDoc(null)} className="p-4 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all group">
                    <X className="w-6 h-6 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
                {selectedDoc.type === 'pdf' ? (
                  selectedDoc.file ? (
                    <iframe 
                      src={URL.createObjectURL(selectedDoc.file)} 
                      className="w-full h-full border-none shadow-inner"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                      <FileText className="w-16 h-16 mb-4 opacity-20" />
                      <p>PDF file context lost. Please re-upload to preview.</p>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl mb-8">
                         <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4" /> Structured Data View
                         </h4>
                         <p className="text-amber-700/70 text-sm">This JSON file contains structured clinical MCQs. You can review the raw content below before publishing.</p>
                      </div>
                      
                      {/* We'll just show a clean pre/code for JSON for now */}
                      <pre className="bg-gray-900 text-gray-300 p-8 rounded-[2rem] text-sm font-mono overflow-x-auto shadow-2xl border border-gray-800">
                        {selectedDoc.file ? "Loading content..." : "No content available"}
                        {/* Note: In a real app we'd read the file content here */}
                      </pre>
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

export default function AdminQBankManagementWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminQBankManagement />
    </ErrorBoundary>
  );
}


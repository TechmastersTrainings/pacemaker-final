'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, BookOpen, Send, Loader2, Download, 
  HelpCircle, ChevronRight, FileText, Bookmark, GraduationCap 
} from 'lucide-react';
import { aiService, LevelType } from '@/services/aiService';

export default function AiTutorDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'explain' | 'qa'>('explain');
  
  // Explain States
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<LevelType>('intermediate');
  const [context, setContext] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState('');

  // Q&A States
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ai';
    text: string;
    sources?: Array<{ id: string; topic: string; score: number; source: string }>;
  }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState('');

  // Sample prompt helpers
  const sampleTopics = ['Ketoacidosis Pathophysiology', 'Aortic Dissection', 'Glasgow Coma Scale', 'ECG in Hyperkalemia'];
  const sampleQuestions = ['What are the diagnostic criteria for SLE?', 'Explain the mechanism of action of Heparin', 'How does Nephrotic Syndrome cause edema?'];

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsExplaining(true);
    setExplainError('');
    setExplanation('');
    try {
      const data = await aiService.explainTopic(topic, level, context);
      setExplanation(data.explanation);
    } catch (err: any) {
      setExplainError(err?.response?.data?.detail || 'Failed to explain topic. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const userQ = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { type: 'user', text: userQ }]);
    setIsAsking(true);
    setAskError('');
    try {
      const data = await aiService.askTutor(userQ, level);
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        text: data.answer, 
        sources: data.sources 
      }]);
    } catch (err: any) {
      setAskError(err?.response?.data?.detail || 'Failed to search RAG library.');
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        text: 'Sorry, I encountered an issue accessing the RAG medical library.' 
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[130] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 group border border-purple-400/20"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-purple-200 group-hover:rotate-12 transition-transform" />
        <span className="text-sm tracking-tight">Ask AI</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140]"
            />

            {/* Slide-out drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white shadow-2xl z-[150] flex flex-col border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden flex justify-between items-center">
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                    <h3 className="text-lg font-black tracking-tight">PaceMaker AI Tutor</h3>
                  </div>
                  <p className="text-indigo-200/60 text-xs mt-1">Structured explanations & textbook-grounded RAG Q&A</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors relative z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 m-4 rounded-xl">
                <button
                  onClick={() => setActiveTab('explain')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'explain' 
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Explain Concept
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'qa' 
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-950'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" /> Ask RAG Library
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {activeTab === 'explain' ? (
                  <div className="space-y-6">
                    <form onSubmit={handleExplain} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Topic to Explain</label>
                        <input
                          type="text"
                          required
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. Diabetic Ketoacidosis"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Depth Level</label>
                          <select
                            value={level}
                            onChange={(e: any) => setLevel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                          >
                            <option value="beginner">Beginner (Basic)</option>
                            <option value="intermediate">Intermediate (USMLE/PG)</option>
                            <option value="advanced">Advanced (Clinical/Fellow)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Context / Hint (Optional)</label>
                          <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. emphasize etiology"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isExplaining}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-98 transition-all disabled:opacity-50"
                      >
                        {isExplaining ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing & Structuring...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Generate Explanation
                          </>
                        )}
                      </button>
                    </form>

                    {/* Explainer Quick suggestions */}
                    {!explanation && !isExplaining && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Suggested Clinical Topics</span>
                        <div className="flex flex-wrap gap-2">
                          {sampleTopics.map(t => (
                            <button
                              key={t}
                              onClick={() => setTopic(t)}
                              className="px-3.5 py-2 border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-900 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                            >
                              {t} <ChevronRight className="w-3 h-3 opacity-50" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {explainError && (
                      <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold">
                        {explainError}
                      </div>
                    )}

                    {/* Explanation Output */}
                    {explanation && (
                      <div className="space-y-4 mt-6 border-t border-slate-100 pt-6">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">AI Tutor Explanation</span>
                          <a
                            href={aiService.getExplainDownloadUrl(topic, level, context)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                        </div>
                        <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-line font-medium">
                          {explanation}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Q&A Tab (RAG powered)
                  <div className="flex flex-col h-full min-h-[400px]">
                    <div className="flex-1 space-y-4 overflow-y-auto pr-1 mb-4">
                      {chatHistory.length === 0 ? (
                        <div className="py-8 text-center space-y-6">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                            <BookOpen className="w-8 h-8" />
                          </div>
                          <div className="max-w-xs mx-auto">
                            <h4 className="font-bold text-slate-800 text-sm">Consult Medical Library</h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                              Ask clinical or diagnostic questions. Answers are retrieved from textbooks and verified study guidelines.
                            </p>
                          </div>

                          <div className="space-y-2 text-left">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Common Queries</span>
                            <div className="flex flex-col gap-2">
                              {sampleQuestions.map(q => (
                                <button
                                  key={q}
                                  onClick={() => setQuestion(q)}
                                  className="w-full text-left p-3.5 border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/20 text-slate-600 hover:text-indigo-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-between"
                                >
                                  {q} <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        chatHistory.map((chat, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col space-y-2 ${chat.type === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div className={`p-4 rounded-2xl max-w-[85%] text-xs font-bold ${
                              chat.type === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none font-medium'
                            }`}>
                              {chat.text}
                            </div>
                            
                            {/* Sources display for RAG responses */}
                            {chat.type === 'ai' && chat.sources && chat.sources.length > 0 && (
                              <div className="w-[85%] bg-amber-50/40 border border-amber-100/50 rounded-xl p-3 space-y-2 mt-1">
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 uppercase tracking-widest">
                                  <Bookmark className="w-3 h-3" /> Grounded Textbook Sources:
                                </div>
                                <div className="space-y-1">
                                  {chat.sources.map((src, sIdx) => (
                                    <div key={sIdx} className="text-[10px] text-slate-500 flex justify-between items-center font-medium">
                                      <span className="truncate pr-4">• {src.topic} ({src.source})</span>
                                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Score: {src.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      
                      {isAsking && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold italic">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Consulting local ChromaDB vector library...
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAsk} className="flex gap-2 border-t border-slate-100 pt-4 mt-auto">
                      <input
                        type="text"
                        required
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask tutor something..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                      <button
                        type="submit"
                        disabled={isAsking}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

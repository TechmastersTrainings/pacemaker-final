'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Sparkles, Loader2, ChevronDown, RotateCcw } from 'lucide-react';
import { aiService } from '@/services/aiService';

type Role = 'user' | 'ai';
interface Message { id: string; role: Role; text: string; loading?: boolean; }

// Per-page context: greeting + quick suggestion chips
const PAGE_CONTEXT: Record<string, { title: string; greeting: string; chips: string[] }> = {
  '/dashboard': {
    title: 'Dashboard',
    greeting: "👋 Hi! I'm your AI Medical Tutor. Ask me anything about your studies, exams, or medical topics!",
    chips: ['What should I study today?', 'Explain Cardiac Cycle', 'How to prepare for NEET-PG?', 'High yield topics in Pharmacology'],
  },
  '/dashboard/qbank': {
    title: 'Question Bank',
    greeting: "📝 You're in the Question Bank! I can explain any question, generate practice MCQs, or clarify a concept.",
    chips: ['Explain Axillary nerve injury', 'Generate 5 Pharmacology MCQs', 'What is S1 heart sound?', 'Explain the brachial plexus'],
  },
  '/dashboard/patient-simulation': {
    title: 'Patient Simulation',
    greeting: "🩺 OSCE mode! Ask me about clinical cases, differentials, or how to approach a patient presentation.",
    chips: ['How to approach chest pain?', 'Differentials for acute abdomen', 'Steps in OSCE station', 'What is SOCRATES for pain?'],
  },
  '/dashboard/performance': {
    title: 'Performance',
    greeting: "📊 Analysing your performance! Ask me how to improve weak subjects or predict your NEET-PG rank.",
    chips: ['How to improve Anatomy score?', 'Best revision strategy for PG exam', 'Explain NEET-PG scoring', 'Weak subject study plan'],
  },
  '/dashboard/leaderboard': {
    title: 'Leaderboard',
    greeting: "🏆 On the leaderboard! Ask me tips to improve your rank or study consistently.",
    chips: ['How to study 10 hours a day?', 'Best time management for NEET', 'Motivation tips for medical students'],
  },
  '/dashboard/exams': {
    title: 'Exam Builder',
    greeting: "📋 Exam Builder! Ask me about exam patterns, question types, or how to tackle MCQs.",
    chips: ['How to attempt MCQ exams?', 'NEET-PG exam pattern 2025', 'Time management during exam', 'Elimination technique for MCQs'],
  },
  '/dashboard/achievements': {
    title: 'Achievements',
    greeting: "🎖️ Well done on your progress! Ask me what to study next or how to unlock more badges.",
    chips: ['What should I master next?', 'High yield topics for surgery', 'Revision schedule for last month'],
  },
  '/study-material': {
    title: 'Study Material',
    greeting: "📚 Study Material! I can explain any topic from your resources or summarise key concepts.",
    chips: ['Summarise Heart Failure', 'Explain DKA management', 'Key drugs in Cardiology', 'Pathophysiology of Sepsis'],
  },
  '/admin': {
    title: 'Instructor Dashboard',
    greeting: "🧑‍🏫 Welcome, Instructor! I can help you generate MCQs, explain topics for lectures, or suggest student improvement strategies.",
    chips: ['Generate 5 MCQs on ECG', 'Explain Thyroid disorders for class', 'Students struggling with Pharmacology — what to do?', 'Create a revision plan for weak students'],
  },
  '/admin/qbank': {
    title: 'Q-Bank Admin',
    greeting: "📋 Q-Bank Admin! I can generate high-quality MCQs for any topic instantly.",
    chips: ['Generate MCQs on Renal failure', 'Hard MCQs on Cardiology', 'Generate exam-level Pathology questions', 'Generate 10 Surgery MCQs'],
  },
  '/admin/analytics': {
    title: 'Analytics',
    greeting: "📈 Analytics page! Ask me how to interpret student data or improve learning outcomes.",
    chips: ['How to help struggling students?', 'Best engagement strategies for LMS', 'Suggest topics for next live class', 'How to reduce dropout rates?'],
  },
  '/admin/exams': {
    title: 'Exam Admin',
    greeting: "📝 Exam Builder! I can suggest question patterns, difficulty distribution, or generate questions for you.",
    chips: ['Best MCQ difficulty distribution?', 'Generate Anatomy exam questions', 'How to create a balanced exam?'],
  },
  '/instructor/recordings': {
    title: 'Recordings',
    greeting: "🎥 Recordings page! Ask me to summarise a medical topic from your recorded lectures.",
    chips: ['Summarise ECG lecture topics', 'Key points in Heart Failure class', 'What to cover in Pharmacology next?'],
  },
};

function getContext(pathname: string) {
  return (
    PAGE_CONTEXT[pathname] ||
    PAGE_CONTEXT[Object.keys(PAGE_CONTEXT).find(k => pathname.startsWith(k)) || ''] || {
      title: 'Assistant',
      greeting: "👋 Hi! I'm your Groq AI Assistant. Ask me anything about medicine or your LMS!",
      chips: ['Explain a medical concept', 'Generate practice MCQs', 'Study tips for NEET-PG', 'Ask a clinical question'],
    }
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function AiChatbot({ role = 'student' }: { role?: 'student' | 'instructor' }) {
  const pathname = usePathname();
  const ctx = getContext(pathname);
  const isInstructor = role === 'instructor';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'ai', text: ctx.greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastTopic, setLastTopic] = useState<string | null>(null);
  const [lastFormat, setLastFormat] = useState<'mcq' | 'short' | 'viva' | 'discussion' | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-set greeting when page changes
  useEffect(() => {
    const newCtx = getContext(pathname);
    setMessages([{ id: 'init', role: 'ai', text: newCtx.greeting }]);
    setLastTopic(null);
    setLastFormat(null);
  }, [pathname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    const loadingMsg: Message = { id: 'loading', role: 'ai', text: '', loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setLoading(true);

    try {
      // Detect if user wants questions in general
      const wantsQuestions = /gener|mcq|question|quiz|test|short|viva|discussion|theory/i.test(text);

      // Detect requested format
      let detectedFormat: 'mcq' | 'short' | 'viva' | 'discussion' | null = null;
      if (/mcq|multiple choice|option/i.test(text)) {
        detectedFormat = 'mcq';
      } else if (/short|theory|text/i.test(text)) {
        detectedFormat = 'short';
      } else if (/viva|oral/i.test(text)) {
        detectedFormat = 'viva';
      } else if (/discussion/i.test(text)) {
        detectedFormat = 'discussion';
      }

      // Try to parse number of questions (e.g. 5, 10)
      const numMatch = text.match(/\b\d+\b/);
      const numQuestions = numMatch ? Math.min(parseInt(numMatch[0]), 15) : 3;

      // Try to parse the topic after prepositions
      const topicMatch = text.match(/\b(?:on|about|for|of|regarding)\s+(.+)/i);
      let topic = topicMatch?.[1]?.trim() || '';

      if (wantsQuestions) {
        if (!topic && lastTopic) {
          topic = lastTopic;
        }

        const activeFormat = detectedFormat || lastFormat || 'mcq';

        if (topic) {
          setLastTopic(topic);
          if (detectedFormat) setLastFormat(detectedFormat);

          if (activeFormat === 'mcq') {
            const res = await aiService.generateMCQ(topic, numQuestions, 'medium');
            let reply = `Here are ${res.questions.length} MCQs on **${res.topic}**:\n\n` +
              res.questions.map((q, i) =>
                `**Q${i + 1}.** ${q.question}\n` +
                `A) ${q.options.A}\nB) ${q.options.B}\nC) ${q.options.C}\nD) ${q.options.D}\n` +
                `✅ Answer: **${q.correct_answer}**\n💡 ${q.explanation}`
              ).join('\n\n---\n\n');
            
            setMessages(prev => prev.filter(m => m.id !== 'loading').concat({ id: Date.now().toString(), role: 'ai', text: reply }));
          } else {
            let promptQuery = '';
            let formatLabel = '';
            
            if (activeFormat === 'short') {
              formatLabel = 'Short-Answer/Short-Text';
              promptQuery = `You are an expert medical educator. Generate exactly ${numQuestions} non-MCQ short-answer or short-text study questions with detailed answers and explanations on the topic: "${topic}".
Format each question exactly as follows:
**Short Answer Question [Number]:** [The clinical/theoretical question]
**Answer:** [Detailed clinical explanation and correct answer]

Do NOT provide general lecture notes or a textbook summary. Format it strictly as a clean, sequential list of short-answer questions and answers.`;
            } else if (activeFormat === 'viva') {
              formatLabel = 'Viva/Oral Examination';
              promptQuery = `You are an expert medical examiner. Generate exactly ${numQuestions} high-yield Viva Voce/oral examination questions (quick-fire questions suitable for oral exam boards) with their correct model answers on the topic: "${topic}".
Format each question exactly as follows:
**Viva Question [Number]:** [The viva question]
**Model Answer:** [Precise and accurate answer suitable for oral response]

Do NOT provide general notes. Format it strictly as a sequential list of viva questions and answers.`;
            } else if (activeFormat === 'discussion') {
              formatLabel = 'Clinical Discussion';
              promptQuery = `You are a clinical rounds facilitator. Generate exactly ${numQuestions} clinical discussion case questions (open-ended patient scenarios or clinical challenges to prompt discussion) with detailed rationales and learning points on the topic: "${topic}".
Format each question exactly as follows:
**Discussion Question/Case [Number]:** [The clinical scenario and discussion question]
**Clinical Discussion & Rationale:** [Detailed clinical points and discussion rationale]

Do NOT provide general notes. Format it strictly as a sequential list of discussion questions and answers.`;
            }

            const res = await aiService.askTutor(promptQuery, 'intermediate', 3);
            const header = `Here are ${numQuestions} **${formatLabel}** questions on **${topic}**:\n\n`;
            setMessages(prev => prev.filter(m => m.id !== 'loading').concat({ id: Date.now().toString(), role: 'ai', text: header + res.answer }));
          }
        } else {
          const reply = `I would love to generate some questions for you! Please specify the topic and question type. For example:\n• *"Generate 5 MCQs on Hypertension"*\n• *"Generate 3 short text questions on Diabetes"*\n• *"Generate 5 viva questions on Appendicitis"*\n• *"Generate 3 discussion questions on Heart Failure"*`;
          setMessages(prev => prev.filter(m => m.id !== 'loading').concat({ id: Date.now().toString(), role: 'ai', text: reply }));
        }
      } else {
        // Use RAG-based tutor for all other questions
        const res = await aiService.askTutor(text, 'intermediate', 3);
        const reply = res.answer;
        setMessages(prev => prev.filter(m => m.id !== 'loading').concat({ id: Date.now().toString(), role: 'ai', text: reply }));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat({
        id: Date.now().toString(), role: 'ai',
        text: '⚠️ Could not reach the AI service. Please make sure the Groq AI service is running on port 8000.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const clearChat = () => {
    setMessages([{ id: 'init', role: 'ai', text: ctx.greeting }]);
    setLastTopic(null);
    setLastFormat(null);
  };

  const btnColor = isInstructor
    ? 'from-violet-600 to-indigo-600 shadow-indigo-500/30'
    : 'from-purple-600 to-indigo-500 shadow-purple-500/30';
  const headerColor = isInstructor
    ? 'from-violet-700 to-indigo-700'
    : 'from-purple-700 to-indigo-600';

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          id="ai-chatbot-fab"
          onClick={() => setOpen(true)}
          className={`fixed bottom-8 right-8 z-[200] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r ${btnColor} text-white font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all`}
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          Ask AI
          <span className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-black ml-1">✦</span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[300] w-[400px] max-w-[95vw] h-[600px] max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-white/20"
          style={{ animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Header */}
          <div className={`bg-gradient-to-r ${headerColor} px-5 py-4 flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm">PaceMaker AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-indigo-200 text-[10px] font-bold">{ctx.title} · Groq Llama 3.3</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm'
                }`}>
                  {msg.loading ? <TypingDots /> : msg.text}
                </div>
              </div>
            ))}

            {/* Quick chip suggestions — show only at start */}
            {messages.length === 1 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-9">Quick questions</p>
                <div className="flex flex-col gap-1.5 pl-9">
                  {ctx.chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      disabled={loading}
                      className="text-left text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ChevronDown className="w-3 h-3 rotate-[-90deg] shrink-0" />{chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about medicine..."
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 font-medium disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85) translateY(20px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

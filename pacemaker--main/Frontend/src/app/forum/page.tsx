'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, Users, Lock, Settings, Send, Eye, 
  Code, Sparkles, CheckCircle2, AlertCircle, ArrowRight, 
  Clock, User, BookOpen, ThumbsUp, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getForumSettings, getSyncedForumUsers, ensureDefaultSyncedUsers, syncUserWithForum } from '@/lib/forumService';

// Mock forum threads for the interactive sandbox
interface Thread {
  id: number;
  category: string;
  title: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  replies: number;
  likes: number;
  time: string;
  content: string;
  comments: {
    id: number;
    author: string;
    authorRole: string;
    authorAvatar: string;
    content: string;
    time: string;
  }[];
}

const INITIAL_THREADS: Thread[] = [
  {
    id: 1,
    category: 'Anatomy Discussion',
    title: 'Mnemonics for Cranial Nerves & Openings of Skull Base',
    author: 'Dr. Jane Smith',
    authorRole: 'Instructor',
    authorAvatar: 'JS',
    replies: 12,
    likes: 34,
    time: '2 hours ago',
    content: 'Hi everyone! What are your favorite mnemonics for memorizing the cranial nerve exits through the skull base? I have been teaching the "Ooo Ooo Ooo To Touch And Feel Very Good Velvet Ah Heaven" but finding students get confused by the corresponding openings. Let\'s compile a list!',
    comments: [
      {
        id: 101,
        author: 'Dr. Ramesh Kumar',
        authorRole: 'Instructor',
        authorAvatar: 'RK',
        content: 'For the openings: "Cleaners Only Spray Smell, Right On The Floor, In The Basement, Out The Door." This maps: Cribriform, Optic, Superior orbital, Rotundum, Ovale, Spinosum, Internal acoustic, Jugular, Hypoglossal. Hope this helps!',
        time: '1 hour ago'
      },
      {
        id: 102,
        author: 'John Doe',
        authorRole: 'Student',
        authorAvatar: 'JD',
        content: 'Thank you Dr. Ramesh! This is ten times easier than the textbook table.',
        time: '45 mins ago'
      }
    ]
  },
  {
    id: 2,
    category: 'NEET PG Prep',
    title: 'Cardiology: High-Yield topics for the upcoming exam',
    author: 'Dr. Ananya Sen',
    authorRole: 'Instructor',
    authorAvatar: 'AS',
    replies: 8,
    likes: 42,
    time: '1 day ago',
    content: 'Focus heavily on Valvular Heart Diseases (especially AS vs MR murmurs and their hemodynamic changes with maneuvers), Congenital anomalies (ASD, VSD, Tetralogy of Fallot), and ECG changes in Acute MI. I will be posting a quiz sheet tonight.',
    comments: [
      {
        id: 201,
        author: 'Dr. Jane Smith',
        authorRole: 'Instructor',
        authorAvatar: 'JS',
        content: 'Perfect compilation, Ananya. I would also add JVP waveforms - highly popular question in recent clinical vignettes.',
        time: '18 hours ago'
      }
    ]
  },
  {
    id: 3,
    category: 'Clinical Case Studies',
    title: 'ECG Case: 58-year-old male with sudden substernal chest pain',
    author: 'Dr. Jane Smith',
    authorRole: 'Instructor',
    authorAvatar: 'JS',
    replies: 19,
    likes: 56,
    time: '2 days ago',
    content: 'Patient presents with substernal crushing chest pain radiating to the left arm. ECG shows ST-segment elevation in leads II, III, and aVF with reciprocal depression in leads I and aVL. What is the diagnosis, and which coronary artery is most likely occluded?',
    comments: [
      {
        id: 301,
        author: 'John Doe',
        authorRole: 'Student',
        authorAvatar: 'JD',
        content: 'This represents an Acute Inferior Wall Myocardial Infarction. The occlusion is most likely in the Right Coronary Artery (RCA).',
        time: '1 day ago'
      },
      {
        id: 302,
        author: 'Dr. Jane Smith',
        authorRole: 'Instructor',
        authorAvatar: 'JS',
        content: 'Correct! Excellent clinical deduction.',
        time: '20 hours ago'
      }
    ]
  }
];

export default function ForumPage() {
  const router = useRouter();
  
  // Authentication & Settings states
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    discourseUrl: 'https://forum.pacemaker.com',
    ssoSecretKey: 'pacemaker-discourse-sso-secret-12345',
    ssoEnabled: true
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'sandbox' | 'iframe'>('sandbox');
  const [activeTab, setActiveTab] = useState<'forum' | 'debug'>('forum');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Forum simulation state
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('Anatomy Discussion');
  const [showCreateThread, setShowCreateThread] = useState(false);

  // SSO Data Generation
  const [ssoPayload, setSsoPayload] = useState('');
  const [ssoSignature, setSsoSignature] = useState('');
  const [ssoFinalUrl, setSsoFinalUrl] = useState('');
  const [nonce, setNonce] = useState('');

  // Iframe state
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Initial Authentication & Configurations check
  useEffect(() => {
    ensureDefaultSyncedUsers();
    const storedUser = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    let email = localStorage.getItem('currentUserEmail');

    if (!storedUser) {
      // User is not logged in. Redirect to login.
      router.push('/login?redirect=/forum');
      return;
    }

    // Default email if missing
    if (!email) {
      const generatedEmail = `${storedUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@pacemaker.com`;
      localStorage.setItem('currentUserEmail', generatedEmail);
      email = generatedEmail;
    }

    setCurrentUser(storedUser);
    setUserRole(role);
    setUserEmail(email);

    // Sync current logged-in user with the forum list
    const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    syncUserWithForum(email, storedUser, username, role || 'student');

    // Get configuration settings
    const forumSettings = getForumSettings();
    setSettings(forumSettings);
    
    // Generate a secure nonce for this session
    const randomNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setNonce(randomNonce);
    
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  // 2. Generate SSO payload and request signature from API
  useEffect(() => {
    if (!currentUser || !userEmail || !settings.ssoSecretKey) return;

    const generateSSO = async () => {
      const username = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // SSO Parameters payload (Query String format)
      const params = new URLSearchParams({
        nonce: nonce,
        email: userEmail,
        name: currentUser,
        username: username,
        external_id: userEmail,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser)}&backgroundColor=0d9488&textColor=ffffff`
      });

      const payloadStr = params.toString();
      const base64Payload = btoa(payloadStr);
      setSsoPayload(base64Payload);

      try {
        const response = await fetch('/api/forum/sso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payload: base64Payload,
            secret: settings.ssoSecretKey
          })
        });

        if (response.ok) {
          const data = await response.json();
          setSsoSignature(data.signature);
          
          // Build final discourse redirect URL
          const finalUrl = `${settings.discourseUrl}/session/sso_login?sso=${encodeURIComponent(base64Payload)}&sig=${data.signature}`;
          setSsoFinalUrl(finalUrl);
        } else {
          console.error('Failed to generate SSO signature from server');
        }
      } catch (err) {
        console.error('Error fetching signature:', err);
      }
    };

    generateSSO();
  }, [currentUser, userEmail, settings, nonce]);

  // Handle post thread in sandbox
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    const newThread: Thread = {
      id: threads.length + 1,
      category: newThreadCategory,
      title: newThreadTitle,
      author: currentUser || 'User',
      authorRole: userRole === 'admin' ? 'Admin' : userRole === 'instructor' ? 'Instructor' : 'Student',
      authorAvatar: (currentUser || 'US').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      replies: 0,
      likes: 0,
      time: 'Just now',
      content: newThreadContent,
      comments: []
    };

    setThreads([newThread, ...threads]);
    setNewThreadTitle('');
    setNewThreadContent('');
    setShowCreateThread(false);
    setSelectedThread(newThread);
  };

  // Handle post comment in sandbox
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedThread) return;

    const newComment = {
      id: selectedThread.comments.length + 100,
      author: currentUser || 'User',
      authorRole: userRole === 'admin' ? 'Admin' : userRole === 'instructor' ? 'Instructor' : 'Student',
      authorAvatar: (currentUser || 'US').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      content: newCommentText,
      time: 'Just now'
    };

    const updatedThreads = threads.map(t => {
      if (t.id === selectedThread.id) {
        return {
          ...t,
          replies: t.replies + 1,
          comments: [...t.comments, newComment]
        };
      }
      return t;
    });

    setThreads(updatedThreads);
    setSelectedThread({
      ...selectedThread,
      replies: selectedThread.replies + 1,
      comments: [...selectedThread.comments, newComment]
    });
    setNewCommentText('');
  };

  if (!currentUser) return null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* Top Banner Control Panel */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 p-2 rounded-xl border border-primary-100">
            <MessageCircle className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">PaceMaker Community</h1>
            <p className="text-xs text-gray-500 font-medium">Discourse Forum Sandbox & SSO Viewer</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl border border-gray-200 flex">
            <button 
              onClick={() => setMode('sandbox')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'sandbox' 
                  ? 'bg-white text-primary-700 shadow-sm border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Sandbox Preview
            </button>
            <button 
              onClick={() => {
                setMode('iframe');
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'iframe' 
                  ? 'bg-white text-primary-700 shadow-sm border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Real Iframe Embed
            </button>
          </div>

          {/* Settings Shortcut */}
          {userRole === 'admin' && (
            <button 
              onClick={() => router.push('/admin/forum-settings')}
              className="p-2 border border-gray-200 hover:border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-900"
              title="Forum Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Active Mode Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#fdfbf7]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
                  <MessageCircle className="w-6 h-6 text-primary-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                  <h3 className="font-black text-gray-900">Establishing Secure Session</h3>
                  <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">Syncing with Discourse SSO...</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Mode 1: Real Iframe Embed */}
          {mode === 'iframe' && (
            <div className="flex-1 flex flex-col relative bg-gray-900">
              {/* Warnings and Info for Mock Iframe Domain */}
              <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between text-xs text-amber-800 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                  <span>
                    <strong>Sandbox notice:</strong> Pointed to <code>{settings.discourseUrl}</code>. Since this domain does not resolve, this iframe will show a network connection failure in a local environment. Toggle <strong>Sandbox Preview</strong> to test the fully functional forum simulation!
                  </span>
                </div>
                <button 
                  onClick={() => setMode('sandbox')}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-lg transition-colors ml-4 whitespace-nowrap"
                >
                  Switch to Sandbox
                </button>
              </div>

              {/* The Iframe Component */}
              <iframe
                ref={iframeRef}
                src={ssoFinalUrl || settings.discourseUrl}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Community Forum"
                className="bg-white flex-1"
                onLoad={() => setIsLoading(false)}
              />
            </div>
          )}

          {/* Mode 2: Interactive Sandbox Preview */}
          {mode === 'sandbox' && (
            <div className="flex-1 flex overflow-hidden bg-gray-50">
              {/* Sandbox Sidebar Categories */}
              <div className="w-64 border-r border-gray-200 bg-white p-5 space-y-6 hidden lg:block shrink-0 overflow-y-auto">
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Forum Categories</h3>
                  <div className="space-y-1">
                    {['Anatomy Discussion', 'NEET PG Prep', 'Clinical Case Studies', 'General Chat'].map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => {
                          setSelectedThread(null);
                          setNewThreadCategory(cat);
                          setShowCreateThread(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-left transition-all ${
                          newThreadCategory === cat && !selectedThread
                            ? 'bg-primary-50 border border-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="w-5 h-5 bg-gray-100 text-[10px] text-gray-500 font-bold flex items-center justify-center rounded-full">
                          {threads.filter(t => t.category === cat).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
                      <span>SSO Profile Active</span>
                    </div>
                    <p className="text-[11px] text-teal-700 leading-relaxed font-medium">
                      You are authenticated as <strong>{currentUser}</strong> ({userRole}). Your forum handle is <strong>@{userEmail?.split('@')[0]}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Forum Main Panel */}
              <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <div className="p-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                  <div>
                    {selectedThread ? (
                      <button 
                        onClick={() => setSelectedThread(null)}
                        className="text-primary-600 hover:text-primary-700 font-black text-sm flex items-center gap-1"
                      >
                        ← Back to Category
                      </button>
                    ) : (
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">{newThreadCategory}</h2>
                    )}
                  </div>

                  {!selectedThread && (
                    <button 
                      onClick={() => setShowCreateThread(!showCreateThread)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-500/10 transition-all flex items-center gap-1.5"
                    >
                      {showCreateThread ? 'Cancel Post' : 'New Topic'}
                    </button>
                  )}
                </div>

                {/* Forum Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {showCreateThread ? (
                    /* Create Thread Form */
                    <motion.form 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleCreateThread}
                      className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm space-y-4"
                    >
                      <h3 className="font-black text-gray-900 text-md">Start a new discussion</h3>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Discussion Title</label>
                        <input 
                          type="text" required placeholder="What is on your mind?"
                          value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-950 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                        <select 
                          value={newThreadCategory} onChange={e => setNewThreadCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm"
                        >
                          <option value="Anatomy Discussion">Anatomy Discussion</option>
                          <option value="NEET PG Prep">NEET PG Prep</option>
                          <option value="Clinical Case Studies">Clinical Case Studies</option>
                          <option value="General Chat">General Chat</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description / Content</label>
                        <textarea 
                          rows={5} required placeholder="Write details..."
                          value={newThreadContent} onChange={e => setNewThreadContent(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-955 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm resize-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-500/10 transition-all"
                      >
                        Publish Topic
                      </button>
                    </motion.form>
                  ) : selectedThread ? (
                    /* Active Thread Detail View */
                    <div className="space-y-6 max-w-4xl mx-auto">
                      <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-black text-sm flex items-center justify-center">
                              {selectedThread.authorAvatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-gray-900 text-sm">{selectedThread.author}</span>
                                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700">
                                  {selectedThread.authorRole}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400 font-bold">{selectedThread.time}</span>
                            </div>
                          </div>
                          <span className="text-xs font-black bg-gray-100 px-3 py-1 text-gray-500 rounded-xl">
                            {selectedThread.category}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-snug">{selectedThread.title}</h2>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{selectedThread.content}</p>
                      </div>

                      {/* Comments / Replies list */}
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                        {selectedThread.comments.map((comment) => (
                          <div key={comment.id} className="bg-white border border-gray-200 rounded-[1.8rem] p-5 shadow-sm space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                                {comment.authorAvatar}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-950 text-xs">{comment.author}</span>
                                  <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700">
                                    {comment.authorRole}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold">{comment.time}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed font-medium pl-1">{comment.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      <form onSubmit={handleAddComment} className="bg-white border border-gray-200 rounded-[2rem] p-5 shadow-sm space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Write your reply</label>
                          <textarea 
                            rows={3} required placeholder="Share your clinical insight or ask a question..."
                            value={newCommentText} onChange={e => setNewCommentText(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-955 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-xs resize-none"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-500/10 transition-all flex items-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Reply
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Thread List view */
                    <div className="space-y-4">
                      {threads.filter(t => t.category === newThreadCategory).length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-500">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="font-black text-gray-800">No discussions yet</h3>
                          <p className="text-xs text-gray-400 font-bold mt-1">Be the first to start a topic in this category!</p>
                        </div>
                      ) : (
                        threads
                          .filter(t => t.category === newThreadCategory)
                          .map((t) => (
                            <div 
                              key={t.id} 
                              onClick={() => setSelectedThread(t)}
                              className="bg-white border border-gray-200 hover:border-primary-400 rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-6 group"
                            >
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-black text-[10px] flex items-center justify-center">
                                    {t.authorAvatar}
                                  </span>
                                  <span className="text-xs font-bold text-gray-700">{t.author}</span>
                                  <span className="text-[10px] text-gray-400">• {t.time}</span>
                                </div>
                                <h3 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors text-sm md:text-base leading-snug">
                                  {t.title}
                                </h3>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                                  {t.content}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs font-bold text-gray-400 shrink-0">
                                <div className="text-center">
                                  <span className="block text-gray-900 font-black text-sm">{t.replies}</span>
                                  <span className="text-[10px] uppercase">replies</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-gray-900 font-black text-sm">{t.likes}</span>
                                  <span className="text-[10px] uppercase">likes</span>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active SSO Debug HUD */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 shrink-0">
            <button 
              onClick={() => setActiveTab('forum')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'forum' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-900'
              }`}
            >
              SSO Info
            </button>
            <button 
              onClick={() => setActiveTab('debug')}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'debug' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-900'
              }`}
            >
              Payload JSON
            </button>
          </div>

          <div className="p-6 flex-1 space-y-6">
            {activeTab === 'forum' ? (
              <>
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Single Sign-On (SSO) Status</h3>
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      SSO Sync Active <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Sync Profile Panel */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-black text-sm flex items-center justify-center">
                        {currentUser.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">{currentUser}</h4>
                        <span className="text-[10px] uppercase font-black text-primary-500 tracking-wider">{userRole}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500 font-bold">
                        <span>External ID:</span>
                        <span className="text-gray-900 font-black truncate max-w-[140px]" title={userEmail || ''}>{userEmail}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 font-bold">
                        <span>Username:</span>
                        <span className="text-gray-900 font-black">@{userEmail?.split('@')[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* SSO details */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discourse Endpoint</span>
                      <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-[10px] text-gray-600 break-all leading-relaxed mt-1 select-all">
                        {settings.discourseUrl}/session/sso_login
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SSO Secret (HMAC Key)</span>
                      <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl font-mono text-[10px] text-gray-600 break-all leading-relaxed mt-1 flex justify-between items-center">
                        <span className="select-all">•••••••••••••••••{settings.ssoSecretKey.substring(settings.ssoSecretKey.length - 4)}</span>
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculated SHA256 Signature</span>
                      <div className="bg-primary-50/50 border border-primary-100/50 p-2.5 rounded-xl font-mono text-[10px] text-primary-700 break-all leading-relaxed mt-1 select-all">
                        {ssoSignature || 'Computing...'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">SSO Base64 Payload</h3>
                  <p className="text-[11px] text-gray-500 font-medium">This payload is base64-encoded and sent to Discourse via the <code>sso</code> query param.</p>
                </div>
                <div className="bg-gray-900 text-emerald-400 font-mono p-4 rounded-2xl text-[10px] overflow-x-auto select-all break-all h-32 leading-relaxed">
                  {ssoPayload || 'Loading...'}
                </div>

                <div className="space-y-1 pt-2">
                  <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Decoded Key-Value String</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Inside the base64 payload lies this standard query string representing user properties:</p>
                </div>
                <div className="bg-gray-900 text-gray-300 font-mono p-4 rounded-2xl text-[10px] overflow-x-auto leading-relaxed select-all">
                  <div>nonce = {nonce}</div>
                  <div className="text-teal-400">email = {userEmail}</div>
                  <div>name = {currentUser}</div>
                  <div className="text-teal-400">username = {userEmail?.split('@')[0]}</div>
                  <div>external_id = {userEmail}</div>
                  <div className="text-gray-500 truncate">avatar_url = ...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

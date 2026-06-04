'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Radio, Calendar, Clock, User, ChevronRight, Video,
  Bell, Users, ShieldCheck, Zap, ArrowRight, Monitor,
  Layout, Globe, Star, Activity, Play, GraduationCap,
  BookOpen, CalendarDays, CheckCircle2, AlertCircle,
  Pause, Loader2, Maximize, X, Volume2, MonitorPlay, ChevronLeft, ChevronDown, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getVideoFromDB } from '@/lib/db';
import { getSubscribers } from '@/lib/subscriptionStore';

type LiveSession = {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  status: 'scheduled' | 'live' | 'completed';
  meetingLink: string;
  description: string;
  course: string;
  batch: string;
  liveType: string;
};

import { LiveClassesSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function StudentLivePagePage() {
  return (
    <ErrorBoundary>
      <StudentLivePage />
    </ErrorBoundary>
  );
}

function StudentLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [role, setRole] = useState<string>('student');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    date: '',
    time: '',
    duration: '60 mins',
    description: '',
    course: 'Cardiology - NEET PG',
    batch: '2026 Regular Batch',
    liveType: 'webinar'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      instructor: '',
      date: '',
      time: '',
      duration: '60 mins',
      description: '',
      course: 'Cardiology - NEET PG',
      batch: '2026 Regular Batch',
      liveType: 'webinar'
    });
    setIsModalOpen(false);
    setIsEditing(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setSessions(prev => prev.map(s => s.id === isEditing ? {
        ...s,
        ...formData,
        meetingLink: `/live/${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      } : s));
    } else {
      const newSession: LiveSession = {
        id: `live-session-${Date.now()}`,
        ...formData,
        status: 'scheduled',
        meetingLink: `/live/${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      };
      setSessions(prev => [newSession, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (session: LiveSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(session.id);
    setFormData({
      title: session.title,
      instructor: session.instructor,
      date: session.date,
      time: session.time,
      duration: session.duration,
      description: session.description || '',
      course: session.course,
      batch: session.batch,
      liveType: session.liveType
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this live session?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lms_live_sessions_v3', JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  // Video player state
  const [activeRecording, setActiveRecording] = useState<any | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('00:00');
  const [durationStr, setDurationStr] = useState('00:00');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('currentUserEmail');
    if (email) {
      const subs = getSubscribers();
      const mySub = subs.find(s => s.email.toLowerCase() === email.toLowerCase());
      setIsSubscribed(mySub?.status === 'Active');
    } else {
      setIsSubscribed(false);
    }
  }, []);

  const handlePlayRecording = async (rec: any) => {
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    setActiveRecording(rec);
    setVideoLoading(true);
    setVideoError(false);
    try {
      const blob = await getVideoFromDB(rec.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      }
    } catch (e) {
      console.error(e);
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleClosePlayer = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setActiveRecording(null);
    setVideoUrl(null);
    setIsPlaying(false);
    setPlaybackSpeed(1);
    setVideoProgress(0);
    setVideoError(false);
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setVideoProgress((current / duration) * 100);

      const curMin = Math.floor(current / 60);
      const curSec = Math.floor(current % 60);
      setCurrentTimeStr(`${String(curMin).padStart(2, '0')}:${String(curSec).padStart(2, '0')}`);

      if (!isNaN(videoRef.current.duration)) {
        const durMin = Math.floor(videoRef.current.duration / 60);
        const durSec = Math.floor(videoRef.current.duration % 60);
        setDurationStr(`${String(durMin).padStart(2, '0')}:${String(durSec).padStart(2, '0')}`);
      }
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  useEffect(() => {
    let active = true;
    const loadSessions = () => {
      let roleSaved = localStorage.getItem('userRole');
      const emailSaved = localStorage.getItem('currentUserEmail');
      if (roleSaved === 'student' && emailSaved) {
        const stored = localStorage.getItem('registeredUsers');
        if (stored) {
          try {
            const registeredUsers = JSON.parse(stored);
            const user = registeredUsers[emailSaved];
            if (user && (user.role === 'instructor' || user.role === 'admin')) {
              roleSaved = user.role;
              localStorage.setItem('userRole', user.role);
            }
          } catch (e) {
            console.error("Failed to parse registered users for auto-correct", e);
          }
        }
      }
      if (roleSaved && active) {
        setRole(roleSaved);
      }

      const saved = localStorage.getItem('lms_live_sessions_v3');
      if (saved && active) {
        try {
          setSessions(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse sessions", e);
        }
      }

      const savedRecs = localStorage.getItem('lms_live_recordings');
      if (savedRecs && active) {
        try {
          const parsed = JSON.parse(savedRecs);
          setRecordings(parsed.filter((r: any) => r.status === 'ready'));
        } catch (e) {
          console.error("Failed to parse recordings", e);
        }
      }
    };

    loadSessions();

    const timer = setTimeout(() => {
      if (active) setIsLoaded(true);
    }, 850);

    const interval = setInterval(loadSessions, 5000);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const liveSessions = sessions.filter(s => s.status === 'live');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  const getRelativeDateText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return null;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <LiveClassesSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] pt-24 pb-32 selection:bg-teal-500 selection:text-white">

      {/* Professional Medical Hero */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="relative rounded-[3rem] overflow-hidden bg-white border border-gray-100 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent"></div>

          <div className="relative z-10 px-8 py-20 md:px-16 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-3xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-xs font-black uppercase tracking-widest mb-8 border border-teal-100"
              >
                <GraduationCap className="w-4 h-4" />
                Advanced Medical Coaching
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight"
              >
                Master Your Exams with <br />
                <span className="text-teal-600">Expert Live Guidance.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Access high-yield interactive sessions tailored for NEET PG, USMLE, and FMGE by the nation's top medical faculty.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center lg:justify-start gap-5"
              >
                <Link href="#live-now" className="px-10 py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex items-center gap-2">
                  Join Active Class
                  <ArrowRight className="w-5 h-5" />
                </Link>
                {(role === 'instructor' || role === 'admin') && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-10 py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-xl shadow-black/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    Schedule New Session
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
                <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>)}
                  </div>
                  <span>Join 2,000+ students</span>
                </div>
              </motion.div>
            </div>

            {/* Trust Features */}
            <div className="hidden lg:grid grid-cols-2 gap-4 max-w-sm">
              {[
                { icon: CheckCircle2, title: 'HD 1080p', desc: 'Ultra-clear streaming' },
                { icon: Zap, title: 'Live Doubts', desc: 'Real-time interaction' },
                { icon: CalendarDays, title: 'Recorded', desc: 'Watch any time' },
                { icon: Star, title: 'Top Faculty', desc: 'Learn from the best' },
              ].map((item, i) => (
                <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <item.icon className="w-6 h-6 text-teal-600 mb-3" />
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">

        {/* Live Now Grid */}
        <section id="live-now" className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Active Sessions</h2>
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Happening Now</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {liveSessions.length > 0 ? liveSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] border border-red-500/20 shadow-xl overflow-hidden hover:shadow-red-500/10 transition-all duration-500"
                >
                  <div className="p-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        Live Now
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{session.liveType}</span>
                    </div>

                    <div className="mb-auto">
                      <div className="flex items-center gap-2 text-teal-600 text-[11px] font-bold uppercase tracking-widest mb-3">
                        {session.course} • {session.batch}
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 leading-tight mb-8">
                        {session.title}
                      </h3>

                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-100">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-gray-900 block">{session.instructor}</span>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Master Faculty</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Users className="w-4 h-4" />
                        1.2k+ watching
                      </div>
                      <Link
                        href={session.meetingLink.startsWith('/live/') ? session.meetingLink.replace('/live/', '/dashboard/live/') : session.meetingLink}
                        className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/30 flex items-center gap-2 active:scale-95"
                      >
                        Join Classroom
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6">
                    <Video className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No active live sessions</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs font-medium">Check the upcoming schedule below to attend the next high-yield class.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Upcoming Schedule */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Academic Schedule</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upcoming Interactive Classes</p>
              </div>
            </div>
            <button className="hidden md:block text-xs font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest transition-colors">Download Full Calendar</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
              <Link href={session.meetingLink.startsWith('/live/') ? session.meetingLink.replace('/live/', '/dashboard/live/') : session.meetingLink} key={session.id} className="block group">
                <motion.div
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm group-hover:shadow-xl transition-all duration-500 cursor-pointer h-full"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="px-3 py-1.5 bg-teal-50 rounded-lg text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      {session.liveType}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {session.time}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-6 line-clamp-2 h-14">{session.title}</h3>

                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-xs font-bold text-gray-400">
                      {session.instructor[0]}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{session.instructor}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{session.course}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const rel = getRelativeDateText(session.date);
                        if (rel) {
                          return (
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${rel === 'Today' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                              {rel}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <div className="text-xs font-bold text-gray-900">
                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(role === 'instructor' || role === 'admin') ? (
                        <>
                          <button 
                            onClick={(e) => handleEdit(session, e)}
                            className="p-2 text-gray-400 hover:text-teal-600 transition-colors cursor-pointer"
                            title="Edit Session"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={(e) => handleDelete(session.id, e)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors">
                          <Bell className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            )) : (
              <div className="col-span-full py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Your schedule is currently empty</p>
              </div>
            )}
          </div>
        </section>

        {/* Recorded Live Classes */}
        <section id="recordings" className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                <MonitorPlay className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Recorded Live Classes</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Classes You Attended</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recordings.length > 0 ? recordings.map((rec) => (
              <div key={rec.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-3 py-1 bg-teal-50 border border-teal-100 rounded-lg text-[10px] font-black text-teal-600 uppercase tracking-widest">
                      Record Ready
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 rounded-lg text-[9px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100">
                      Attended Verified
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 h-12">{rec.title}</h3>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-xs font-bold text-gray-400">
                      {rec.instructor[0]}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{rec.instructor}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Faculty</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {rec.duration}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{rec.date}</span>
                  </div>

                  <button
                    onClick={() => handlePlayRecording(rec)}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-teal-500/10"
                  >
                    <Play className="w-3 h-3 fill-current" /> Watch
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 mx-auto border border-gray-100">
                  <Video className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No live class recordings available yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Paywall Modal */}
        <AnimatePresence>
           {showPaywall && (
             <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowPaywall(false)}
                  className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-hidden"
                >
                   <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl"></div>
                   
                   <div className="flex flex-col items-center text-center gap-6">
                      <div className="w-20 h-20 bg-teal-50 rounded-[2rem] flex items-center justify-center border border-teal-100">
                         <Lock className="w-10 h-10 text-teal-600" />
                      </div>
                      
                      <div>
                         <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Premium Unlock Required</h2>
                         <p className="text-gray-500 font-medium leading-relaxed">
                            To watch live recordings and premium medical modules, you need an active PaceMaker subscription.
                         </p>
                      </div>

                      <div className="w-full flex flex-col gap-3">
                         <Link 
                           href="/pricing"
                           className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-teal-600/30 flex items-center justify-center gap-3"
                         >
                            View Subscription Plans <ChevronRight className="w-5 h-5" />
                         </Link>
                         <button 
                           onClick={() => setShowPaywall(false)}
                           className="w-full py-4 text-gray-400 hover:text-gray-900 font-bold transition-colors"
                         >
                            Maybe Later
                         </button>
                      </div>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        {/* Premium Custom Player Modal */}
        <AnimatePresence>
          {activeRecording && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClosePlayer}
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-gray-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[95vh] overflow-y-auto custom-scrollbar"
              >
                {/* Modal Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-gray-900/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Playing Lecture Recording</span>
                    <h2 className="text-lg font-black text-white line-clamp-1 mt-0.5">{activeRecording.title}</h2>
                  </div>
                  <button
                    onClick={handleClosePlayer}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Video Display Stage */}
                <div className="relative aspect-video w-full bg-black group flex items-center justify-center border-b border-white/5">
                  {videoLoading ? (
                    <div className="flex flex-col items-center gap-4 text-white/50">
                      <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
                      <p className="text-xs font-bold uppercase tracking-wider">Loading video player...</p>
                    </div>
                  ) : (videoUrl && !videoError) ? (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onClick={handleTogglePlay}
                      onError={() => setVideoError(true)}
                      autoPlay
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-red-400">
                      <AlertCircle className="w-12 h-12" />
                      <p className="text-xs font-bold uppercase tracking-wider">Failed to load video source</p>
                    </div>
                  )}

                  {/* Custom Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-4 z-20">

                    {/* Progress Bar */}
                    <div
                      onClick={handleProgressBarClick}
                      className="w-full bg-white/20 rounded-full h-2 overflow-hidden cursor-pointer relative group-hover/progress:h-3 transition-all"
                    >
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all relative"
                        style={{ width: `${videoProgress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-teal-500 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
                      </div>
                    </div>

                    {/* Button bar */}
                    <div className="flex items-center justify-between text-white select-none">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={handleTogglePlay}
                          className="hover:scale-110 transition-transform p-1 rounded bg-white/5 hover:bg-white/10"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>

                        <div className="flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-gray-300" />
                          <span className="text-xs font-bold">
                            {currentTimeStr} / {durationStr}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 relative">
                        {/* Playback speed selector */}
                        <div className="relative">
                          <button
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black transition-all flex items-center gap-1"
                          >
                            {playbackSpeed}x
                          </button>

                          <AnimatePresence>
                            {showSpeedMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full right-0 mb-2 w-28 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[1100]"
                              >
                                {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                                  <button
                                    key={speed}
                                    onClick={() => handleSpeedChange(speed)}
                                    className={`w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-teal-600 hover:text-white transition-colors ${playbackSpeed === speed ? 'text-teal-400 bg-white/5' : 'text-white'}`}
                                  >
                                    {speed}x
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          onClick={handleFullscreen}
                          className="p-1.5 hover:bg-white/10 rounded-xl transition-all"
                          title="Fullscreen"
                        >
                          <Maximize className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video detail details under player */}
                <div className="p-8 bg-gray-900/30 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                        {activeRecording.duration} MINS
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                      <span className="text-white/60 text-xs font-bold">Faculty: {activeRecording.instructor}</span>
                    </div>

                    <button
                      onClick={handleClosePlayer}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-600/10"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Section
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mt-2 font-medium">
                    You are viewing a recorded lecture from your Live Ecosystem. Attendance for this session has been verified, and you have unlimited streaming access to play back this class. Downloading is disabled for student accounts.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Professional Scheduling Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={resetForm}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar z-10"
              >
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-2xl font-extrabold text-gray-900">Schedule Medical Session</h2>
                      <p className="text-sm text-gray-500 font-medium">Configure high-yield interactive live coaching.</p>
                    </div>
                    <button onClick={resetForm} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Session Title</label>
                      <input
                        required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-bold text-gray-900"
                        placeholder="e.g. Rapid Revision: Cardiovascular Pathology"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Subject Faculty</label>
                        <input
                          required type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-500 transition-all font-bold text-gray-900"
                          placeholder="Dr. Aman Gupta"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Class Type</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between outline-none focus:border-teal-500 transition-all font-bold text-gray-900 text-left"
                          >
                            <span>
                              {formData.liveType === 'webinar' && 'Webinar (Broadcast Only)'}
                              {formData.liveType === 'interactive' && 'Interactive (Face-to-Face)'}
                              {formData.liveType === 'hybrid' && 'Hybrid (Broadcast + Live Q&A)'}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute z-[110] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                              >
                                {[
                                  { value: 'webinar', label: 'Webinar (Broadcast Only)' },
                                  { value: 'interactive', label: 'Interactive (Face-to-Face)' },
                                  { value: 'hybrid', label: 'Hybrid (Broadcast + Live Q&A)' }
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, liveType: option.value as any });
                                      setIsDropdownOpen(false);
                                    }}
                                    className={`w-full px-6 py-4 text-left font-bold transition-colors hover:bg-teal-50 ${formData.liveType === option.value ? 'bg-teal-50 text-teal-600' : 'text-gray-900'}`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Start Date</label>
                        <input
                          required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-500 transition-all font-bold text-sm text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Start Time</label>
                        <div className="flex gap-2">
                          <input
                            required type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-teal-500 transition-all font-bold text-sm text-gray-900"
                          />
                          <div className="flex bg-gray-50 rounded-2xl border border-gray-100 p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const [h, m] = formData.time.split(':');
                                if (!h) return;
                                const newH = parseInt(h) >= 12 ? parseInt(h) - 12 : parseInt(h);
                                setFormData({ ...formData, time: `${String(newH).padStart(2, '0')}:${m || '00'}` });
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${parseInt(formData.time.split(':')[0]) < 12 ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const [h, m] = formData.time.split(':');
                                if (!h) return;
                                const newH = parseInt(h) < 12 ? parseInt(h) + 12 : parseInt(h);
                                setFormData({ ...formData, time: `${String(newH).padStart(2, '0')}:${m || '00'}` });
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${parseInt(formData.time.split(':')[0]) >= 12 ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-teal-50/50 p-6 rounded-2xl border border-teal-100/50">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Target Course</label>
                        <select
                          name="course"
                          value={formData.course}
                          onChange={handleFormChange}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-teal-500 transition-all font-bold text-sm text-gray-900"
                        >
                          <option value="Cardiology - NEET PG">Cardiology - NEET PG</option>
                          <option value="Neurology - USMLE Step 1">Neurology - USMLE Step 1</option>
                          <option value="Pediatrics - FMGE">Pediatrics - FMGE</option>
                          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Target Batch</label>
                        <select
                          name="batch"
                          value={formData.batch}
                          onChange={handleFormChange}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-teal-500 transition-all font-bold text-sm text-gray-900"
                        >
                          <option value="2026 Regular Batch">2026 Regular Batch</option>
                          <option value="FastTrack Revision 2025">FastTrack Revision 2025</option>
                          <option value="Elite USMLE Batch">Elite USMLE Batch</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <button type="button" onClick={resetForm} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all font-black">Cancel</button>
                      <button type="submit" className="flex-[2] py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95 font-black">
                        {isEditing ? 'Update Session' : 'Confirm Schedule'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

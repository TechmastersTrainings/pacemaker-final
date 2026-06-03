'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Video, Users, Activity, Radio, Trash2, Edit3, X,
  Loader2, Globe, ShieldCheck, Zap, Calendar, Clock,
  Filter, BarChart3, ChevronRight, BookOpen, GraduationCap,
  MonitorPlay, Share2, MessageSquare, MoreHorizontal, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  liveType: 'interactive' | 'webinar' | 'hybrid';
  roomID: string;
  autoRecord?: boolean;
  retentionDays?: number;
};

import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AdminLiveManagementPage() {
  return (
    <ErrorBoundary>
      <AdminLiveManagement />
    </ErrorBoundary>
  );
}

function AdminLiveManagement() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled' | 'completed'>('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<LiveSession, 'id' | 'status' | 'roomID' | 'meetingLink'>>({
    title: '',
    instructor: '',
    date: '',
    time: '',
    duration: '60 mins',
    description: '',
    course: 'Cardiology - NEET PG',
    batch: '2026 Regular Batch',
    liveType: 'webinar',
    autoRecord: true,
    retentionDays: 30
  });

  useEffect(() => {
    const saved = localStorage.getItem('lms_live_sessions_v3');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lms_live_sessions_v3', JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setSessions(prev => prev.map(s => s.id === isEditing ? { ...s, ...formData } : s));
    } else {
      const roomID = Math.random().toString(36).substr(2, 12);
      const newSession: LiveSession = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'scheduled',
        roomID: roomID,
        meetingLink: `/dashboard/live/${roomID}`
      };
      setSessions(prev => [newSession, ...prev]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '', instructor: '', date: '', time: '', duration: '60 mins',
      description: '', course: 'Cardiology - NEET PG', batch: '2026 Regular Batch', liveType: 'webinar',
      autoRecord: true, retentionDays: 30
    });
    setIsEditing(null);
    setIsModalOpen(false);
  };

  const handleEdit = (session: LiveSession) => {
    setFormData({
      title: session.title, instructor: session.instructor, date: session.date, time: session.time,
      duration: session.duration, description: session.description, course: session.course,
      batch: session.batch, liveType: session.liveType,
      autoRecord: session.autoRecord ?? true,
      retentionDays: session.retentionDays ?? 30
    });
    setIsEditing(session.id);
    setIsModalOpen(true);
  };

  const handleGoLive = (id: string, roomID: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'live' } : s));
    router.push(`/dashboard/live/${roomID}`);
  };

  const toggleStatus = (id: string, currentStatus: LiveSession['status']) => {
    const nextStatus: LiveSession['status'] =
      currentStatus === 'scheduled' ? 'live' :
        currentStatus === 'live' ? 'completed' : 'scheduled';
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 md:p-10">
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent text-gray-900 p-6 md:p-10">

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-sm tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" />
            Live Learning Portal
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Live Class <span className="text-teal-600">Management</span></h1>
          <p className="text-gray-600 font-medium">Schedule and manage professional medical coaching sessions for your students.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Schedule New Session
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          { title: 'Live Now', value: sessions.filter(s => s.status === 'live').length, icon: Radio, color: 'text-red-500', bg: 'bg-red-500/10' },
          { title: 'Upcoming', value: sessions.filter(s => s.status === 'scheduled').length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { title: 'Total Sessions', value: sessions.length, icon: Video, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.title}</p>
              <p className="text-2xl font-black mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area: Search and List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col lg:flex-row gap-6 justify-between items-center bg-gray-50/50">
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 w-full lg:w-auto">
            {(['all', 'live', 'scheduled', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by instructor or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium transition-all text-gray-900"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                <th className="px-8 py-5">Session Details</th>
                <th className="px-6 py-5 text-center">Schedule</th>
                <th className="px-6 py-5 text-center">Type</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredSessions.length > 0 ? filteredSessions.map((session) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    key={session.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${session.status === 'live' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-teal-50 border-teal-100 text-teal-600'
                          }`}>
                          <MonitorPlay className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{session.course}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{session.batch}</span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900">{session.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Instructor: <span className="font-semibold text-gray-700">{session.instructor}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {session.time}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${session.liveType === 'webinar' ? 'bg-indigo-50 text-indigo-600' :
                          session.liveType === 'interactive' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        {session.liveType}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            if (session.status === 'scheduled') {
                              handleGoLive(session.id, session.roomID);
                            } else if (session.status === 'live') {
                              router.push(`/dashboard/live/${session.roomID}`);
                            } else {
                              toggleStatus(session.id, session.status);
                            }
                          }}
                          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${session.status === 'scheduled' ? 'bg-teal-600 text-white hover:bg-teal-700' :
                              session.status === 'live' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          {session.status === 'scheduled' ? 'Go Live' : session.status === 'live' ? 'Join Room' : 'Completed'}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(session)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(session.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <BookOpen className="w-16 h-16 mb-4" />
                        <p className="text-xl font-bold">No sessions found</p>
                        <p className="text-sm mt-1">Start by scheduling a new medical live class.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

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
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden"
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

                  <div className="grid grid-cols-2 gap-6">
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
                      <p className="text-[10px] text-gray-400 px-2 font-medium">
                        {formData.liveType === 'webinar' && "One-way broadcast perfect for large lectures (1000+ students)."}
                        {formData.liveType === 'interactive' && "Two-way video/audio ideal for small group doubt clearing sessions."}
                        {formData.liveType === 'hybrid' && "Interactive presentation with dedicated Q&A engagement tools."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
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

                  {/* Recording Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-teal-50/50 p-6 rounded-2xl border border-teal-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-widest px-1">Auto-record session</span>
                        <span className="text-[10px] text-gray-400 px-1 font-medium mt-1">Start recording when class starts</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, autoRecord: !formData.autoRecord })}
                        className={`w-12 h-6 rounded-full transition-colors relative outline-none flex items-center shrink-0 ${formData.autoRecord ? 'bg-teal-600' : 'bg-gray-200'}`}
                      >
                        <span className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${formData.autoRecord ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Keep recording for</label>
                      <select
                        value={formData.retentionDays}
                        onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
                        className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-teal-500 transition-all font-bold text-sm text-gray-900"
                      >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={resetForm} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95">
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
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Download, Trash2, Loader2, Volume2, Maximize, X, 
  Radio, Search, Calendar, Clock, ShieldAlert, Video, Sliders, 
  Settings, CheckCircle, AlertCircle, RefreshCw, BarChart, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoFromDB, deleteVideoFromDB } from '@/lib/db';

type LiveRecording = {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  fileSize: string;
  status: 'processing' | 'ready';
  createdAt: string;
  roomID: string;
  retentionDays: number;
};

type Toast = {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
};

export default function InstructorRecordingsPage() {
  const [recordings, setRecordings] = useState<LiveRecording[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'processing'>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Custom video player states
  const [activeRecording, setActiveRecording] = useState<LiveRecording | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('00:00');
  const [durationStr, setDurationStr] = useState('00:00');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Admin policy states
  const [globalRetention, setGlobalRetention] = useState<number>(30);
  const [policyUpdated, setPolicyUpdated] = useState(false);

  // Load initial configurations
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'instructor';
    const name = localStorage.getItem('currentUser') || 'Dr. Aman Gupta';
    setUserRole(role);
    setCurrentUser(name);

    // Global Retention Policy loading
    const savedPolicy = localStorage.getItem('lms_global_retention_policy');
    if (savedPolicy) {
      setGlobalRetention(parseInt(savedPolicy));
    }

    // Recordings list loading
    loadRecordings();
  }, []);

  const loadRecordings = () => {
    const saved = localStorage.getItem('lms_live_recordings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setRecordings(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse recordings", e);
      }
    }
    
    // Mock data to pre-populate if empty or missing
    const name = localStorage.getItem('currentUser') || 'Dr. Aman Gupta';
    const mockRecordings: LiveRecording[] = [
      {
        id: 'rec_mock_1',
        title: 'ECG Interpretation & Cardiac Arrhythmias Masterclass',
        instructor: name,
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        time: '10:00 AM',
        duration: '45:12',
        fileSize: '38.4 MB',
        status: 'ready',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        roomID: 'cardio_ecg_1',
        retentionDays: 30
      },
      {
        id: 'rec_mock_2',
        title: 'Traumatic Brain Injury & Emergency Neurosurgery Protocols',
        instructor: name,
        date: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
        time: '04:00 PM',
        duration: '58:45',
        fileSize: '51.2 MB',
        status: 'ready',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        roomID: 'em_tbi_3',
        retentionDays: 60
      },
      {
        id: 'rec_mock_3',
        title: 'Pharmacology Seminar: Endocrinology & Diabetes Therapeutics',
        instructor: 'Dr. Sarah Jenkins',
        date: new Date(Date.now() - 86400000 * 1).toLocaleDateString(),
        time: '09:00 AM',
        duration: '32:10',
        fileSize: '29.1 MB',
        status: 'ready',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        roomID: 'endo_pharm_2',
        retentionDays: 30
      }
    ];
    localStorage.setItem('lms_live_recordings', JSON.stringify(mockRecordings));
    setRecordings(mockRecordings);
  };

  // Toast Notifier Helper
  const triggerToast = (type: 'success' | 'info' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Simulated processing status check (turns 'processing' into 'ready' after 10 seconds from creation)
  useEffect(() => {
    const interval = setInterval(() => {
      let updatedAny = false;
      const now = Date.now();
      const nextRecordings = recordings.map(rec => {
        if (rec.status === 'processing') {
          const elapsed = now - new Date(rec.createdAt).getTime();
          if (elapsed > 10000) { // 10 seconds processing
            updatedAny = true;
            triggerToast('success', `Recording ready: ${rec.title}`);
            return { ...rec, status: 'ready' as const };
          }
        }
        return rec;
      });

      if (updatedAny) {
        setRecordings(nextRecordings);
        localStorage.setItem('lms_live_recordings', JSON.stringify(nextRecordings));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [recordings]);

  // Download logic
  const handleDownload = async (rec: LiveRecording) => {
    try {
      triggerToast('info', `Retrieving recording data for ${rec.title}...`);
      
      const blob = await getVideoFromDB(rec.id);
      
      if (!blob) {
        // Fallback mock blob if not found in DB (e.g. mock data)
        const mockBlob = new Blob(["mock video content"], { type: 'video/mp4' });
        triggerDownload(mockBlob, rec);
        return;
      }

      triggerDownload(blob, rec);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Failed to retrieve recording for download.');
    }
  };

  const triggerDownload = (blob: Blob, rec: LiveRecording) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Format ClassName_Date.mp4 (replace spaces with underscores in class name)
    const formattedTitle = rec.title.replace(/[^a-zA-Z0-9]/g, '_');
    const formattedDate = rec.date.replace(/[/]/g, '-');
    a.download = `${formattedTitle}_${formattedDate}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('success', 'Download started successfully.');
  };

  // Play logic
  const handlePlay = async (rec: LiveRecording) => {
    setActiveRecording(rec);
    setVideoLoading(true);
    setVideoError(false);
    try {
      const blob = await getVideoFromDB(rec.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        // Mock video source if blob is absent
        setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      }
    } catch (e) {
      console.error(e);
      setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    } finally {
      setVideoLoading(false);
    }
  };

  // Close player modal
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

  // Delete logic
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this recording?')) {
      try {
        await deleteVideoFromDB(id);
        const updated = recordings.filter(r => r.id !== id);
        setRecordings(updated);
        localStorage.setItem('lms_live_recordings', JSON.stringify(updated));
        
        // Also remove from lms_recent_videos compatibility list
        const savedVideos = JSON.parse(localStorage.getItem('lms_recent_videos') || '[]');
        localStorage.setItem('lms_recent_videos', JSON.stringify(savedVideos.filter((v: any) => v.id !== id)));

        triggerToast('success', 'Recording successfully deleted.');
      } catch (err) {
        console.error(err);
        triggerToast('error', 'Failed to delete recording.');
      }
    }
  };

  // Save admin retention policy
  const handleSaveRetention = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('lms_global_retention_policy', globalRetention.toString());
    setPolicyUpdated(true);
    triggerToast('success', `Global retention policy updated to ${globalRetention} days.`);
    setTimeout(() => setPolicyUpdated(false), 2000);
  };

  // Custom Video Player Controls
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setVideoProgress((current / duration) * 100);

      // Formatting
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

  // Filter recordings: instructors see only their own recordings; admins see all
  const filteredRecordings = recordings.filter(rec => {
    if (userRole === 'admin') return true;
    
    // For instructors: check if they are the instructor, recorded it, or if it is mock
    const recInst = rec.instructor ? rec.instructor.toLowerCase().trim() : '';
    const recRecBy = (rec as any).recordedBy ? (rec as any).recordedBy.toLowerCase().trim() : '';
    const curr = currentUser ? currentUser.toLowerCase().trim() : '';
    
    const matchesInstructor = recInst === curr || recInst.includes(curr) || curr.includes(recInst);
    const matchesRecordedBy = recRecBy === curr || recRecBy.includes(curr) || curr.includes(recRecBy);
    const isMock = rec.id.startsWith('rec_mock_');
    
    const isInstructorSelf = matchesInstructor || matchesRecordedBy || isMock;
    
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rec.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    return isInstructorSelf && matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-transparent text-gray-900 p-6 md:p-10 selection:bg-teal-500 selection:text-white">
      
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 ${
                t.type === 'success' ? 'bg-teal-50 border-teal-100 text-teal-800' :
                t.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' :
                'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />}
              {t.type === 'info' && <Loader2 className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <span className="text-xs font-black leading-normal">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-sm tracking-wide uppercase">
            <Radio className="w-4 h-4" />
            Class Recording Vault
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Recorded Live <span className="text-teal-600">Classes</span>
          </h1>
          <p className="text-gray-600 font-medium">
            {userRole === 'admin' 
              ? 'Global administrative view and management of all scheduled class recordings.' 
              : `Review and download your recorded lectures. Session records are stored securely in local database.`
            }
          </p>
        </div>

        {/* Global Admin retention policy controls */}
        {userRole === 'admin' && (
          <form onSubmit={handleSaveRetention} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Policy</span>
              <span className="text-xs font-bold text-gray-700 mt-0.5">Auto-delete recordings after</span>
            </div>
            <select
              value={globalRetention}
              onChange={(e) => setGlobalRetention(parseInt(e.target.value))}
              className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-teal-500"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md shadow-teal-500/10 active:scale-95"
            >
              Update
            </button>
          </form>
        )}
      </div>

      {/* Analytics overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { title: 'Total Recordings', value: filteredRecordings.length, icon: Video, color: 'text-teal-500', bg: 'bg-teal-500/10' },
          { title: 'Processing', value: filteredRecordings.filter(r => r.status === 'processing').length, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500/10', anim: true },
          { title: 'Active Policy', value: userRole === 'admin' ? `${globalRetention} Days` : '30-90 Days', icon: Settings, color: 'text-blue-500', bg: 'bg-blue-500/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color} ${stat.anim && stat.value > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.title}</p>
              <p className="text-2xl font-black mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col lg:flex-row gap-6 justify-between items-center bg-gray-50/50">
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 w-full lg:w-auto">
            {(['all', 'ready', 'processing'] as const).map((filterVal) => (
              <button
                key={filterVal}
                onClick={() => setStatusFilter(filterVal)}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === filterVal ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {filterVal}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search recordings by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 text-sm font-medium transition-all text-gray-900"
            />
          </div>
        </div>

        {/* Recordings Table / Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                <th className="px-8 py-5">Class Title</th>
                <th className="px-6 py-5 text-center">Faculty</th>
                <th className="px-6 py-5 text-center">Duration / Size</th>
                <th className="px-6 py-5 text-center">Status / Policy</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredRecordings.length > 0 ? filteredRecordings.map((rec) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    key={rec.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                          rec.status === 'ready' ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-amber-50 border-amber-100 text-amber-500'
                        }`}>
                          {rec.status === 'ready' ? (
                            <Play className="w-5 h-5 fill-current" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1">{rec.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {rec.date}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rec.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <span className="text-sm font-bold text-gray-700">{rec.instructor}</span>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-900">{rec.duration}</span>
                        <span className="text-xs text-gray-400 mt-1 font-semibold">{rec.fileSize}</span>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                          rec.status === 'ready' ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {rec.status === 'ready' ? 'Ready' : 'Processing'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          Keep for {rec.retentionDays} Days
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {rec.status === 'ready' ? (
                          <>
                            <button
                              onClick={() => handlePlay(rec)}
                              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Watch
                            </button>
                            <button
                              onClick={() => handleDownload(rec)}
                              className="p-2.5 border border-gray-200 text-gray-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-100 rounded-xl transition-all active:scale-95"
                              title="Download MP4"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100/50 text-xs font-black">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing recording...
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-2.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all active:scale-95"
                          title="Delete Recording"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <Video className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-xl font-bold">No recordings found</p>
                        <p className="text-sm mt-1">Recorded classes will automatically appear here once finalized.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Video Player Modal */}
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
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Watching Recording</span>
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
                    <ShieldAlert className="w-12 h-12" />
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
                  This live classroom recording has been processed and saved locally in your database. It includes all audio, video, and screen shares broadcasted during the session. Global administrative policy applies to the retention period of {activeRecording.retentionDays} days.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

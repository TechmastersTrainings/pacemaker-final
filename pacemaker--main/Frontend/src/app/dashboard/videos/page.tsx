'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Play, Lock, Search, Filter, 
  ChevronRight, Calendar, Clock, 
  AlertCircle, CheckCircle2, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSubscribers } from '@/lib/subscriptionStore';
import ErrorBoundary from '@/components/ErrorBoundary';

interface VideoItem {
  id: string;
  title: string;
  status: string;
  instructor: string;
  date: string;
  duration: string;
}

function StudentVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch Videos from lms_recent_videos
    const saved = localStorage.getItem('lms_recent_videos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVideos(parsed.filter((v: any) => v.status === 'Ready to stream'));
      } catch (e) {
        console.error("Failed to parse videos", e);
      }
    }

    // 2. Check Subscription
    const email = localStorage.getItem('currentUserEmail');
    if (email) {
      const subs = getSubscribers();
      const mySub = subs.find(s => s.email.toLowerCase() === email.toLowerCase());
      setIsSubscribed(mySub?.status === 'Active');
    } else {
      setIsSubscribed(false);
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleWatchClick = (video: VideoItem) => {
    if (!isSubscribed) {
      setSelectedVideo(video);
      setShowPaywall(true);
      return;
    }
    router.push(`/dashboard/videos/${video.id}`);
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold font-mono uppercase tracking-widest text-xs">Accessing Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 selection:bg-primary-500 selection:text-white">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                 <Video className="w-6 h-6" />
              </div>
              Video Library
           </h1>
           <p className="text-gray-500 font-medium mt-2">Premium medical lectures and clinical modules from top faculty.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${isSubscribed ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isSubscribed ? 'Premium Access Active' : 'No Active Subscription'}
           </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search by title, instructor or clinical subject..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white border border-gray-100 shadow-sm rounded-3xl pl-16 pr-8 py-5 text-gray-900 font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
               />
            </div>
         </div>
         <div className="bg-white border border-gray-100 rounded-[2rem] p-6 flex flex-col justify-center shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Available</span>
            <p className="text-3xl font-black text-gray-900">{videos.length} <span className="text-sm font-bold text-gray-400">Modules</span></p>
         </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
         {filteredVideos.map((video, idx) => (
           <motion.div 
             key={video.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
             className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col"
           >
              {/* Thumbnail Placeholder */}
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-blue-600/20 mix-blend-overlay"></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform duration-700">
                    <Video className="w-16 h-16 text-white" />
                 </div>
                 
                 {/* Metadata Overlays */}
                 <div className="absolute top-4 left-4">
                    <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                       {video.duration || '00:00'}
                    </div>
                 </div>

                 {!isSubscribed && (
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white">
                          <Lock className="w-5 h-5 shadow-lg" />
                       </div>
                    </div>
                 )}

                 <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              {/* Content */}
              <div className="p-8 flex-1 flex flex-col">
                 <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-primary-600 transition-colors leading-tight">
                       {video.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 mb-6">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Clock className="w-3.5 h-3.5" /> {video.date}
                       </div>
                       <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Calendar className="w-3.5 h-3.5" /> Prof. {video.instructor}
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => handleWatchClick(video)}
                   className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                     isSubscribed 
                       ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                   }`}
                 >
                    {isSubscribed ? (
                      <>Watch Module <Play className="w-4 h-4 fill-current" /></>
                    ) : (
                      <>Unlock Premium <Lock className="w-4 h-4" /></>
                    )}
                 </button>
              </div>
           </motion.div>
         ))}

         {filteredVideos.length === 0 && (
           <div className="col-span-full py-40 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                 <Search className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No modules found</h3>
              <p className="text-gray-500 mt-2">Adjust your search or check back later for new uploads.</p>
           </div>
         )}
      </div>

      {/* Paywall Modal */}
      <AnimatePresence>
         {showPaywall && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
                 <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl"></div>
                 
                 <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-20 h-20 bg-primary-50 rounded-[2rem] flex items-center justify-center border border-primary-100">
                       <Lock className="w-10 h-10 text-primary-600" />
                    </div>
                    
                    <div>
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Premium Content Locked</h2>
                       <p className="text-gray-500 font-medium leading-relaxed">
                          The module <span className="text-primary-600 font-bold">"{selectedVideo?.title}"</span> requires an active PaceMaker subscription.
                       </p>
                    </div>

                    <div className="w-full bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                       <FeatureItem text="Unlimited access to 500+ clinical videos" />
                       <FeatureItem text="Interactive Q-Bank with AI analytics" />
                       <FeatureItem text="National level mock exams & ranking" />
                    </div>

                    <div className="w-full flex flex-col gap-3">
                       <Link 
                         href="/pricing"
                         className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-3"
                       >
                          View Pricing Plans <ChevronRight className="w-5 h-5" />
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
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-left">
       <div className="shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
       </div>
       <span className="text-sm font-bold text-gray-700">{text}</span>
    </div>
  );
}

export default function StudentVideosPageWithError() {
  return (
    <ErrorBoundary>
       <StudentVideosPage />
    </ErrorBoundary>
  );
}

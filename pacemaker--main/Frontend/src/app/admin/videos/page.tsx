'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video, UploadCloud, Info, CheckCircle2, Film, Loader2, X, Play, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveVideoToDB, getVideoFromDB, deleteVideoFromDB } from '@/lib/db';

import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AdminVideosPagePage() {
  return (
    <ErrorBoundary>
      <AdminVideosPage />
    </ErrorBoundary>
  );
}

function AdminVideosPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [recentVideos, setRecentVideos] = useState<{id: string, title: string, status: string}[]>([]);
  const [playingVideo, setPlayingVideo] = useState<{title: string, videoUrl: string} | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('Anatomy');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Load metadata from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lms_recent_videos');
    let recent: any[] = [];
    if (saved) {
      try {
        recent = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved videos", e);
      }
    }
    
    // Sync recordings from lms_live_recordings to make sure all live recordings are also visible here
    const savedRecs = localStorage.getItem('lms_live_recordings');
    if (savedRecs) {
      try {
        const liveRecs = JSON.parse(savedRecs);
        liveRecs.forEach((rec: any) => {
          if (rec.status === 'ready' && !recent.some((v: any) => v.id === rec.id)) {
            recent.unshift({
              id: rec.id,
              title: `Live Recording: ${rec.title}`,
              status: 'Ready to stream'
            });
          }
        });
      } catch (e) {
        console.error("Failed to parse live recordings in videos page", e);
      }
    }
    
    setRecentVideos(recent);
    
    // Simulate loading delay to show skeleton
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Save metadata to local storage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lms_recent_videos', JSON.stringify(recentVideos));
    }
  }, [recentVideos, isLoaded]);

  const handlePublish = async () => {
    if (!isUploadComplete || !currentFile) return;
    setIsPublishing(true);
    
    const newVideoId = Date.now().toString();
    
    try {
      await saveVideoToDB(newVideoId, currentFile);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRecentVideos(prev => [{ 
        id: newVideoId, 
        title: title || 'New Uploaded Video', 
        status: 'Processing...',
      }, ...prev]);
      
      setTitle('');
      setInstructor('');
      setDescription('');
      setIsUploadComplete(false);
      setUploadKey(prev => prev + 1);
      setCurrentFile(null);
      setIsPublishing(false);
      
      setTimeout(() => {
        setRecentVideos(prev => prev.map(v => v.id === newVideoId ? { ...v, status: 'Ready to stream' } : v));
      }, 4000);
      
      alert('Video published and stored permanently!');
    } catch (err) {
      console.error("Storage failed", err);
      alert("Failed to save video. Your browser storage might be full.");
      setIsPublishing(false);
    }
  };
  
  const handlePlayVideo = async (video: {id: string, title: string}) => {
    try {
      setVideoError(false);
      const blob = await getVideoFromDB(video.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPlayingVideo({ title: video.title, videoUrl: url });
      } else {
        setVideoError(true);
        setPlayingVideo({ title: video.title, videoUrl: '' });
      }
    } catch (err) {
      console.error("Playback failed", err);
      setVideoError(true);
    }
  };

  const handleDeleteVideo = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video permanently?')) {
      try {
        await deleteVideoFromDB(id);
        setRecentVideos(prev => prev.filter(v => v.id !== id));
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };
  
  // SHOW SKELETON WHILE LOADING
  if (!isLoaded) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4 border border-primary-200">
          <Film className="w-4 h-4" /> Content Studio
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Video Management</h1>
        <p className="text-gray-500 mt-2">Upload and store educational videos permanently in your browser.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl z-0"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary-500" />
                Upload New Module
              </h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Video Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900 font-medium outline-none" 
                    placeholder="e.g., Introduction to Cardiology - Part 1" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject Category</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-primary-500 transition-all flex items-center justify-between text-gray-900 font-medium outline-none"
                      >
                        <span>{subject}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isSubjectDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-[110] left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                          >
                            {['Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Pathology'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSubject(opt);
                                  setIsSubjectDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left transition-colors hover:bg-primary-50 ${subject === opt ? 'bg-primary-50 text-primary-600 font-bold' : 'text-gray-700'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Instructor</label>
                    <input 
                      type="text" 
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900 font-medium outline-none" 
                      placeholder="Dr. Jane Doe" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea 
                    rows={3} 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:ring-2 focus:ring-primary-500 transition-shadow text-gray-900 resize-none outline-none" 
                    placeholder="Briefly describe the key learning objectives..." 
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-gray-50/50 transition-colors hover:border-primary-400 group overflow-hidden min-h-[200px]">
                <input 
                  type="file"
                  accept="video/*"
                  key={uploadKey}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCurrentFile(file);
                      setIsUploadComplete(true);
                    }
                  }}
                />
                {!isUploadComplete && !isPublishing && (
                  <>
                    <UploadCloud className="w-12 h-12 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
                    <p className="mt-4 text-sm font-bold text-gray-900">Drag & drop your file or click to browse</p>
                    <p className="text-xs text-gray-500 mt-2">Supports MP4, MOV, WebM (Stored locally in your browser)</p>
                  </>
                )}
                
                {isPublishing && (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                    <p className="text-sm font-bold text-gray-900 text-center">
                      Saving Permanently to Browser Storage... <br/>
                      <span className="text-xs font-normal text-gray-500 italic">Do not close this window</span>
                    </p>
                  </div>
                )}

                {isUploadComplete && !isPublishing && (
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                    <p className="mt-4 text-sm font-bold text-green-600">{currentFile?.name} ready!</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center gap-6">
                <button 
                  className="font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  onClick={() => {
                    setTitle('');
                    setInstructor('');
                    setDescription('');
                    setIsUploadComplete(false);
                    setCurrentFile(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing || !isUploadComplete}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isPublishing ? 'Storing...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">

          {/* Live Recordings Box */}
          <div className="glass-panel p-6 rounded-3xl border border-gray-200 shadow-sm mb-6">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Video className="w-5 h-5 text-red-500" /> Live Recordings
             </h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {recentVideos.filter(v => v.id.startsWith('rec_')).length === 0 ? (
                 <div className="text-center p-4 text-sm text-gray-500">
                   No live recordings yet.
                 </div>
               ) : (
                 recentVideos.filter(v => v.id.startsWith('rec_')).map((video) => (
                   <div 
                     key={video.id} 
                      onClick={() => {
                        if (video.status === 'Ready to stream') {
                          router.push(`/dashboard/videos/${video.id}`);
                        }
                      }}
                     className={`flex gap-3 items-center p-3 rounded-xl transition-colors border border-transparent ${video.status === 'Ready to stream' ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-200 group' : 'opacity-70 cursor-wait'}`}
                   >
                     <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                       <Video className={`w-5 h-5 text-red-400 ${video.status === 'Ready to stream' ? 'group-hover:opacity-0 transition-opacity' : ''}`} />
                       {video.status === 'Ready to stream' && (
                         <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Play className="w-5 h-5 text-red-600 fill-current" />
                         </div>
                       )}
                     </div>
                     <div className="overflow-hidden flex-1">
                       <p className="text-sm font-bold text-gray-900 truncate">{video.title}</p>
                       <p className={`text-xs font-medium mt-0.5 ${video.status === 'Ready to stream' ? 'text-green-600' : 'text-amber-500 animate-pulse'}`}>
                         {video.status}
                       </p>
                     </div>
                     <button
                       onClick={(e) => handleDeleteVideo(e, video.id)}
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                       title="Delete Recording"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>

          {/* Uploaded Videos Box */}
          <div className="glass-panel p-6 rounded-3xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <UploadCloud className="w-5 h-5 text-primary-500" /> Uploaded Videos
             </h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {recentVideos.filter(v => !v.id.startsWith('rec_')).length === 0 ? (
                 <div className="text-center p-4 text-sm text-gray-500">
                   No uploaded videos yet.
                 </div>
               ) : (
                 recentVideos.filter(v => !v.id.startsWith('rec_')).map((video) => (
                   <div 
                     key={video.id} 
                     onClick={() => {
                       if (video.status === 'Ready to stream') {
                         router.push(`/dashboard/videos/${video.id}`);
                       }
                     }}
                     className={`flex gap-3 items-center p-3 rounded-xl transition-colors border border-transparent ${video.status === 'Ready to stream' ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-200 group' : 'opacity-70 cursor-wait'}`}
                   >
                     <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                       <Video className={`w-5 h-5 text-primary-400 ${video.status === 'Ready to stream' ? 'group-hover:opacity-0 transition-opacity' : ''}`} />
                       {video.status === 'Ready to stream' && (
                         <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Play className="w-5 h-5 text-primary-600 fill-current" />
                         </div>
                       )}
                     </div>
                     <div className="overflow-hidden flex-1">
                       <p className="text-sm font-bold text-gray-900 truncate">{video.title}</p>
                       <p className={`text-xs font-medium mt-0.5 ${video.status === 'Ready to stream' ? 'text-green-600' : 'text-amber-500 animate-pulse'}`}>
                         {video.status}
                       </p>
                     </div>
                     <button
                       onClick={(e) => handleDeleteVideo(e, video.id)}
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                       title="Delete Video"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))
               )}
             </div>
             <button className="w-full mt-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
               View All Uploads
             </button>
          </div>
        </div>

      </div>

      {/* Full Screen Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col w-screen h-screen overflow-hidden" style={{ margin: 0, padding: 0 }}>
          <div className="absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 flex items-start justify-between pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button 
                onClick={() => {
                  if (playingVideo.videoUrl) URL.revokeObjectURL(playingVideo.videoUrl);
                  setPlayingVideo(null);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all text-white flex items-center justify-center hover:scale-105"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h3 className="font-bold text-xl text-white drop-shadow-md truncate max-w-2xl">{playingVideo.title}</h3>
            </div>
            <button 
              onClick={() => {
                if (playingVideo.videoUrl) URL.revokeObjectURL(playingVideo.videoUrl);
                setPlayingVideo(null);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all text-white flex items-center justify-center hover:scale-105 pointer-events-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center p-12">
            {playingVideo.videoUrl && !videoError ? (
              <video 
                src={playingVideo.videoUrl} 
                controls 
                autoPlay 
                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="text-center p-8 max-w-md mx-auto bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
                <Film className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <h4 className="text-white text-xl font-bold mb-3">Video Unavailable</h4>
                <p className="text-gray-400">
                  The stored video data could not be retrieved from your browser storage.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
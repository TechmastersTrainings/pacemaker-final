'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, Flag, Trash2, CheckCircle, 
  XCircle, Search, Filter, AlertTriangle, 
  ShieldAlert, UserX, BarChart3, ChevronRight,
  MoreVertical, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { commentService } from '@/services/commentService';
import type { Comment } from '@/lib/commentStore';
import Link from 'next/link';

import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AdminCommentsPagePage() {
  return (
    <ErrorBoundary>
      <AdminCommentsPage />
    </ErrorBoundary>
  );
}

function AdminCommentsPage() {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterReported, setFilterReported] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchComments = async () => {
    try {
      const rawComments = await commentService.getAllComments();
      const mapped: Comment[] = rawComments.map((rc: any) => ({
        id: String(rc.id),
        videoId: String(rc.videoId),
        userId: String(rc.userId),
        userName: rc.userId === 1 ? 'Instructor' : `Student #${rc.userId}`,
        text: rc.commentText || '',
        likes: [],
        replies: [],
        isPinned: false,
        isAnswered: false,
        isInstructor: rc.userId === 1,
        isVerified: rc.userId === 1,
        isReported: false,
        reportCount: 0,
        status: 'approved',
        createdAt: rc.createdAt || new Date().toISOString()
      }));
      setAllComments(mapped);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let result = [...allComments];
    
    if (searchTerm) {
      result = result.filter(c => 
        c.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }
    
    if (filterReported) {
      result = result.filter(c => c.isReported);
    }
    
    setFilteredComments(result);
  }, [searchTerm, filterStatus, filterReported, allComments]);

  const handleBulkApprove = () => {
    const updated = allComments.map(c => {
      if (selectedIds.includes(c.id)) {
        return { ...c, isReported: false, status: 'approved' as const, reportCount: 0 };
      }
      return c;
    });
    setAllComments(updated);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} comments?`)) {
      try {
        for (const id of selectedIds) {
          await commentService.deleteComment(Number(id));
        }
        await fetchComments();
        setSelectedIds([]);
      } catch (err) {
        console.error('Error bulk deleting comments:', err);
      }
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'delete' | 'ban') => {
    if (action === 'approve') {
      const updated = allComments.map(c => 
        c.id === id ? { ...c, isReported: false, status: 'approved' as const, reportCount: 0 } : c
      );
      setAllComments(updated);
    } else if (action === 'delete') {
      if (confirm('Delete this comment permanently?')) {
        try {
          await commentService.deleteComment(Number(id));
          await fetchComments();
        } catch (err) {
          console.error('Error deleting comment:', err);
        }
      }
    } else if (action === 'ban') {
      alert(`User with ID ${allComments.find(c => c.id === id)?.userId} would be restricted.`);
    }
  };

  const stats = [
    { title: 'Reported Comments', value: allComments.filter(c => c.isReported).length, icon: Flag, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Total Comments', value: allComments.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Moderation', value: allComments.filter(c => c.status === 'pending').length, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Active Users', value: new Set(allComments.map(c => c.userId)).size, icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-50' },
  ];

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6">
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Comment Moderation</h1>
        <p className="text-gray-500 mt-2 font-medium">Review reported comments and maintain community standards.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-6`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{s.title}</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search comments or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary-500 text-sm font-bold transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-black uppercase tracking-widest text-gray-600 outline-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <button 
              onClick={() => setFilterReported(!filterReported)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterReported ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
            >
              Reported Only
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-between"
          >
            <span className="text-sm font-bold text-primary-800">{selectedIds.length} comments selected</span>
            <div className="flex gap-4">
              <button onClick={handleBulkApprove} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all">
                <CheckCircle className="w-4 h-4" /> Approve Selected
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition-all">
                <Trash2 className="w-4 h-4" /> Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {filteredComments.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
            <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900">No comments found</h3>
            <p className="text-gray-500">Everything looks clean for now!</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex gap-6 transition-all hover:shadow-xl ${selectedIds.includes(comment.id) ? 'ring-2 ring-primary-500' : ''}`}>
              <div className="flex flex-col items-center gap-4">
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(comment.id)}
                  onChange={() => {
                    setSelectedIds(prev => 
                      prev.includes(comment.id) ? prev.filter(id => id !== comment.id) : [...prev, comment.id]
                    );
                  }}
                  className="w-5 h-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${comment.isInstructor ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {comment.userName[0]}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-gray-900 text-lg">{comment.userName}</span>
                      {comment.isInstructor && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[8px] font-black uppercase tracking-widest rounded">Instructor</span>}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/dashboard/videos/${comment.videoId}`} className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> View Source Video
                    </Link>
                  </div>
                  
                  {comment.isReported && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">Reported ({comment.reportCount})</span>
                        <span className="text-xs font-bold">{comment.reportReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                   <p className="text-gray-700 font-medium leading-relaxed">{comment.text}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex gap-4">
                      <button onClick={() => handleAction(comment.id, 'approve')} className="flex items-center gap-2 text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-green-100">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleAction(comment.id, 'delete')} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-100">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                   </div>
                   
                   <div className="flex gap-2">
                      <button onClick={() => handleAction(comment.id, 'ban')} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                        <UserX className="w-4 h-4" /> Warn User
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

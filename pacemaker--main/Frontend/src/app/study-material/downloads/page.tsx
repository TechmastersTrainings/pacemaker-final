'use client';

import { useState, useEffect } from 'react';
import { 
  Download, ArrowLeft, Trash2, Calendar, FileText, LayoutGrid, Check, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { 
  getDownloads, removeDownload, getMaterials, addDownload, DownloadLog
} from '@/lib/studyMaterialStore';
import type { StudyMaterial } from '@/lib/studyMaterialStore';
import { studyMaterialService } from '@/services/studyMaterialService';

interface Toast {
  id: string;
  type: 'success';
  message: string;
}

export default function StudentDownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setDownloads(getDownloads());
    
    const loadMaterials = async () => {
      try {
        const rawMaterials = await studyMaterialService.getAllMaterials();
        const mapped: StudyMaterial[] = rawMaterials.map((bm: any) => ({
          id: String(bm.id),
          title: bm.title || bm.fileName || 'Untitled Study Material',
          subject: bm.subjectName || 'General',
          chapter: bm.chapterName || 'General',
          description: `High-yield clinical revision study material for ${bm.chapterName || 'General'} chapter in ${bm.subjectName || 'General'}.`,
          type: 'Notes' as const,
          difficulty: 'Intermediate',
          tags: [bm.subjectName || 'Medical', 'Clinical'],
          fileUrl: `/api/v1/study-materials/download/${bm.id}`,
          fileSize: bm.fileSize ? `${(bm.fileSize / 1024 / 1024).toFixed(2)} MB` : '1.5 MB',
          pageCount: 6,
          thumbnail: '',
          downloadCount: 145,
          rating: 4.8,
          ratingsCount: 22,
          allowDownload: true,
          freePreview: true,
          previewPages: 4,
          displayOrder: 1,
          status: 'published' as const,
          uploadedBy: 'Dr. Aman Gupta',
          uploadedAt: bm.uploadedAt || new Date().toISOString(),
          updatedAt: bm.uploadedAt || new Date().toISOString()
        }));
        const local = getMaterials();
        const combined = [...mapped, ...local.filter(lm => !mapped.some(rm => String(rm.id) === String(lm.id)))];
        setMaterials(combined);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setMaterials(getMaterials());
      }
    };
    loadMaterials();
  }, []);

  const addToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type: 'success', message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleRemoveLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Remove this file from your downloads list?')) {
      removeDownload(id);
      setDownloads(getDownloads());
      addToast('Download removed from history.');
    }
  };

  const handleReDownload = async (materialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const mat = materials.find(m => m.id === materialId);
    if (!mat) {
      addToast('Original source material not found.');
      return;
    }

    try {
      addToast(`Re-downloading ${mat.title}...`);
      
      if (!isNaN(Number(mat.id))) {
        const blob = await studyMaterialService.downloadMaterial(Number(mat.id));
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = mat.title.endsWith('.pdf') ? mat.title : `${mat.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        if (mat.fileUrl.startsWith('data:application/pdf')) {
          const link = document.createElement('a');
          link.href = mat.fileUrl;
          link.download = `${mat.title.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      addDownload(mat);
      setDownloads(getDownloads());
      addToast('Download complete!');
    } catch (err) {
      console.error('Error re-downloading:', err);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const totalSizeDownloaded = (downloads.reduce((acc, curr) => {
    const size = parseFloat(curr.fileSize) || 0;
    return acc + size;
  }, 0)).toFixed(1);

  return (
    <div className="space-y-10">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border bg-teal-50 border-teal-205 text-teal-900 animate-slide-in"
          >
            <Check className="w-5 h-5 text-primary-600 bg-primary-100 rounded-full p-1" />
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header and Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link 
            href="/study-material"
            className="inline-flex items-center gap-1.5 text-xs font-black text-primary-600 hover:text-primary-750 uppercase tracking-widest mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Downloads</h1>
          <p className="text-gray-500 font-medium">Access your previously downloaded educational material logs.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Downloaded Files</span>
            <p className="text-2xl font-black text-gray-900 mt-1">{downloads.length}</p>
          </div>
          <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-2xl text-teal-600">
            <Download className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Storage Saved</span>
            <p className="text-2xl font-black text-gray-900 mt-1">{totalSizeDownloaded} MB</p>
          </div>
          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Downloaded items list */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
        {downloads.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Download className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Your downloads history is empty</h3>
            <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">
              Any study material you download from the library will be listed here for quick retrieval.
            </p>
            <Link
              href="/study-material"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md shadow-primary-600/10"
            >
              Go to Library
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {downloads.map((item) => (
              <div 
                key={item.id}
                className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[9px] font-black uppercase tracking-wider">
                      {item.subject}
                    </span>
                    <h3 className="font-bold text-gray-950 text-sm">{item.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-bold">
                      <span>Type: {item.type}</span>
                      <span>•</span>
                      <span>Size: {item.fileSize}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.downloadedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center">
                  <button
                    onClick={(e) => handleReDownload(item.materialId, e)}
                    className="flex items-center gap-2 border border-primary-200 hover:bg-primary-50 text-primary-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="Download document again"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-Download
                  </button>
                  <button
                    onClick={(e) => handleRemoveLog(item.id, e)}
                    className="p-2.5 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

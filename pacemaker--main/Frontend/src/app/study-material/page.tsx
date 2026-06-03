'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Grid, List, BookOpen, Download, Eye, Star, Heart, Share2, 
  AlertTriangle, X, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Maximize2, 
  Printer, Check, Bookmark, BookmarkCheck, ArrowUpDown, Filter, ChevronLeft
} from 'lucide-react';
import { 
  getMaterials, addDownload, toggleFavorite, getFavorites, addReview, 
  reportMaterial, SUBJECTS, MaterialType, DifficultyLevel
} from '@/lib/studyMaterialStore';
import type { StudyMaterial } from '@/lib/studyMaterialStore';
import { studyMaterialService } from '@/services/studyMaterialService';
import Link from 'next/link';
import { StudyMaterialGridSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

const mapBackendMaterial = (bm: any): StudyMaterial => {
  return {
    id: String(bm.id),
    title: bm.title || bm.fileName || 'Untitled Study Material',
    subject: bm.subjectName || 'General',
    chapter: bm.chapterName || 'General',
    description: `High-yield clinical revision study material for ${bm.chapterName || 'General'} chapter in ${bm.subjectName || 'General'}.`,
    type: 'Notes',
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
    status: 'published',
    uploadedBy: 'Dr. Aman Gupta',
    uploadedAt: bm.uploadedAt || new Date().toISOString(),
    updatedAt: bm.uploadedAt || new Date().toISOString()
  };
};

export default function StudentStudyMaterialPagePage() {
  return (
    <ErrorBoundary>
      <StudentStudyMaterialPage />
    </ErrorBoundary>
  );
}

interface Toast {
  id: string;
  type: 'success' | 'info';
  message: string;
}

function StudentStudyMaterialPage() {
  // Store state
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'downloads' | 'newest' | 'oldest' | 'az'>('downloads');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Layout toggles
  const [viewMode, setViewMode] = useState<'grid' | 'accordion'>('grid');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Active item modals
  const [previewingMaterial, setPreviewingMaterial] = useState<StudyMaterial | null>(null);
  const [ratingMaterial, setRatingMaterial] = useState<StudyMaterial | null>(null);
  const [reportingMaterial, setReportingMaterial] = useState<StudyMaterial | null>(null);
  
  // Viewer controls
  const [viewerPage, setViewerPage] = useState(1);
  const [viewerZoom, setViewerZoom] = useState(100);
  const [viewerFullscreen, setViewerFullscreen] = useState(false);
  
  // Report Form state
  const [reportReason, setReportReason] = useState('Broken Link');
  const [reportDetails, setReportDetails] = useState('');
  
  // Rating state
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [givenRating, setGivenRating] = useState(5);
  
  // UI Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load items
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const rawMaterials = await studyMaterialService.getAllMaterials();
        const mapped = rawMaterials.map(mapBackendMaterial);
        const local = getMaterials();
        const combined = [...mapped, ...local.filter(lm => !mapped.some(rm => String(rm.id) === String(lm.id)))];
        setMaterials(combined);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setMaterials(getMaterials());
      }
    };

    loadMaterials();
    const favs = getFavorites().map(f => f.materialId);
    setFavorites(favs);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const addToast = (type: 'success' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Toggle Filters
  const handleSubjectFilter = (sub: string) => {
    setSelectedSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const handleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleDifficultyFilter = (diff: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isSaved = toggleFavorite(id);
    setFavorites(getFavorites().map(f => f.materialId));
    addToast('success', isSaved ? 'Saved to My Library' : 'Removed from My Library');
  };

  const handleDownload = async (material: StudyMaterial, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    try {
      addToast('info', `Downloading ${material.title}...`);
      
      // If it is a backend material (numeric ID), fetch real blob
      if (!isNaN(Number(material.id))) {
        const blob = await studyMaterialService.downloadMaterial(Number(material.id));
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = material.title.endsWith('.pdf') ? material.title : `${material.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback for seed materials in localStorage
        if (material.fileUrl.startsWith('data:application/pdf')) {
          const link = document.createElement('a');
          link.href = material.fileUrl;
          link.download = `${material.title.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          addToast('success', `Downloading ${material.title}...`);
        }
      }
      
      addDownload(material);
      // Reload combined list
      const rawMaterials = await studyMaterialService.getAllMaterials();
      const mapped = rawMaterials.map(mapBackendMaterial);
      const local = getMaterials();
      const combined = [...mapped, ...local.filter(lm => !mapped.some(rm => String(rm.id) === String(lm.id)))];
      setMaterials(combined);
      
      addToast('success', 'Download complete!');
    } catch (err) {
      console.error('Error downloading material:', err);
      addToast('success', 'Simulated download complete!');
    }
    
    // Prompt for rating
    setRatingMaterial(material);
  };

  const handleShare = (material: StudyMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const mockUrl = `${window.location.origin}/study-material?id=${material.id}`;
    navigator.clipboard.writeText(mockUrl);
    addToast('info', 'Material link copied to clipboard!');
  };

  const submitReview = async () => {
    if (!ratingMaterial) return;
    addReview(ratingMaterial.id, givenRating);
    
    try {
      const rawMaterials = await studyMaterialService.getAllMaterials();
      const mapped = rawMaterials.map(mapBackendMaterial);
      const local = getMaterials();
      const combined = [...mapped, ...local.filter(lm => !mapped.some(rm => String(rm.id) === String(lm.id)))];
      setMaterials(combined);
    } catch (err) {}
    
    addToast('success', `Thank you for rating this material ${givenRating} stars!`);
    setRatingMaterial(null);
    setGivenRating(5);
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingMaterial) return;
    
    const studentName = localStorage.getItem('currentUser') || 'Anonymous Student';
    reportMaterial(reportingMaterial.id, reportReason, reportDetails, studentName);
    
    addToast('success', 'Report submitted successfully. Our team will review this shortly.');
    setReportingMaterial(null);
    setReportDetails('');
  };

  // Filter & Sort Logic
  const filteredMaterials = materials.filter(m => {
    if (m.status !== 'published') return false;

    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(m.subject);
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(m.type);
    const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(m.difficulty);
    const matchesSaved = !showSavedOnly || favorites.includes(m.id);

    return matchesSearch && matchesSubject && matchesType && matchesDifficulty && matchesSaved;
  });

  // Sort
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'newest') return b.uploadedAt.localeCompare(a.uploadedAt);
    if (sortBy === 'oldest') return a.uploadedAt.localeCompare(b.uploadedAt);
    if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
    if (sortBy === 'az') return a.title.localeCompare(b.title);
    return 0;
  });

  // Accordion Grouping Structure: Subject > Chapter > Materials
  const accordionGroup: Record<string, Record<string, StudyMaterial[]>> = {};
  sortedMaterials.forEach(m => {
    if (!accordionGroup[m.subject]) {
      accordionGroup[m.subject] = {};
    }
    if (!accordionGroup[m.subject][m.chapter]) {
      accordionGroup[m.subject][m.chapter] = [];
    }
    accordionGroup[m.subject][m.chapter].push(m);
  });

  const toggleSubjectExpand = (sub: string) => {
    setExpandedSubjects(prev => ({ ...prev, [sub]: !prev[sub] }));
  };

  const toggleChapterExpand = (chapKey: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapKey]: !prev[chapKey] }));
  };

  const triggerPrint = (fileUrl: string) => {
    if (fileUrl.startsWith('data:application/pdf') || fileUrl.startsWith('blob:')) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fileUrl;
      document.body.appendChild(iframe);
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } else {
      window.print();
    }
  };

  // Get material type icon helper
  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'Notes': return '📄';
      case 'PPT': return '📊';
      case 'MCQ Bank': return '❓';
      case 'Previous Year Questions': return '📝';
      case 'Case Study': return '🩺';
      case 'Image Set': return '🖼️';
      case 'Video Summary': return '🎥';
      default: return '📄';
    }
  };

  // Simulated PDF pages content generator
  const getSimulatedPages = (material: StudyMaterial) => {
    const textData = [
      {
        title: "CLINICAL CASE OVERVIEW",
        subtitle: `Pathology & Symptomatology of ${material.chapter}`,
        content: `The patient presents with progressive symptoms directly correlating to dysregulation in the ${material.chapter}. Laboratory results show an elevation of inflammatory markers, secondary to ischemic changes. Immediate diagnostic algorithms indicate a high susceptibility to acute episodes if left untreated. Recommended pharmacotherapy includes receptor antagonists and structural supportive blockers.`
      },
      {
        title: "DIAGNOSTIC CRITERIA",
        subtitle: "NEET-PG high-yield review guidelines",
        content: "1. Primary Diagnostic Threshold: Electrocardiogram / Biochemical serum analysis.\n2. Morphological markers: Intracellular cellular edema, neutrophilic infiltration, cellular apoptosis, and focal necrosis.\n3. Differential Diagnoses: Non-specific reactive states, immunological hyper-reactivity, and toxic stress conditions.\n4. Grade of Severity: Scale of Class I to Class IV."
      },
      {
        title: "PHARMACOTHERAPEUTIC MANAGEMENT",
        subtitle: "Key medical management options",
        content: "First-line agents: Intravenous administration of stabilization compounds, combined with target inhibitors. Maintenance dose should be adjusted to clear systemic metabolic waste. Contraindications: Active liver dysfunction, renal insufficiency (eGFR < 30 ml/min), and hypersensitivity to synthetic blockers."
      },
      {
        title: "CLINICAL PEARLS & BULLET POINTS",
        subtitle: "Important facts to memorize",
        content: "• ALWAYS check serum potassium levels before administering receptor blockers.\n• The rate-limiting step of this metabolic pathway is regulated by allosteric feedback inhibition.\n• Microscopic biopsies reveal pathognomonic multinucleated giant cells.\n• High-dose Magnesium Sulfate is the drug of choice for convulsing mothers."
      },
      {
        title: "MOCK REVISION MULTIPLE CHOICE QUESTIONS",
        subtitle: "Test your understanding",
        content: "Q1. Which of the following is the most appropriate first-line diagnostic investigation?\nA) Biopsy B) Contrast Computed Tomography C) Biochemical Serum Analysis D) Magnetic Resonance Imaging\n\nCorrect Answer: C\nExplanation: Serum levels show immediate deviations, offering the highest sensitivity and specificity for acute triage."
      }
    ];

    return textData;
  };

  if (isLoading) {
    return (
      <div className="space-y-10">
        <StudyMaterialGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-teal-50/95 border-teal-200 text-teal-900' 
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <Check className="w-5 h-5 text-primary-600 bg-primary-100 rounded-full p-1" />
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Study Material Library</h1>
          <p className="text-gray-500 font-medium">Access top-tier medical notes, slide decks, MCQs, and case studies.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
            <button 
              onClick={() => { setShowSavedOnly(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!showSavedOnly ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              All Library
            </button>
            <button 
              onClick={() => { setShowSavedOnly(true); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${showSavedOnly ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" /> My Library ({favorites.length})
            </button>
          </div>

          <Link
            href="/study-material/downloads"
            className="flex items-center gap-2 border border-gray-200 hover:border-primary-500 bg-white hover:text-primary-600 px-4 py-3.5 rounded-2xl text-xs font-black shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-gray-400" /> My Downloads
          </Link>

          <div className="flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('accordion')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'accordion' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
              title="Subject Accordion View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:flex flex-col gap-6 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 border-gray-100">
            <span className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-500" /> Filters
            </span>
            <button 
              onClick={() => {
                setSelectedSubjects([]);
                setSelectedTypes([]);
                setSelectedDifficulties([]);
                setSearchQuery('');
              }}
              className="text-[10px] font-black text-gray-400 hover:text-primary-600 uppercase tracking-wider"
            >
              Reset All
            </button>
          </div>

          {/* Search bar inside sidebar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 text-xs font-medium text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Sort selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 text-xs font-bold text-gray-700"
            >
              <option value="downloads">🔥 Most Downloaded</option>
              <option value="newest">⏰ Newest First</option>
              <option value="oldest">⏳ Oldest First</option>
              <option value="az">🔤 Alphabetical A-Z</option>
            </select>
          </div>

          {/* Subjects checkbox list */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Medical Subjects</label>
            <div className="max-h-56 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {SUBJECTS.map((sub, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900">
                  <input 
                    type="checkbox"
                    checked={selectedSubjects.includes(sub)}
                    onChange={() => handleSubjectFilter(sub)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>{sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Material Type checkboxes */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Material Type</label>
            <div className="space-y-2">
              {['Notes', 'PPT', 'MCQ Bank', 'Previous Year Questions', 'Case Study', 'Image Set', 'Video Summary'].map((type, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900">
                  <input 
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeFilter(type)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>{getTypeIcon(type as MaterialType)} {type === 'Previous Year Questions' ? 'PYQ Bank' : type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Checkboxes */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Difficulty</label>
            <div className="space-y-2">
              {['Beginner', 'Intermediate', 'Advanced'].map((diff, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-600 hover:text-gray-900">
                  <input 
                    type="checkbox"
                    checked={selectedDifficulties.includes(diff)}
                    onChange={() => handleDifficultyFilter(diff)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>{diff}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Toggle & Search Bar */}
        <div className="lg:hidden flex gap-3 col-span-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 text-xs font-medium text-gray-900"
            />
          </div>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="px-4 bg-white border border-gray-200 hover:border-primary-500 rounded-xl flex items-center justify-center text-gray-600"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Library Body */}
        <div className="lg:col-span-3 space-y-6">
          
          {sortedMaterials.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-16 text-center shadow-sm">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No materials found</h3>
              <p className="text-gray-500 font-medium max-w-md mx-auto mb-6">We couldn't find any study materials fitting your query. Try adjusting your search keywords or checking some filters.</p>
              <button
                onClick={() => {
                  setSelectedSubjects([]);
                  setSelectedTypes([]);
                  setSelectedDifficulties([]);
                  setSearchQuery('');
                  setShowSavedOnly(false);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md shadow-primary-600/20"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            
            /* Grid layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {sortedMaterials.map(item => {
                const isSaved = favorites.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    className="bg-white border border-gray-200 hover:border-primary-200 shadow-sm hover:shadow-xl rounded-[2rem] overflow-hidden flex flex-col group transition-all"
                  >
                    {/* Thumbnail banner */}
                    <div className="aspect-video bg-gradient-to-br from-primary-500 to-teal-600 relative overflow-hidden flex items-center justify-center shrink-0">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <span className="text-4xl block">{getTypeIcon(item.type)}</span>
                          <span className="text-[10px] font-black text-white/95 uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {item.type}
                          </span>
                        </div>
                      )}
                      
                      {/* Subject/difficulty tags on cover */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-teal-900 bg-teal-100/90 backdrop-blur-sm rounded-lg shadow-sm border border-teal-200/20">
                          {item.subject}
                        </span>
                      </div>

                      {/* Favorite/Saved Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-sm transition-all border shadow-sm ${
                          isSaved 
                            ? 'bg-red-500 border-red-500 text-white' 
                            : 'bg-white/85 border-white/20 text-gray-500 hover:text-red-500 hover:bg-white'
                        }`}
                        title={isSaved ? 'Remove from My Library' : 'Save to My Library'}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Content body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="truncate max-w-[120px]">{item.chapter}</span>
                          <span className={`px-1.5 py-0.5 rounded border ${
                            item.difficulty === 'Advanced' ? 'bg-red-50 border-red-100 text-red-700' :
                            item.difficulty === 'Intermediate' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-green-50 border-green-100 text-green-700'
                          }`}>
                            {item.difficulty}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Rating stars & Stats */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-1.5">
                            <div className="flex text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <span className="text-xs font-black text-gray-900">{item.rating}</span>
                            <span className="text-[10px] text-gray-400">({item.ratingsCount || 10})</span>
                          </div>
                          
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {item.downloadCount.toLocaleString()} downloads
                          </span>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => {
                              setPreviewingMaterial(item);
                              setViewerPage(1);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 border border-primary-200 hover:bg-primary-50 text-primary-700 font-bold text-xs py-3 rounded-xl transition-all"
                          >
                            <Eye className="w-4 h-4" /> Preview
                          </button>
                          
                          {item.allowDownload ? (
                            <button
                              onClick={(e) => handleDownload(item, e)}
                              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all"
                              title="Download PDF File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="bg-gray-100 text-gray-400 font-bold text-xs py-3 px-4 rounded-xl border border-gray-200"
                              title="Download disabled by Instructor"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleShare(item, e)}
                            className="border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 p-3 rounded-xl transition-all"
                            title="Share link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => setReportingMaterial(item)}
                            className="border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 p-3 rounded-xl transition-all"
                            title="Report broken material"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* Accordion Tree View */
            <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm space-y-4 animate-fade-in">
              {Object.entries(accordionGroup).map(([subName, chapters]) => {
                const isSubExpanded = expandedSubjects[subName];
                return (
                  <div key={subName} className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm">
                    {/* Subject Level */}
                    <button
                      onClick={() => toggleSubjectExpand(subName)}
                      className="w-full flex items-center justify-between px-6 py-4.5 bg-gray-50/70 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-teal-600" />
                        <span className="font-black text-gray-900 text-sm tracking-tight">{subName}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 uppercase">
                          {Object.values(chapters).reduce((acc, curr) => acc + curr.length, 0)} items
                        </span>
                      </div>
                      {isSubExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>

                    {/* Chapters level */}
                    {isSubExpanded && (
                      <div className="divide-y divide-gray-100 bg-white">
                        {Object.entries(chapters).map(([chapName, items]) => {
                          const chapKey = `${subName}_${chapName}`;
                          const isChapExpanded = expandedChapters[chapKey];
                          return (
                            <div key={chapName} className="pl-6">
                              {/* Chapter header */}
                              <button
                                onClick={() => toggleChapterExpand(chapKey)}
                                className="w-full flex items-center justify-between py-4 pr-6 border-b border-gray-100/50 hover:text-primary-600 transition-colors text-left"
                              >
                                <span className="font-bold text-gray-700 text-xs">{chapName}</span>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <span className="text-[10px] font-bold">{items.length} files</span>
                                  {isChapExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </div>
                              </button>

                              {/* Material files list */}
                              {isChapExpanded && (
                                <div className="divide-y divide-gray-50 pr-6 pl-4 py-2">
                                  {items.map(item => {
                                    const isSaved = favorites.includes(item.id);
                                    return (
                                      <div key={item.id} className="py-3 flex items-center justify-between text-xs group hover:bg-gray-50/50 rounded-lg px-2 transition-all">
                                        <div className="flex items-center gap-3 w-1/2">
                                          <span className="text-lg shrink-0">{getTypeIcon(item.type)}</span>
                                          <div className="truncate">
                                            <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{item.fileSize} • {item.pageCount} pages • {item.difficulty}</p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-gray-500 font-bold">
                                          <span className="text-[10px] text-gray-400">{item.downloadCount} downloads</span>
                                          
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => {
                                                setPreviewingMaterial(item);
                                                setViewerPage(1);
                                              }}
                                              className="flex items-center gap-1 hover:text-primary-600 transition-all font-bold px-2 py-1 rounded bg-primary-50 border border-primary-100 text-[10px]"
                                            >
                                              <Eye className="w-3.5 h-3.5" /> Preview
                                            </button>
                                            
                                            {item.allowDownload && (
                                              <button
                                                onClick={() => handleDownload(item)}
                                                className="p-1 hover:text-primary-600 rounded hover:bg-gray-150 transition-colors"
                                                title="Download PDF"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                              </button>
                                            )}

                                            <button
                                              onClick={(e) => handleToggleFavorite(item.id, e)}
                                              className={`p-1 rounded hover:bg-gray-150 transition-colors ${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                              title={isSaved ? 'Remove from My Library' : 'Save to My Library'}
                                            >
                                              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Sidebar Filters Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-8 overflow-y-auto space-y-6 flex flex-col justify-between animate-slide-in-right">
            <div>
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 mb-6">
                <span className="font-black text-gray-900 text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-500" /> Filters
                </span>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sort selection */}
              <div className="space-y-2 mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 text-xs font-bold text-gray-700"
                >
                  <option value="downloads">🔥 Most Downloaded</option>
                  <option value="newest">⏰ Newest First</option>
                  <option value="oldest">⏳ Oldest First</option>
                  <option value="az">🔤 Alphabetical A-Z</option>
                </select>
              </div>

              {/* Subjects checkbox list */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Subjects</label>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {SUBJECTS.map((sub, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-600">
                      <input 
                        type="checkbox"
                        checked={selectedSubjects.includes(sub)}
                        onChange={() => handleSubjectFilter(sub)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span>{sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Material Type checkboxes */}
              <div className="space-y-3 mb-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Material Type</label>
                <div className="space-y-2">
                  {['Notes', 'PPT', 'MCQ Bank', 'Previous Year Questions', 'Case Study', 'Image Set', 'Video Summary'].map((type, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-600">
                      <input 
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeFilter(type)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span>{getTypeIcon(type as MaterialType)} {type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-primary-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* PDF PREVIEW INTERACTIVE MODAL */}
      {previewingMaterial && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md transition-all ${viewerFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
          <div className={`bg-white shadow-2xl flex flex-col overflow-hidden animate-scale-up ${viewerFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh] rounded-[2.5rem] border border-gray-200'}`}>
            
            {/* Header toolbar */}
            <div className="px-8 py-5 border-b border-gray-150 flex flex-col md:flex-row gap-4 md:items-center md:justify-between bg-gray-50 shrink-0">
              <div className="truncate">
                <h3 className="text-lg font-black text-gray-900 truncate max-w-md">{previewingMaterial.title}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{previewingMaterial.subject} • {previewingMaterial.chapter}</p>
              </div>

              {/* View options */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Page Navigation */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm text-xs font-bold">
                  <button
                    disabled={viewerPage <= 1}
                    onClick={() => setViewerPage(p => Math.max(1, p - 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-gray-700">
                    Page {viewerPage} of {previewingMaterial.freePreview ? Math.min(previewingMaterial.previewPages, previewingMaterial.pageCount) : previewingMaterial.pageCount}
                  </span>
                  <button
                    disabled={viewerPage >= (previewingMaterial.freePreview ? Math.min(previewingMaterial.previewPages, previewingMaterial.pageCount) : previewingMaterial.pageCount)}
                    onClick={() => setViewerPage(p => p + 1)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm text-xs font-bold">
                  <button
                    onClick={() => setViewerZoom(z => Math.max(50, z - 20))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-1 text-gray-750">{viewerZoom}%</span>
                  <button
                    onClick={() => setViewerZoom(z => Math.min(200, z + 20))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => triggerPrint(previewingMaterial.fileUrl)}
                    className="p-3 bg-white border border-gray-200 hover:border-gray-400 rounded-xl text-gray-500 hover:text-gray-800 transition-all shadow-sm"
                    title="Print Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setViewerFullscreen(!viewerFullscreen)}
                    className="p-3 bg-white border border-gray-200 hover:border-gray-400 rounded-xl text-gray-500 hover:text-gray-800 transition-all shadow-sm"
                    title={viewerFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  {previewingMaterial.allowDownload && (
                    <button
                      onClick={() => handleDownload(previewingMaterial)}
                      className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm shadow-primary-600/10"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  )}

                  <button
                    onClick={() => setPreviewingMaterial(null)}
                    className="p-3 bg-white hover:bg-red-50 border border-gray-200 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* Viewer Canvas Area */}
            <div className="flex-1 bg-gray-150 overflow-auto p-8 flex items-center justify-center custom-scrollbar">
              <div 
                className="bg-white shadow-xl rounded-2xl border border-gray-200 p-12 transition-all min-h-[60vh] max-w-[800px] w-full flex flex-col justify-between"
                style={{ 
                  transform: `scale(${viewerZoom / 100})`, 
                  transformOrigin: 'top center',
                  marginBottom: viewerZoom > 100 ? `${(viewerZoom - 100) * 0.5}vh` : '0px'
                }}
              >
                {/* Real loaded Base64 PDF using iframe */}
                {previewingMaterial.fileUrl.startsWith('data:application/pdf') || previewingMaterial.fileUrl.startsWith('blob:') ? (
                  <iframe 
                    src={`${previewingMaterial.fileUrl}#page=${viewerPage}`} 
                    className="w-full h-[60vh] border-0"
                    title="PDF Document Iframe Viewer"
                  />
                ) : (
                  
                  /* High Fidelity Simulated Medical page design */
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Simulated Medical Header */}
                      <div className="border-b border-gray-200 pb-4 flex items-center justify-between text-xs text-gray-400">
                        <span className="font-black text-primary-600 uppercase tracking-widest">PaceMaker Study Ecosystem</span>
                        <span className="font-bold">Subject: {previewingMaterial.subject}</span>
                      </div>

                      {/* Content block */}
                      <div className="mt-8 space-y-4">
                        <span className="px-3 py-1 rounded bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-wider">
                          Section {viewerPage}
                        </span>
                        <h2 className="text-2xl font-black text-gray-900 mt-2">
                          {getSimulatedPages(previewingMaterial)[(viewerPage - 1) % 5].title}
                        </h2>
                        <h4 className="text-xs font-bold text-gray-450 italic">
                          {getSimulatedPages(previewingMaterial)[(viewerPage - 1) % 5].subtitle}
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed mt-6 whitespace-pre-line font-medium">
                          {getSimulatedPages(previewingMaterial)[(viewerPage - 1) % 5].content}
                        </p>
                      </div>

                      {/* Graphic overlay for visual excellence */}
                      <div className="mt-8 p-6 bg-teal-50/20 border border-teal-100 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-150 flex items-center justify-center shrink-0">
                          <span className="text-2xl">🧠</span>
                        </div>
                        <div className="text-xs">
                          <p className="font-black text-teal-950 uppercase tracking-wider mb-1">Instructor Review Notes</p>
                          <p className="text-teal-800 leading-relaxed font-bold">This topic is frequently tested in NEET-PG/INICET clinical sections. Revise the diagnostic criteria twice.</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer marker */}
                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-[10px] text-gray-400 font-bold shrink-0">
                      <span>© 2026 PaceMaker Platform. Compiled by {previewingMaterial.uploadedBy || 'Medical Faculty'}.</span>
                      <span>Page {viewerPage} of {previewingMaterial.pageCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Free preview warning */}
            {previewingMaterial.freePreview && (
              <div className="px-8 py-3.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold shrink-0">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Free Preview limited to first {previewingMaterial.previewPages} pages.
                </span>
                <span className="text-[10px] font-black uppercase text-amber-600">Unlock the full platform for unlimited pages</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING MODAL (Prompts after download) */}
      {ratingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] border shadow-2xl w-full max-w-md p-8 text-center space-y-6 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl mx-auto">
              🏆
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Rate this Material</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                You've successfully downloaded <strong>{ratingMaterial.title}</strong>. Please rate this file to help fellow aspirants in their preparation.
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex justify-center gap-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setGivenRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating !== null ? hoverRating : givenRating) 
                        ? 'text-amber-400 fill-current' 
                        : 'text-gray-200'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRatingMaterial(null)}
                className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
              >
                Skip Rating
              </button>
              <button
                type="button"
                onClick={submitReview}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-primary-600/20"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT MODAL */}
      {reportingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] border shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Report Study Material</h3>
              <button 
                onClick={() => setReportingMaterial(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitReport} className="p-8 space-y-5">
              <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                Help us keep the ecosystem pristine. If this file <strong>{reportingMaterial.title}</strong> has issues, let us know the reason.
              </p>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Reason for Report</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 font-bold"
                >
                  <option value="Broken Link">Broken PDF / Doesn't Load</option>
                  <option value="Incorrect Information">Incorrect Clinical Data</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Other">Other / Request Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Details / Specific Pages</label>
                <textarea 
                  rows={4}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="E.g., page 3 diagram is missing, spelling errors, or PDF fails to download..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-primary-500 text-gray-900 font-medium text-xs placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReportingMaterial(null)}
                  className="flex-1 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-750 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-650/10"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

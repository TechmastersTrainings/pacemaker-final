// ============================================================
// Study Material Store — Shared localStorage & mock database
// ============================================================

export type MaterialType = 'Notes' | 'PPT' | 'MCQ Bank' | 'Previous Year Questions' | 'Case Study' | 'Image Set' | 'Video Summary';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PublishStatus = 'draft' | 'published';

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  description: string;
  type: MaterialType;
  difficulty: DifficultyLevel;
  tags: string[];
  fileUrl: string; // URL or Base64 data URL
  fileSize: string;
  pageCount: number;
  thumbnail: string; // Optional image URL or Base64
  downloadCount: number;
  rating: number;
  ratingsCount?: number; // Keep track of how many students rated
  allowDownload: boolean;
  freePreview: boolean;
  previewPages: number;
  displayOrder: number;
  status: PublishStatus;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface DownloadLog {
  id: string;
  materialId: string;
  title: string;
  subject: string;
  type: MaterialType;
  fileSize: string;
  downloadedAt: string;
}

export interface FavoriteLog {
  materialId: string;
  savedAt: string;
}

export interface ReportLog {
  id: string;
  materialId: string;
  materialTitle: string;
  reason: string;
  details: string;
  reportedBy: string;
  reportedAt: string;
}

export const MATERIALS_KEY = 'lms_study_materials_v1';
export const DOWNLOADS_KEY = 'lms_downloads_v1';
export const FAVORITES_KEY = 'lms_favorites_v1';
export const REPORTS_KEY = 'lms_reports_v1';

// Seed mock data
const SEED_MATERIALS: StudyMaterial[] = [
  {
    id: "mat_001",
    title: "Cardiology Complete High-Yield Notes",
    subject: "Medicine",
    chapter: "Cardiovascular System",
    description: "Extremely detailed cardiology notes summarizing heart sounds, ECG patterns, valvular lesions, and clinical algorithms for NEET-PG and FMGE revision. Includes diagnostic flowcharts.",
    type: "Notes",
    difficulty: "Advanced",
    tags: ["NEET-PG", "Cardiology", "ECG", "Revision"],
    fileUrl: "/materials/cardiology-notes.pdf",
    fileSize: "4.2 MB",
    pageCount: 45,
    thumbnail: "",
    downloadCount: 1234,
    rating: 4.8,
    ratingsCount: 89,
    allowDownload: true,
    freePreview: true,
    previewPages: 5,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Sarah",
    uploadedAt: "2026-01-15",
    updatedAt: "2026-05-20"
  },
  {
    id: "mat_002",
    title: "Pathology of Acute Inflammation PPT",
    subject: "Pathology",
    chapter: "General Pathology",
    description: "Comprehensive lecture slides covering hemodynamic changes, cellular events, chemical mediators, and morphological patterns of acute inflammation. Features high-res biopsy microphotographs.",
    type: "PPT",
    difficulty: "Beginner",
    tags: ["General Pathology", "Inflammation", "Microbiology", "Slides"],
    fileUrl: "/materials/acute-inflammation.pdf",
    fileSize: "8.5 MB",
    pageCount: 32,
    thumbnail: "",
    downloadCount: 789,
    rating: 4.5,
    ratingsCount: 42,
    allowDownload: true,
    freePreview: true,
    previewPages: 8,
    displayOrder: 2,
    status: "published",
    uploadedBy: "Dr. Aditya Sen",
    uploadedAt: "2026-02-10",
    updatedAt: "2026-02-10"
  },
  {
    id: "mat_003",
    title: "Autonomic Nervous System MCQ Bank",
    subject: "Pharmacology",
    chapter: "ANS Pharmacology",
    description: "A curated bank of 100 clinical-scenario based questions focusing on sympathomimetics, parasympatholytics, and receptor dynamics. Key explanations provided for each response option.",
    type: "MCQ Bank",
    difficulty: "Intermediate",
    tags: ["Pharmacology", "ANS", "Q-Bank", "NEET-PG"],
    fileUrl: "/materials/ans-mcq.pdf",
    fileSize: "2.1 MB",
    pageCount: 50,
    thumbnail: "",
    downloadCount: 2314,
    rating: 4.9,
    ratingsCount: 145,
    allowDownload: true,
    freePreview: true,
    previewPages: 10,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Rajesh Varma",
    uploadedAt: "2026-03-01",
    updatedAt: "2026-04-12"
  },
  {
    id: "mat_004",
    title: "Anatomy of the Mediastinum & Heart",
    subject: "Anatomy",
    chapter: "Thorax Anatomy",
    description: "Highly illustrated guide containing cross-sectional layouts, nerve relationships, lymphatic drainage, and coronary vascular branching patterns. Excellent for first-year MBBS and FMGE aspirants.",
    type: "Notes",
    difficulty: "Intermediate",
    tags: ["Anatomy", "Thorax", "Heart", "First-Year"],
    fileUrl: "/materials/mediastinum-heart.pdf",
    fileSize: "6.1 MB",
    pageCount: 28,
    thumbnail: "",
    downloadCount: 1540,
    rating: 4.7,
    ratingsCount: 74,
    allowDownload: true,
    freePreview: true,
    previewPages: 5,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Meenakshi",
    uploadedAt: "2026-03-15",
    updatedAt: "2026-03-15"
  },
  {
    id: "mat_005",
    title: "Pediatrics: Congenital Heart Diseases Case Study",
    subject: "Pediatrics",
    chapter: "Cardiology",
    description: "Interactive clinical cases detailing Tetralogy of Fallot, VSD, ASD, and transposition of great arteries. Includes cyanotic vs acyanotic shunts and bedside murmur analysis.",
    type: "Case Study",
    difficulty: "Advanced",
    tags: ["Pediatrics", "CHD", "Murmurs", "Clinical-Cases"],
    fileUrl: "/materials/congenital-heart-disease.pdf",
    fileSize: "3.7 MB",
    pageCount: 18,
    thumbnail: "",
    downloadCount: 920,
    rating: 4.6,
    ratingsCount: 38,
    allowDownload: true,
    freePreview: true,
    previewPages: 4,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Sarah",
    uploadedAt: "2026-04-05",
    updatedAt: "2026-04-05"
  },
  {
    id: "mat_006",
    title: "Ob-Gyn: Preeclampsia & Eclampsia Management Guide",
    subject: "Gynecology",
    chapter: "Obstetrics",
    description: "Comprehensive review of hypertensive disorders of pregnancy, including diagnostic thresholds, Magnesium Sulfate protocols, dosage calculations, and indications for delivery.",
    type: "Notes",
    difficulty: "Advanced",
    tags: ["Obstetrics", "Preeclampsia", "Magnesium-Sulfate", "High-Yield"],
    fileUrl: "/materials/preeclampsia-guide.pdf",
    fileSize: "2.8 MB",
    pageCount: 15,
    thumbnail: "",
    downloadCount: 1105,
    rating: 4.8,
    ratingsCount: 52,
    allowDownload: true,
    freePreview: true,
    previewPages: 5,
    displayOrder: 3,
    status: "published",
    uploadedBy: "Dr. Nandini Roy",
    uploadedAt: "2026-04-20",
    updatedAt: "2026-05-18"
  },
  {
    id: "mat_007",
    title: "Microbiology: Gram-Positive Cocci Identification",
    subject: "Microbiology",
    chapter: "Bacteriology",
    description: "Starch-clear laboratory algorithm flowcharts for identifying Staphylococcus, Streptococcus, and Enterococcus species. Details catalase, coagulase, and hemolysis properties.",
    type: "Image Set",
    difficulty: "Beginner",
    tags: ["Microbiology", "Staphylococcus", "Streptococcus", "Lab-Algorithm"],
    fileUrl: "/materials/gram-positive-cocci.pdf",
    fileSize: "5.4 MB",
    pageCount: 12,
    thumbnail: "",
    downloadCount: 642,
    rating: 4.4,
    ratingsCount: 29,
    allowDownload: true,
    freePreview: true,
    previewPages: 3,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Rajesh Varma",
    uploadedAt: "2026-05-02",
    updatedAt: "2026-05-02"
  },
  {
    id: "mat_008",
    title: "Biochemistry: Glycolysis & TCA Cycle Regulatory Steps",
    subject: "Biochemistry",
    chapter: "Metabolism",
    description: "Revision sheet detailing enzyme inhibitors, rate-limiting steps, and ATP calculation profiles for glucose breakdown. Includes clinical integration of metabolic disorders.",
    type: "Notes",
    difficulty: "Intermediate",
    tags: ["Biochemistry", "Metabolism", "Enzymes", "Revision-Cheat-Sheet"],
    fileUrl: "/materials/glycolysis-tca.pdf",
    fileSize: "1.9 MB",
    pageCount: 8,
    thumbnail: "",
    downloadCount: 1890,
    rating: 4.9,
    ratingsCount: 97,
    allowDownload: true,
    freePreview: true,
    previewPages: 4,
    displayOrder: 1,
    status: "published",
    uploadedBy: "Dr. Meenakshi",
    uploadedAt: "2026-05-10",
    updatedAt: "2026-05-10"
  }
];

export const SUBJECTS = [
  "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", 
  "Microbiology", "Medicine", "Surgery", "Pediatrics", "Gynecology", 
  "ENT", "Ophthalmology", "Orthopedics"
];

// Helper to get common chapters by subject (for auto-populating)
export const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  "Anatomy": ["Thorax Anatomy", "Abdomen & Pelvis", "Upper Limb", "Lower Limb", "Head & Neck", "Neuroanatomy", "Osteology & Embryology"],
  "Physiology": ["General Physiology", "Nerve-Muscle Physiology", "Cardiovascular System", "Respiratory System", "Renal & Acid-Base", "Gastrointestinal Tract", "Endocrinology & Reproduction", "Central Nervous System"],
  "Biochemistry": ["Metabolism", "Molecular Biology", "Enzymes & Bioenergetics", "Proteins & Lipids", "Vitamins & Minerals", "Clinical Biochemistry"],
  "Pathology": ["General Pathology", "Hematology & Lymphatics", "Cardiovascular Pathology", "Respiratory Pathology", "Renal Pathology", "Gastrointestinal Pathology", "Endocrine & Systemic Pathology"],
  "Pharmacology": ["General Pharmacology", "ANS Pharmacology", "CNS Pharmacology", "Cardiovascular & Renal", "Endocrine Pharmacology", "Chemotherapy & Antimicrobials", "Autacoids & Respiratory"],
  "Microbiology": ["General Bacteriology", "Systemic Bacteriology", "Virology", "Mycology", "Parasitology", "Immunology", "Clinical Microbiology"],
  "Medicine": ["Cardiovascular System", "Pulmonology", "Gastroenterology", "Nephrology", "Endocrinology", "Neurology", "Infectious Diseases", "Rheumatology & Immunology"],
  "Surgery": ["General Surgery", "Trauma & Critical Care", "Gastrointestinal Surgery", "Urosurgery", "Neurosurgery", "Cardiothoracic Surgery", "Endocrine & Breast Surgery"],
  "Pediatrics": ["Growth & Development", "Neonatology", "Pediatric Infectious Diseases", "Cardiology", "Neurology", "Pediatric Emergencies"],
  "Gynecology": ["Obstetrics", "General Gynecology", "Gynecological Oncology", "Infertility & Reproductive Medicine", "Contraception"],
  "ENT": ["Otology", "Rhinology", "Laryngology", "Head & Neck Surgery"],
  "Ophthalmology": ["Refractive Errors", "Cornea & Conjunctiva", "Lens & Cataract", "Glaucoma", "Retina & Uvea", "Neuro-ophthalmology"],
  "Orthopedics": ["Fractures & Dislocation", "Metabolic Bone Diseases", "Bone Tumors", "Spinal Disorders", "Joint Reconstruction & Sports Medicine"]
};

export function getMaterials(): StudyMaterial[] {
  if (typeof window === 'undefined') return SEED_MATERIALS;
  try {
    const data = localStorage.getItem(MATERIALS_KEY);
    if (!data) {
      localStorage.setItem(MATERIALS_KEY, JSON.stringify(SEED_MATERIALS));
      return SEED_MATERIALS;
    }
    return JSON.parse(data);
  } catch {
    return SEED_MATERIALS;
  }
}

export function saveMaterials(materials: StudyMaterial[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
}

export function upsertMaterial(material: StudyMaterial): void {
  const materials = getMaterials();
  const idx = materials.findIndex(m => m.id === material.id);
  if (idx >= 0) {
    materials[idx] = material;
  } else {
    materials.unshift(material); // Add to beginning of list
  }
  saveMaterials(materials);
}

export function deleteMaterial(id: string): void {
  const materials = getMaterials();
  const filtered = materials.filter(m => m.id !== id);
  saveMaterials(filtered);
}

// Downloads Log Actions
export function getDownloads(): DownloadLog[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addDownload(material: StudyMaterial): void {
  if (typeof window === 'undefined') return;
  const downloads = getDownloads();
  
  // Record new download
  const newLog: DownloadLog = {
    id: 'dl_' + Math.random().toString(36).slice(2, 9),
    materialId: material.id,
    title: material.title,
    subject: material.subject,
    type: material.type,
    fileSize: material.fileSize,
    downloadedAt: new Date().toISOString()
  };
  
  downloads.unshift(newLog);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));

  // Increment download count in material
  const materials = getMaterials();
  const idx = materials.findIndex(m => m.id === material.id);
  if (idx >= 0) {
    materials[idx].downloadCount += 1;
    saveMaterials(materials);
  }
}

export function removeDownload(downloadId: string): void {
  if (typeof window === 'undefined') return;
  const downloads = getDownloads();
  const filtered = downloads.filter(dl => dl.id !== downloadId);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(filtered));
}

// Favorites Actions
export function getFavorites(): FavoriteLog[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavorite(materialId: string): boolean {
  if (typeof window === 'undefined') return false;
  const favorites = getFavorites();
  const idx = favorites.findIndex(fav => fav.materialId === materialId);
  let isSaved = false;

  if (idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push({
      materialId,
      savedAt: new Date().toISOString()
    });
    isSaved = true;
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return isSaved;
}

// Rating Actions
export function addReview(materialId: string, stars: number): void {
  const materials = getMaterials();
  const idx = materials.findIndex(m => m.id === materialId);
  if (idx >= 0) {
    const mat = materials[idx];
    const currentCount = mat.ratingsCount || 0;
    const currentRating = mat.rating || 0;
    
    // Calculate new average
    const totalScore = (currentRating * currentCount) + stars;
    const newCount = currentCount + 1;
    const newRating = Number((totalScore / newCount).toFixed(1));

    materials[idx].rating = newRating;
    materials[idx].ratingsCount = newCount;
    saveMaterials(materials);
  }
}

// Report Actions
export function getReports(): ReportLog[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function reportMaterial(materialId: string, reason: string, details: string, reportedBy: string): void {
  if (typeof window === 'undefined') return;
  const reports = getReports();
  const materials = getMaterials();
  const material = materials.find(m => m.id === materialId);
  
  const newReport: ReportLog = {
    id: 'rep_' + Math.random().toString(36).slice(2, 9),
    materialId,
    materialTitle: material ? material.title : 'Unknown Title',
    reason,
    details,
    reportedBy,
    reportedAt: new Date().toISOString()
  };

  reports.unshift(newReport);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// Generate new ID helper
export function generateMaterialId(): string {
  return "mat_" + Math.random().toString(36).substring(2, 10);
}

// ============================================================
// Leaderboard Store — Shared localStorage helpers for PaceMaker Leaderboard
// ============================================================

export type BadgeType = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

export type StudentRankItem = {
  userId: string;
  name: string;
  avatar: string;
  totalTests: number;
  averageScore: number; // percentage (0 - 100)
  totalMarks: number;
  accuracy: number; // percentage (0 - 100)
  badges: string[]; // badge IDs
  scoresBySubject: Record<string, { totalTests: number; averageScore: number; accuracy: number }>;
  weeklyTests: number;
  weeklyAverageScore: number;
  weeklyAccuracy: number;
  monthlyTests: number;
  monthlyAverageScore: number;
  monthlyAccuracy: number;
  streakWeeks: number;
  hasPerfectScore: boolean;
};

export type LeaderboardSettings = {
  minTestsRequired: number;
  resetDay: 'Monday' | 'Sunday';
  excludedExams: string[]; // Exam IDs
  excludedStudents: string[]; // Student names or IDs
};

export type CongratsMessage = {
  id: string;
  instructorName: string;
  studentId: string;
  studentName: string;
  message: string;
  date: string;
};

// Available Badges
export const AVAILABLE_BADGES: BadgeType[] = [
  { id: 'top3', name: 'Top 3 Overall', emoji: '🥇', description: 'Placed in the top 3 overall performance all-time' },
  { id: 'consistent', name: 'Consistent Performer', emoji: '🎯', description: 'Completed 10+ tests with an average score above 80%' },
  { id: 'improved', name: 'Most Improved', emoji: '📈', description: 'Achieved a 20%+ score increase in recent attempts' },
  { id: 'streak', name: 'Weekly Streak', emoji: '🔥', description: 'Active test taker for 3+ consecutive weeks' },
  { id: 'perfect', name: 'Perfect Scorer', emoji: '💯', description: 'Achieved a perfect 100% score on a published test' },
];

const STUDENTS_KEY = 'lms_leaderboard_students_v1';
const SETTINGS_KEY = 'lms_leaderboard_settings_v1';
const CONGRATS_KEY = 'lms_leaderboard_messages_v1';

const SUBJECTS = [
  'Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 
  'Pharmacology', 'Microbiology', 'Forensic Medicine', 
  'Social & Preventive Medicine', 'Cardiology'
];

// Initial mock generator helper
const generateMockStudents = (currentUser: string): StudentRankItem[] => {
  const firstNames = [
    'Ramesh', 'Priya', 'Anjali', 'Rohan', 'Amit', 'Sanjana', 'Vikram', 
    'Neha', 'Sanjay', 'Meera', 'Karan', 'Sneha', 'Abhishek', 'Divya', 
    'Rahul', 'Kavita', 'Aditya', 'Aarushi', 'Vivek', 'Swati', 'Manish',
    'Nisha', 'Vijay', 'Pooja', 'Alok', 'Deepa', 'Harish', 'Preeti'
  ];
  
  const lastNames = [
    'Verma', 'Sharma', 'Nair', 'Das', 'Patel', 'Goel', 'Malhotra', 
    'Joshi', 'Reddy', 'Choudhury', 'Kapoor', 'Gupta', 'Sen', 'Rao', 
    'Mehta', 'Singh', 'Dubey', 'Saxena', 'Pandey', 'Mishra', 'Bose'
  ];

  const students: StudentRankItem[] = [];

  // 1. Generate 25 random students
  for (let i = 0; i < 25; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `Dr. ${fn} ${ln}`;
    const userId = `stud_${1000 + i}`;
    
    students.push(createMockStudentObject(userId, fullName));
  }

  // 2. Add current user if not already in the list
  const currentUserName = currentUser || 'Student';
  if (!students.some(s => s.name.toLowerCase() === currentUserName.toLowerCase())) {
    students.push(createMockStudentObject('current_student_user', currentUserName, true));
  }

  return calculateBadgesForStudents(students);
};

const createMockStudentObject = (userId: string, name: string, isCurrentUser = false): StudentRankItem => {
  // Randomize stats based on user type (higher stats for top mock scores, normal for current user)
  const isTopMock = !isCurrentUser && Math.random() > 0.7;
  const minAvg = isTopMock ? 85 : 55;
  const maxAvg = isTopMock ? 98 : 92;
  const averageScore = Math.floor(Math.random() * (maxAvg - minAvg) + minAvg);
  const accuracy = Math.floor(averageScore - (Math.random() * 5));
  
  const totalTests = isCurrentUser ? 4 : Math.floor(Math.random() * 20 + 3); // 3 to 23
  const totalMarks = totalTests * 100;
  
  const weeklyTests = Math.floor(Math.random() * 3 + (isTopMock ? 1 : 0));
  const weeklyAverageScore = weeklyTests > 0 ? Math.floor(Math.random() * 15 + averageScore - 5) : 0;
  const weeklyAccuracy = weeklyTests > 0 ? Math.floor(weeklyAverageScore - (Math.random() * 4)) : 0;

  const monthlyTests = Math.floor(Math.random() * 8 + weeklyTests);
  const monthlyAverageScore = monthlyTests > 0 ? Math.floor(Math.random() * 10 + averageScore - 3) : 0;
  const monthlyAccuracy = monthlyTests > 0 ? Math.floor(monthlyAverageScore - (Math.random() * 3)) : 0;

  const streakWeeks = Math.floor(Math.random() * 5 + (isTopMock ? 3 : 0));
  const hasPerfectScore = Math.random() > 0.75 || isTopMock && Math.random() > 0.4;

  // Build subject-wise scores
  const scoresBySubject: Record<string, { totalTests: number; averageScore: number; accuracy: number }> = {};
  SUBJECTS.forEach(sub => {
    const subTests = Math.floor(Math.random() * 3 + 1);
    const subAvg = Math.floor(Math.random() * (maxAvg - minAvg + 10) + minAvg - 5);
    scoresBySubject[sub] = {
      totalTests: subTests,
      averageScore: Math.min(100, Math.max(0, subAvg)),
      accuracy: Math.min(100, Math.max(0, subAvg - Math.floor(Math.random() * 5)))
    };
  });

  return {
    userId,
    name,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
    totalTests,
    averageScore,
    totalMarks,
    accuracy: Math.min(100, Math.max(0, accuracy)),
    badges: [],
    scoresBySubject,
    weeklyTests,
    weeklyAverageScore: Math.min(100, weeklyAverageScore),
    weeklyAccuracy: Math.min(100, weeklyAccuracy),
    monthlyTests,
    monthlyAverageScore: Math.min(100, monthlyAverageScore),
    monthlyAccuracy: Math.min(100, monthlyAccuracy),
    streakWeeks,
    hasPerfectScore
  };
};

const calculateBadgesForStudents = (students: StudentRankItem[]): StudentRankItem[] => {
  // Sort overall All Time to find top 3
  const sorted = [...students].sort((a, b) => b.averageScore - a.averageScore);
  
  return students.map(s => {
    const badges: string[] = [];
    
    // Top 3 Overall
    const rankIdx = sorted.findIndex(item => item.userId === s.userId);
    if (rankIdx >= 0 && rankIdx < 3) {
      badges.push('top3');
    }
    
    // Consistent Performer (10+ tests average > 80%)
    if (s.totalTests >= 10 && s.averageScore >= 80) {
      badges.push('consistent');
    }
    
    // Streak (3+ weeks)
    if (s.streakWeeks >= 3) {
      badges.push('streak');
    }
    
    // Perfect Scorer
    if (s.hasPerfectScore) {
      badges.push('perfect');
    }
    
    // Most Improved (Random for mock, but lets assign to some)
    if (s.totalTests > 8 && (parseInt(s.userId.replace(/\D/g, '')) || 0) % 3 === 0) {
      badges.push('improved');
    }

    return { ...s, badges };
  });
};

export const getLeaderboardSettings = (): LeaderboardSettings => {
  if (typeof window === 'undefined') {
    return { minTestsRequired: 5, resetDay: 'Monday', excludedExams: [], excludedStudents: [] };
  }
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { minTestsRequired: 5, resetDay: 'Monday', excludedExams: [], excludedStudents: [] };
};

export const saveLeaderboardSettings = (settings: LeaderboardSettings) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getCongratsMessages = (): CongratsMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CONGRATS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const addCongratsMessage = (message: CongratsMessage) => {
  if (typeof window === 'undefined') return;
  const current = getCongratsMessages();
  current.unshift(message);
  localStorage.setItem(CONGRATS_KEY, JSON.stringify(current));
};

export const getLeaderboardStudents = (): StudentRankItem[] => {
  if (typeof window === 'undefined') return [];
  const currentUser = localStorage.getItem('currentUser') || 'Student';
  try {
    const saved = localStorage.getItem(STUDENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.length > 0) {
        // Ensure current user is in the list
        if (!parsed.some((s: any) => s.name.toLowerCase() === currentUser.toLowerCase())) {
          const freshList = [...parsed, createMockStudentObject('current_student_user', currentUser, true)];
          const finalWithBadges = calculateBadgesForStudents(freshList);
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(finalWithBadges));
          return finalWithBadges;
        }
        return parsed;
      }
    }
  } catch {}

  // Generate new mock list
  const mockList = generateMockStudents(currentUser);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(mockList));
  return mockList;
};

export const saveLeaderboardStudents = (students: StudentRankItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

// Recalculates leaderboard and syncs current student stats from exam attempts in local storage
export const recalculateLeaderboard = () => {
  if (typeof window === 'undefined') return;
  const students = getLeaderboardStudents();
  const settings = getLeaderboardSettings();
  const currentUser = localStorage.getItem('currentUser') || 'Student';
  
  // Try to load attempts from localStorage to sync current student score
  const attemptsKey = 'lms_exam_attempts_v1';
  let userTests = 0;
  let userTotalMarks = 0;
  let userAverageScore = 0;
  let userAccuracy = 0;
  let userHasPerfectScore = false;
  
  try {
    const attempts = JSON.parse(localStorage.getItem(attemptsKey) || '{}');
    const attemptsArray = Object.values(attempts) as any[];
    
    // Filter attempts by excluded exams
    const validAttempts = attemptsArray.filter(att => !settings.excludedExams.includes(att.examId));
    userTests = validAttempts.length;
    
    if (userTests > 0) {
      const totalScore = validAttempts.reduce((sum, att) => sum + (att.score || 0), 0);
      userAverageScore = Math.round(totalScore / userTests);
      userAccuracy = Math.round(userAverageScore - 2); // Mock accuracy offset
      userHasPerfectScore = validAttempts.some(att => att.score === 100);
      userTotalMarks = userTests * 100;
    }
  } catch (e) {
    console.error("Failed to parse attempts in leaderboard sync", e);
  }

  // Update current user stats in the list
  const nextStudents = students.map(s => {
    if (s.name.toLowerCase() === currentUser.toLowerCase()) {
      // If student has taken attempts, merge them. Otherwise keep their current mock stats
      return {
        ...s,
        totalTests: userTests > 0 ? userTests : s.totalTests,
        averageScore: userTests > 0 ? userAverageScore : s.averageScore,
        totalMarks: userTests > 0 ? userTotalMarks : s.totalMarks,
        accuracy: userTests > 0 ? userAccuracy : s.accuracy,
        hasPerfectScore: userTests > 0 ? userHasPerfectScore : s.hasPerfectScore
      };
    }
    return s;
  });

  // Re-calculate badges
  const calculated = calculateBadgesForStudents(nextStudents);
  saveLeaderboardStudents(calculated);
};

// Client-side CSV Exporter Utility
export const exportToCSV = (headers: string[], rows: any[][], filename: string) => {
  const content = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

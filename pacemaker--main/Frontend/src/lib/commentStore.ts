'use client';

export type Reply = {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: string[]; // array of userIds
  isInstructor: boolean;
  isVerified?: boolean;
  createdAt: string;
};

export type Comment = {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  likes: string[]; // array of userIds
  replies: Reply[];
  isPinned: boolean;
  isAnswered: boolean;
  isInstructor: boolean;
  isVerified?: boolean;
  isReported: boolean;
  reportReason?: string;
  reportCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const COMMENTS_KEY = 'lms_comments_v1';

export function getComments(videoId: string): Comment[] {
  if (typeof window === 'undefined') return [];
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
    return all.filter((c: Comment) => c.videoId === videoId);
  } catch { return []; }
}

export function getAllComments(): Comment[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
  } catch { return []; }
}

export function saveComments(comments: Comment[]) {
  const all = getAllComments();
  // Update or append
  const otherVideosComments = all.filter(c => !comments.find(nc => nc.id === c.id) && c.videoId !== (comments[0]?.videoId));
  localStorage.setItem(COMMENTS_KEY, JSON.stringify([...otherVideosComments, ...comments]));
}

// Global update helper
export function updateAllComments(all: Comment[]) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

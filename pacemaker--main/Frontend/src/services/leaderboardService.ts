import apiClient from '@/lib/apiClient';

export interface LeaderboardEntry {
  userId: number;
  totalScore: number;
  name?: string;
  avatar?: string;
}

export interface LeaderboardSettings {
  minTestsRequired: number;
  resetDay: 'Monday' | 'Sunday';
  excludedExams: string[];
  excludedStudents: string[];
}

export const AVAILABLE_BADGES = [
  { id: 'top3', name: 'Top 3 Overall', emoji: '🥇', description: 'Placed in the top 3 overall performance all-time' },
  { id: 'consistent', name: 'Consistent Performer', emoji: '🎯', description: 'Completed 10+ tests with an average score above 80%' },
  { id: 'improved', name: 'Most Improved', emoji: '📈', description: 'Achieved a 20%+ score increase in recent attempts' },
  { id: 'streak', name: 'Weekly Streak', emoji: '🔥', description: 'Active test taker for 3+ consecutive weeks' },
  { id: 'perfect', name: 'Perfect Scorer', emoji: '💯', description: 'Achieved a perfect 100% score on a published test' },
];

export const leaderboardService = {
  async getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data } = await apiClient.get<LeaderboardEntry[]>('/leaderboard/weekly');
    return data;
  },

  async getMonthlyLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data } = await apiClient.get<LeaderboardEntry[]>('/leaderboard/monthly');
    return data;
  }
};

// Client-side CSV Exporter Utility (kept from original store)
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

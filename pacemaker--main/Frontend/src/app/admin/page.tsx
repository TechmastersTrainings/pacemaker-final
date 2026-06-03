'use client';
import { useState, useEffect } from 'react';
import { Users, Video, Activity, TrendingUp } from 'lucide-react';

import { DashboardSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AdminDashboardPagePage() {
  return (
    <ErrorBoundary>
      <AdminDashboardPage />
    </ErrorBoundary>
  );
}

function AdminDashboardPage() {
  const [videoCount, setVideoCount] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('lms_recent_videos');
    if (saved) {
      try {
        const videos = JSON.parse(saved);
        setVideoCount(videos.length.toString());
      } catch (e) {
        console.error("Failed to parse saved videos", e);
      }
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { title: 'Total Subscribers', value: '0', increase: '0%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Active Videos', value: videoCount, increase: '0%', icon: Video, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { title: 'Daily Active Users', value: '0', increase: '0%', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Monthly Revenue', value: '$0', increase: '0%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Welcome back to the PaceMaker command center.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group bg-white">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-50 ${stat.bg} group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 uppercase tracking-tighter">
                {stat.increase}
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center bg-white">
          <div className="text-center space-y-4">
            <BarChartPlaceholder />
            <h3 className="text-xl font-bold text-gray-900">Analytics Engine Active</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Real-time charts will populate as soon as the live stream data is connected.</p>
          </div>
        </div>
        
        <div className="glass-panel p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-gray-500">No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartPlaceholder() {
  return (
    <div className="flex items-end gap-2 h-32 justify-center mb-6 opacity-50">
      {[40, 70, 45, 90, 65, 85, 120].map((h, i) => (
        <div key={i} className="w-8 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm" style={{ height: `${h}px` }}></div>
      ))}
    </div>
  );
}

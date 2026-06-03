'use client';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-12 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-lg">
        <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-primary-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Platform Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">This module is currently under construction. Global configurations, API keys, and theme settings will be managed here.</p>
      </motion.div>
    </div>
  );
}

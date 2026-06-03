'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, CreditCard, ChevronRight, Save, Camera, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function StudentSettings() {
  const router = useRouter();
  const [userName, setUserName] = useState('Student');
  const [email, setEmail] = useState('student@pacemaker.com');
  const [bio, setBio] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    const savedEmail = localStorage.getItem('student_email');
    const savedBio = localStorage.getItem('student_bio');
    
    if (user) setUserName(user);
    if (savedEmail) setEmail(savedEmail);
    if (savedBio) setBio(savedBio);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('currentUser', userName);
    localStorage.setItem('student_email', email);
    localStorage.setItem('student_bio', bio);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const sections = [
    { id: 'profile', label: 'Profile Information', icon: User, active: true },
    { id: 'notifications', label: 'Notification Settings', icon: Bell, active: false },
    { id: 'security', label: 'Security & Password', icon: Shield, active: false },
    { id: 'billing', label: 'Subscription & Billing', icon: CreditCard, active: false },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Account <span className="text-primary-600">Settings</span></h1>
        <p className="text-gray-500 font-medium mt-2">Manage your profile, preferences, and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Navigation */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                if (section.id === 'billing') {
                  router.push('/account/plan');
                }
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-left ${
                section.active 
                  ? 'bg-white border border-gray-100 shadow-sm text-primary-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <section.icon className="w-5 h-5" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-10 relative overflow-hidden">
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 right-0 bg-emerald-500 text-white py-3 flex items-center justify-center gap-2 font-bold text-sm z-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center text-center mb-10">
                 <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-black shadow-inner">
                       {userName[0]}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="w-4 h-4" />
                    </button>
                 </div>
                 <h2 className="text-xl font-black text-gray-900 mt-4">{userName}</h2>
                 <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Medical Student</p>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Full Name</label>
                       <input 
                         type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                         className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Email Address</label>
                       <input 
                         type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                         className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Bio / Description</label>
                    <textarea 
                      rows={4}
                      value={bio} onChange={(e) => setBio(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-900 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                      placeholder="Medical student at PaceMaker..."
                    />
                 </div>

                 <div className="pt-6">
                    <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                       <Save className="w-5 h-5" /> Save Profile Changes
                    </button>
                 </div>
              </form>
           </div>


           <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 flex items-center justify-between">
              <div>
                 <h3 className="text-red-900 font-black tracking-tight">Delete Account</h3>
                 <p className="text-red-600/70 text-sm font-medium">Permanently remove all your data and progress.</p>
              </div>
              <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                 Delete
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

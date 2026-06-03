'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, CheckCircle2, ChevronRight, X, AlertTriangle, 
  HelpCircle, Trash, Plus, Gift, Bell, Mail, RefreshCw, 
  Activity, Star, Zap, Shield, Sparkles, LogIn
} from 'lucide-react';
import { 
  getSubscribers, saveSubscribers, getPayments, savePayments, 
  PLAN_PRICES, PLAN_FEATURES, PlanType, SubscriptionStatus, 
  PaymentMethod, PaymentHistory, getOrCreateStudentSubscription,
  pauseSubscription, reactivateSubscription, cancelSubscription, changePlan
} from '@/lib/subscriptionStore';
import type { Subscriber } from '@/lib/subscriptionStore';
import { subscriptionService } from '@/services/subscriptionService';

interface SavedCard {
  id: string;
  type: 'visa' | 'mastercard' | 'upi';
  numberOrAddress: string;
  name: string;
  expiry?: string;
  isDefault: boolean;
}

import { ProfilePageSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function StudentAccountPagePage() {
  return (
    <ErrorBoundary>
      <StudentAccountPage />
    </ErrorBoundary>
  );
}

function StudentAccountPage() {
  const [userName, setUserName] = useState('Dr. Sarah Johnson');
  const [email, setEmail] = useState('sarah@example.com');
  const [studentSub, setStudentSub] = useState<Subscriber | null>(null);
  const [studentPayments, setStudentPayments] = useState<PaymentHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [upgradeYearly, setUpgradeYearly] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  
  // Custom interactive student states
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    type: 'visa' as 'visa' | 'mastercard' | 'upi',
    number: '',
    name: '',
    expiry: ''
  });

  const [notificationToggles, setNotificationToggles] = useState({
    renewalReminders: true,
    paymentAlerts: true,
    offers: false
  });

  const [cancellationReason, setCancellationReason] = useState('Too expensive');
  const [cancellationComments, setCancellationComments] = useState('');
  const [pauseDuration, setPauseDuration] = useState(1);

  // Sync data from local storage & API
  const syncStudentData = async () => {
    // Determine active student context
    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    const storedEmail = typeof window !== 'undefined' ? (localStorage.getItem('student_email') || localStorage.getItem('registeredUsers') && Object.keys(JSON.parse(localStorage.getItem('registeredUsers') || '{}'))[0]) : null;
    
    let activeName = 'Dr. Sarah Johnson';
    let activeEmail = 'sarah@example.com';
    
    if (currentUser && currentUser !== 'Super Admin') {
      activeName = currentUser;
      activeEmail = storedEmail || `${currentUser.toLowerCase().replace(/[^a-z]/g, '')}@pacemaker.com`;
    }
    
    setUserName(activeName);
    setEmail(activeEmail);

    try {
      const sub = await subscriptionService.getUserSubscription();
      const mappedSub: Subscriber = {
        userId: sub.userId || String(sub.id) || 'student_1',
        name: activeName,
        email: activeEmail,
        plan: (sub.plan as PlanType) || 'Basic',
        status: (sub.status as SubscriptionStatus) || 'Active',
        startDate: sub.startDate || '2026-01-01',
        endDate: sub.endDate || '2026-07-01',
        autoRenew: sub.autoRenew !== undefined ? sub.autoRenew : true,
        amount: sub.amount || PLAN_PRICES[(sub.plan as PlanType) || 'Basic'] || 999,
        paymentMethod: (sub.paymentMethod as PaymentMethod) || 'Card',
        registeredDate: sub.startDate || '2026-01-01',
      };
      setStudentSub(mappedSub);
    } catch (err) {
      console.error('Error fetching backend subscription:', err);
      const sub = getOrCreateStudentSubscription(activeName, activeEmail);
      setStudentSub(sub);
    }
    
    const pays = getPayments();
    setStudentPayments(pays.filter(p => p.userId === activeName || p.userId === 'sarah_johnson_id'));
  };

  useEffect(() => {
    syncStudentData();

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);

    // Initial Payment cards
    const initialCards: SavedCard[] = [
      { id: 'c_1', type: 'visa', numberOrAddress: '•••• •••• •••• 4242', name: 'Dr. Sarah Johnson', expiry: '12/29', isDefault: true },
      { id: 'c_2', type: 'upi', numberOrAddress: 'sarah@okaxis', name: 'Sarah Johnson', isDefault: false }
    ];
    
    const saved = localStorage.getItem('lms_payment_methods_v2');
    if (saved) {
      setSavedCards(JSON.parse(saved));
    } else {
      setSavedCards(initialCards);
      localStorage.setItem('lms_payment_methods_v2', JSON.stringify(initialCards));
    }

    // Initial Notification Toggles
    const savedNotifs = localStorage.getItem('lms_student_notifications_v2');
    if (savedNotifs) {
      setNotificationToggles(JSON.parse(savedNotifs));
    }

    // Sync on local storage updates
    window.addEventListener('storage', syncStudentData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', syncStudentData);
    };
  }, []);

  const triggerSuccessAlert = (message: string) => {
    setSuccessAlert(message);
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  if (!isLoaded || !studentSub) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-6">
        <ProfilePageSkeleton />
      </div>
    );
  }

  // Days remaining countdown
  const getDaysLeft = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const today = new Date('2026-05-18');
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  // Auto renewal toggler
  const handleToggleAutoRenew = () => {
    const subs = getSubscribers();
    const idx = subs.findIndex(s => s.userId === studentSub.userId);
    if (idx >= 0) {
      subs[idx].autoRenew = !studentSub.autoRenew;
      saveSubscribers(subs);
      setStudentSub(subs[idx]);
      triggerSuccessAlert(subs[idx].autoRenew ? "Auto-Renewal turned ON!" : "Auto-Renewal disabled.");
    }
  };

  // Save notification toggles
  const handleToggleNotif = (key: 'renewalReminders' | 'paymentAlerts' | 'offers') => {
    const next = { ...notificationToggles, [key]: !notificationToggles[key] };
    setNotificationToggles(next);
    localStorage.setItem('lms_student_notifications_v2', JSON.stringify(next));
    triggerSuccessAlert("Notification preferences updated.");
  };

  // Save new payment method
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.number || !newCardForm.name) return;

    let formattedNumber = newCardForm.number;
    if (newCardForm.type !== 'upi') {
      formattedNumber = `•••• •••• •••• ${newCardForm.number.slice(-4)}`;
    }

    const newMethod: SavedCard = {
      id: 'c_' + Math.random().toString(36).substr(2, 5),
      type: newCardForm.type,
      numberOrAddress: formattedNumber,
      name: newCardForm.name,
      expiry: newCardForm.type !== 'upi' ? newCardForm.expiry : undefined,
      isDefault: savedCards.length === 0
    };

    const next = [...savedCards, newMethod];
    setSavedCards(next);
    localStorage.setItem('lms_payment_methods_v2', JSON.stringify(next));
    setShowAddCard(false);
    setNewCardForm({ type: 'visa', number: '', name: '', expiry: '' });
    triggerSuccessAlert("Payment method saved successfully!");
  };

  // Delete payment method
  const handleDeletePayment = (id: string) => {
    const next = savedCards.filter(c => c.id !== id);
    // If deleted the default, set another default
    if (next.length > 0 && savedCards.find(c => c.id === id)?.isDefault) {
      next[0].isDefault = true;
    }
    setSavedCards(next);
    localStorage.setItem('lms_payment_methods_v2', JSON.stringify(next));
    triggerSuccessAlert("Payment method deleted.");
  };

  // Pause subscription
  const handlePauseConfirm = () => {
    pauseSubscription(studentSub.userId, pauseDuration);
    syncStudentData();
    setShowPauseModal(false);
    triggerSuccessAlert(`Your subscription has been successfully frozen for ${pauseDuration} month(s)!`);
  };

  // Reactivate subscription
  const handleReactivate = () => {
    reactivateSubscription(studentSub.userId);
    syncStudentData();
    triggerSuccessAlert(`Welcome back! Your subscription is active and auto-renew has been restored.`);
  };

  // Cancel subscription with reason
  const handleCancelConfirm = () => {
    cancelSubscription(studentSub.userId, false); // Cancel at billing cycle end
    syncStudentData();
    setShowCancelModal(false);
    triggerSuccessAlert("Your cancellation is logged. You will enjoy features until the end of your billing cycle.");
  };

  // Upgrade / Downgrade calculation
  const getProratedUpgradeCharge = (targetPlan: PlanType) => {
    const currentPrice = PLAN_PRICES[studentSub.plan];
    const targetPrice = PLAN_PRICES[targetPlan];
    
    // Pro-rata based on days left in billing cycle (assuming standard 30 day cycle)
    const daysLeft = getDaysLeft(studentSub.endDate);
    const billingCycleLength = 180; // 6 months standard prep semester
    
    const diff = targetPrice - currentPrice;
    if (diff <= 0) return 0; // downgrade or same plan
    
    // Charge for remaining days
    const prorated = Math.round((diff / billingCycleLength) * Math.min(billingCycleLength, daysLeft));
    return prorated > 0 ? prorated : 0;
  };

  const handleUpgradeSubmit = async (targetPlan: PlanType) => {
    const charge = getProratedUpgradeCharge(targetPlan);
    try {
      await subscriptionService.createSubscription({
        plan: targetPlan,
        amount: charge
      });
      triggerSuccessAlert(`Plan successfully upgraded to ${targetPlan} on backend server!`);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      changePlan(studentSub.userId, targetPlan, charge);
      triggerSuccessAlert(`Plan successfully upgraded to ${targetPlan} (local sync)!`);
    }
    await syncStudentData();
    setShowUpgradeModal(false);
  };

  // Color schemas
  const planDetails = {
    Basic: { icon: Shield, gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/20' },
    Medium: { icon: Zap, gradient: 'from-teal-600 to-cyan-600 shadow-teal-500/20' },
    High: { icon: Star, gradient: 'from-purple-600 to-pink-600 shadow-purple-500/20' },
    Enterprise: { icon: Sparkles, gradient: 'from-amber-600 to-orange-600 shadow-amber-500/20' }
  };

  const statusColors = {
    Active: 'bg-emerald-500 text-white border-emerald-600',
    Expired: 'bg-red-500 text-white border-red-600',
    Cancelled: 'bg-gray-500 text-white border-gray-600',
    Trial: 'bg-indigo-500 text-white border-indigo-600'
  };

  const getSubDescription = (plan: PlanType) => {
    if (plan === 'Enterprise') return 'PaceMaker Ultimate Concierge Bundle';
    if (plan === 'High') return 'Video lectures + Intelligent Q-Bank + Grand Tests';
    if (plan === 'Medium') return 'Intelligent Q-Bank + Grand Tests';
    return 'Mock Exams & Subject Tests Package';
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-12">
      {/* Dynamic Success alerts */}
      <AnimatePresence>
        {successAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl z-50 font-bold"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Admin Preview Banner */}
      {userName === 'Super Admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-amber-950 font-black">Role Sandbox Mode</h4>
              <p className="text-xs text-amber-600 font-semibold">You are logged in as **Super Admin**. We have loaded a mock student context (`Dr. Sarah Johnson`) for testing.</p>
            </div>
          </div>
          <a href="/login?email=sarah@example.com" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow shadow-amber-500/20 whitespace-nowrap">
            Login as Student
          </a>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">My <span className="text-primary-600">Subscription</span></h1>
        <p className="text-gray-500 font-medium mt-1">Review your plan, modify pricing, pause study time, or manage payment logs.</p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side (Sub Details, Comparison, Billing) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Prominent Current Plan Card */}
          <div className={`relative rounded-[2.5rem] p-8 md:p-10 text-white bg-gradient-to-br ${planDetails[studentSub.plan].gradient} shadow-2xl overflow-hidden`}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/20 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                      {(() => {
                        const IconComp = planDetails[studentSub.plan].icon;
                        return <IconComp className="w-6 h-6" />;
                      })()}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Current Academic Plan</span>
                      <h2 className="text-2xl font-black">{studentSub.plan} Tier</h2>
                    </div>
                  </div>
                  <p className="text-xs text-white/80 font-medium mt-2">{getSubDescription(studentSub.plan)}</p>
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase border border-white/40 tracking-wider ${statusColors[studentSub.status]}`}>
                    {studentSub.status}
                  </span>
                  <span className="text-xs font-black text-white/70">₹{studentSub.amount.toLocaleString()} / active cycle</span>
                </div>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Valid Until</span>
                  <div className="font-extrabold text-lg">{studentSub.endDate}</div>
                  <p className="text-[10px] text-white/60">Started on {studentSub.startDate}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Time Remaining</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/10 backdrop-blur-sm rounded-full text-xs font-black">
                    <Activity className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>{getDaysLeft(studentSub.endDate)} Days Left</span>
                  </div>
                </div>

                {/* Auto Renew Toggle */}
                <div className="flex flex-col sm:items-end justify-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Auto-Renewal</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold">{studentSub.autoRenew ? "ON" : "OFF"}</span>
                    <button 
                      onClick={handleToggleAutoRenew}
                      disabled={studentSub.status === 'Cancelled'}
                      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        studentSub.status === 'Cancelled' ? 'bg-gray-400 cursor-not-allowed opacity-50' :
                        studentSub.autoRenew ? 'bg-emerald-500 border border-emerald-600' : 'bg-white/25 border border-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${
                        studentSub.autoRenew ? 'left-6.5' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Plan Features & Comparison */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Features & Benefits</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLAN_FEATURES[studentSub.plan].map((feat, index) => (
                <div key={index} className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-gray-600 leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>

            {/* Quick comparison mini table */}
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PaceMaker Plans Grid Comparison</span>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-left text-[11px] font-bold">
                  <thead className="bg-gray-50 text-gray-400">
                    <tr>
                      <th className="px-3 py-2.5">Plan</th>
                      <th className="px-3 py-2.5 text-center">Video Bank</th>
                      <th className="px-3 py-2.5 text-center">AI Q-Bank</th>
                      <th className="px-3 py-2.5 text-center">Grand Mocks</th>
                      <th className="px-3 py-2.5 text-center">Notes Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100 text-gray-600">
                    {[
                      { name: 'Basic', v: 'No', q: 'No', gt: 'Yes', print: 'No' },
                      { name: 'Medium', v: 'No', q: 'Yes', gt: 'Yes', print: 'No' },
                      { name: 'High', v: 'Yes', q: 'Yes', gt: 'Yes', print: 'PDFs' },
                      { name: 'Enterprise', v: 'Yes', q: 'Yes', gt: 'Yes', print: 'Physical Book' }
                    ].map((row, i) => (
                      <tr key={i} className={studentSub.plan === row.name ? "bg-primary-50/30 text-gray-900" : ""}>
                        <td className="px-3 py-2 font-black">{row.name} {studentSub.plan === row.name && <span className="text-[9px] uppercase font-black tracking-widest text-primary-500 bg-primary-100 px-1.5 py-0.5 rounded ml-1">Active</span>}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{row.v}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{row.q}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{row.gt}</td>
                        <td className="px-3 py-2 text-center text-gray-500">{row.print}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Billing & Invoices ledger */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Billing & Invoices History</h3>
            
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-bold text-gray-700">
                <thead className="bg-gray-50 text-gray-400">
                  <tr>
                    <th className="px-4 py-3.5 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-center">Invoice</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {studentPayments.length > 0 ? (
                    studentPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-400">{pay.date}</td>
                        <td className="px-4 py-3 text-gray-900 font-extrabold">{pay.description}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-black">₹{pay.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            pay.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a href="#" className="p-1 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded text-gray-400 hover:text-gray-600 inline-block font-extrabold" title="Download mockup invoice PDF">
                            PDF Mock
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-400 font-semibold">No invoices logged for your student ID.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side (Actions Panel, Payment Cards, Notification Settings) */}
        <div className="space-y-8">
          
          {/* Main Action Buttons */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Subscription Desk Actions</h4>
            
            {studentSub.status === 'Cancelled' ? (
              <button 
                onClick={handleReactivate}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin" /> Reactivate Plan
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Change / Upgrade Plan
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowPauseModal(true)}
                    className="py-3 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-extrabold text-gray-700 transition-colors shadow-sm"
                  >
                    Pause Freeze
                  </button>
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="py-3 border border-red-100 hover:bg-red-50 text-xs font-extrabold text-red-600 rounded-xl transition-colors shadow-sm"
                  >
                    Cancel Membership
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Payment Methods card panel */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Methods</h4>
              <button 
                onClick={() => setShowAddCard(true)}
                className="inline-flex items-center gap-1 text-[10px] font-black text-primary-600 hover:underline uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Saved methods list */}
            <div className="space-y-3">
              {savedCards.map((card) => (
                <div key={card.id} className="group relative border border-gray-100 bg-gray-50/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-inner hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                      <CreditCard className={`w-5 h-5 ${card.type === 'visa' ? 'text-blue-500' : card.type === 'mastercard' ? 'text-red-500' : 'text-teal-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-900">{card.numberOrAddress}</span>
                        {card.isDefault && (
                          <span className="bg-teal-50 text-teal-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Primary</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{card.expiry ? `Expiry: ${card.expiry}` : 'UPI ID linked'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeletePayment(card.id)}
                    className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete payment method"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Slide-in add method form */}
            <AnimatePresence>
              {showAddCard && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-gray-100 pt-4"
                >
                  <form onSubmit={handleAddPayment} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {['visa', 'mastercard', 'upi'].map(t => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setNewCardForm(prev => ({ ...prev, type: t as any }))}
                          className={`py-1.5 rounded-lg text-[10px] font-extrabold uppercase border text-center transition-colors cursor-pointer ${
                            newCardForm.type === t ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-gray-100 text-gray-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      required
                      placeholder={newCardForm.type === 'upi' ? 'UPI Address (e.g. user@okaxis)' : 'Card Number (16 digits)'}
                      value={newCardForm.number}
                      onChange={(e) => setNewCardForm(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white text-xs font-bold text-gray-800"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Cardholder Name"
                        value={newCardForm.name}
                        onChange={(e) => setNewCardForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white text-xs font-bold text-gray-800"
                      />
                      {newCardForm.type !== 'upi' && (
                        <input 
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={newCardForm.expiry}
                          onChange={(e) => setNewCardForm(prev => ({ ...prev, expiry: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white text-xs font-bold text-gray-800 text-center"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddCard(false)}
                        className="flex-1 py-1.5 border border-gray-100 rounded-xl text-[10px] font-extrabold text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black shadow"
                      >
                        Save Card
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Notification Settings</h4>
            
            <div className="space-y-4">
              
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-extrabold text-gray-900">Email renewal reminders</h5>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Dispatches notifications 7 days before renewal.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotif('renewalReminders')}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    notificationToggles.renewalReminders ? 'bg-primary-500 border border-primary-600' : 'bg-gray-200 border border-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                    notificationToggles.renewalReminders ? 'left-5.5' : 'left-1'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-extrabold text-gray-900">Receipts & payment status</h5>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Sends automated receipts for charges and failures.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotif('paymentAlerts')}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    notificationToggles.paymentAlerts ? 'bg-primary-500 border border-primary-600' : 'bg-gray-200 border border-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                    notificationToggles.paymentAlerts ? 'left-5.5' : 'left-1'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-extrabold text-gray-900">Promotions & academic discounts</h5>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Notifies about coupons and discount offers.</p>
                </div>
                <button 
                  onClick={() => handleToggleNotif('offers')}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                    notificationToggles.offers ? 'bg-primary-500 border border-primary-600' : 'bg-gray-200 border border-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${
                    notificationToggles.offers ? 'left-5.5' : 'left-1'
                  }`}></div>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* UPGRADE PLAN MODAL */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-8 md:p-10 space-y-8"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-3xl font-black text-gray-900">Upgrade Prep Tier</h3>
                <p className="text-gray-500 font-medium text-sm mt-2">Unlock comprehensive video banks, custom mock exams, and print handouts curated by medical mentors.</p>
                
                {/* Monthly/Yearly toggle */}
                <div className="flex justify-center items-center gap-3 mt-6">
                  <span className={`text-xs font-extrabold ${!upgradeYearly ? 'text-primary-600' : 'text-gray-400'}`}>Monthly Billing</span>
                  <button 
                    onClick={() => setUpgradeYearly(!upgradeYearly)}
                    className="relative w-12 h-6 bg-primary-100 border border-primary-200 rounded-full cursor-pointer"
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 bg-primary-600 rounded-full transition-all ${
                      upgradeYearly ? 'left-6.5' : 'left-1'
                    }`}></div>
                  </button>
                  <span className={`text-xs font-extrabold flex items-center gap-1.5 ${upgradeYearly ? 'text-primary-600' : 'text-gray-400'}`}>
                    Yearly Prep Plan <span className="bg-green-150 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Save 20%</span>
                  </span>
                </div>
              </div>

              {/* Plans side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['Basic', 'Medium', 'High', 'Enterprise'] as PlanType[]).map((plan) => {
                  const isCurrent = studentSub.plan === plan;
                  const price = PLAN_PRICES[plan];
                  const finalPrice = upgradeYearly ? Math.round(price * 12 * 0.8) : price;
                  const proratedDiff = getProratedUpgradeCharge(plan);

                  return (
                    <div 
                      key={plan}
                      className={`relative border rounded-[2rem] p-6 flex flex-col justify-between transition-all ${
                        isCurrent 
                          ? 'border-teal-500 bg-teal-50/20 shadow-md shadow-teal-500/5' 
                          : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-xl'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[8px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                          Current Plan
                        </span>
                      )}
                      
                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{plan} Plan</span>
                        
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">₹{finalPrice.toLocaleString()}</span>
                          <span className="text-gray-400 text-[10px] font-semibold">{upgradeYearly ? '/yr' : '/mo'}</span>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-gray-50 text-[11px] font-bold text-gray-500">
                          {PLAN_FEATURES[plan].slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span className="leading-snug">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upgrade billing detail footer */}
                      <div className="pt-6 mt-6 border-t border-gray-50 space-y-3">
                        {!isCurrent && PLAN_PRICES[plan] > PLAN_PRICES[studentSub.plan] && (
                          <div className="text-[9px] font-bold text-gray-400 bg-gray-50 rounded-xl p-2.5">
                            <span className="uppercase tracking-wider">Upgrade Adjustment:</span>
                            <div className="flex justify-between font-black text-gray-700 mt-1">
                              <span>Prorated Charge:</span>
                              <span className="text-gray-900">₹{proratedDiff.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        <button 
                          disabled={isCurrent || PLAN_PRICES[plan] < PLAN_PRICES[studentSub.plan]}
                          onClick={() => handleUpgradeSubmit(plan)}
                          className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${
                            isCurrent ? 'bg-teal-500 text-white cursor-default' :
                            PLAN_PRICES[plan] < PLAN_PRICES[studentSub.plan] ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            'bg-primary-600 hover:bg-primary-700 text-white shadow shadow-primary-500/10 active:scale-95'
                          }`}
                        >
                          {isCurrent ? 'Active Plan' :
                           PLAN_PRICES[plan] < PLAN_PRICES[studentSub.plan] ? 'Downgrade (Admin only)' :
                           `Upgrade (Pay ₹${proratedDiff.toLocaleString()})`}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAUSE SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showPauseModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-md relative p-8 md:p-10 space-y-6"
            >
              <button 
                onClick={() => setShowPauseModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900">Pause Subscription</h3>
                <p className="text-gray-400 text-sm font-semibold mt-1">Need a study break? Freeze your subscription temporarily.</p>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-5 space-y-2.5">
                <h5 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Freeze Conditions
                </h5>
                <p className="text-[11px] text-blue-600 font-bold leading-relaxed">During a subscription freeze, your billing is completely paused and you won't be charged. Access to videos and premium mock tests will remain locked until the freeze period expires or you manually reactivate.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Freeze Duration</label>
                  <select 
                    value={pauseDuration}
                    onChange={(e) => setPauseDuration(Number(e.target.value))}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 text-sm cursor-pointer"
                  >
                    <option value={1}>Freeze for 1 Month</option>
                    <option value={2}>Freeze for 2 Months</option>
                    <option value={3}>Freeze for 3 Months</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowPauseModal(false)}
                    className="flex-1 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePauseConfirm}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all"
                  >
                    Confirm Freeze
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANCEL SUBSCRIPTION MODAL */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-md relative p-8 md:p-10 space-y-6"
            >
              <button 
                onClick={() => setShowCancelModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900">Cancel Membership</h3>
                <p className="text-gray-400 text-sm font-semibold mt-1">We are sorry to see you go. Tell us how we can improve.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Reason for Cancellation</label>
                  <select 
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700 text-sm cursor-pointer"
                  >
                    <option value="Too expensive">Too expensive (Billing & Pricing)</option>
                    <option value="Not using">Not using the platform (Not enough time)</option>
                    <option value="Technical issues">Technical issues / bugs on playback</option>
                    <option value="Completed exam">Completed my NEET PG/INICET preparation</option>
                    <option value="Other">Other / Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Additional Feedback (Optional)</label>
                  <textarea 
                    rows={3}
                    value={cancellationComments}
                    onChange={(e) => setCancellationComments(e.target.value)}
                    placeholder="Help us improve. What could we have done better?"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white text-xs font-bold text-gray-800 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                  >
                    Go Back
                  </button>
                  <button 
                    onClick={handleCancelConfirm}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/10 transition-all active:scale-95"
                  >
                    Confirm Revocation
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

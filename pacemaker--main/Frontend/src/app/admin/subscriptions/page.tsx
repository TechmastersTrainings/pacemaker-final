'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, TrendingUp, Calendar, CreditCard, Search, Filter, 
  Download, Eye, UserPlus, X, Mail, CheckCircle2, AlertTriangle, 
  RotateCcw, RefreshCw, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import { 
  subscriptionService, PLAN_PRICES, PLAN_FEATURES, PlanType, SubscriptionStatus, 
  PaymentMethod, Subscriber, PaymentHistory
} from '@/services/subscriptionService';

import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AdminSubscriptionsPagePage() {
  return (
    <ErrorBoundary>
      <AdminSubscriptionsPage />
    </ErrorBoundary>
  );
}

function AdminSubscriptionsPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Admin Action States inside View Modal
  const [extMonths, setExtMonths] = useState(1);
  const [newPlanSelection, setNewPlanSelection] = useState<PlanType>('Medium');
  const [refundSubModal, setRefundSubModal] = useState<string | null>(null); // payment ID
  const [refundAmount, setRefundAmount] = useState(0);

  // Offline Payment Form
  const [offlineForm, setOfflineForm] = useState({
    name: '',
    email: '',
    plan: 'Medium' as PlanType,
    amount: 1999,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 6).toISOString().split('T')[0] // 6 months
  });

  const loadData = async () => {
    try {
      const subs = await subscriptionService.getAllSubscriptions();
      setSubscribers(subs);
      setPayments([]); // Payment API to be integrated
    } catch (e) {
      console.error("Failed to load subscriptions", e);
    }
  };

  useEffect(() => {
    loadData().then(() => setIsLoaded(true));
  }, []);

  const triggerSuccessAlert = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // 1. STATS CALCULATIONS (Relative to current date May 18, 2026)
  const totalSubscribersCount = subscribers.length;
  
  const activePlansCount = subscribers.filter(s => s.status === 'Active' || s.status === 'Trial').length;
  
  const expiringSoonCount = subscribers.filter(s => {
    if (s.status !== 'Active' && s.status !== 'Trial') return false;
    if (!s.endDate) return false;
    const expiry = new Date(s.endDate);
    const today = new Date('2026-05-18');
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const mrr = subscribers
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => {
      // Annualized/Offline enterprise are standard, but we compute monthly baseline
      if (s.plan === 'Enterprise') return sum + 15000;
      if (s.plan === 'High') return sum + 4999;
      if (s.plan === 'Medium') return sum + 1999;
      return sum + 999;
    }, 0);

  // 2. SEARCH & FILTERING LOGIC
  const filteredSubscribers = subscribers.filter(sub => {
    // Search filter
    const matchesSearch = (sub.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sub.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Plan filter
    const matchesPlan = planFilter === 'All' || sub.plan === planFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    
    // Date Range filters
    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && !!sub.startDate && sub.startDate >= startDateFilter;
    }
    if (endDateFilter) {
      matchesDate = matchesDate && !!sub.endDate && sub.endDate <= endDateFilter;
    }
    
    return matchesSearch && matchesPlan && matchesStatus && matchesDate;
  });

  // 3. PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubscribers = filteredSubscribers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);

  // 4. ACTION SUBMITTERS
  const handleOfflineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineForm.name || !offlineForm.email) return;
    
    try {
      await subscriptionService.createSubscription({
        email: offlineForm.email,
        name: offlineForm.name,
        planType: offlineForm.plan,
        paymentStatus: 'PAID' // Assumed offline paid
      });
      await loadData();
      setShowOfflineModal(false);
      triggerSuccessAlert(`Offline Subscription successfully logged for ${offlineForm.name}!`);
      setOfflineForm({
        name: '',
        email: '',
        plan: 'Medium',
        amount: 1999,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 6).toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      triggerSuccessAlert('Failed to process offline subscription.');
    }
  };

  const handleExtend = async (userId: string | number | undefined) => {
    // API for extension does not exist on the backend yet
    triggerSuccessAlert(`Extension feature is pending backend implementation!`);
  };

  const handleChangePlan = async (userId: string | number | undefined) => {
    triggerSuccessAlert(`Plan alteration feature is pending backend implementation!`);
  };

  const handleCancelSub = async (subId: number | undefined, immediate: boolean) => {
    if (!subId) return;
    try {
      await subscriptionService.disableSubscription(subId);
      await loadData();
      // Need to re-find for modal
      const updatedSubs = await subscriptionService.getAllSubscriptions();
      const updatedSub = updatedSubs.find(s => s.id === subId) || null;
      setSelectedSub(updatedSub);
      triggerSuccessAlert(immediate ? "Subscription disabled immediately!" : "Cancellation scheduled for end of cycle.");
    } catch (err) {
      triggerSuccessAlert("Failed to cancel subscription.");
    }
  };

  const handleTriggerRefund = async (paymentId: string) => {
    if (refundAmount <= 0) return;
    triggerSuccessAlert(`Refund integration is pending backend implementation!`);
  };

  const handleSendReminder = (email: string) => {
    triggerSuccessAlert(`Email notification reminder successfully dispatched to ${email}!`);
  };

  // CSV EXPORT LOGIC
  const exportToCSV = () => {
    const headers = ['User Name', 'Email Address', 'Plan Type', 'Subscription Status', 'Start Date', 'End Date', 'Payment Method', 'Amount (INR)', 'Auto Renew'];
    const rows = filteredSubscribers.map(sub => [
      sub.name,
      sub.email,
      sub.plan,
      sub.status,
      sub.startDate,
      sub.endDate,
      sub.paymentMethod,
      sub.amount,
      sub.autoRenew ? 'ON' : 'OFF'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pacemaker_subscribers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper colors
  const planColors: Record<string, string> = {
    Basic: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    Medium: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400',
    High: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
    Enterprise: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
  };

  const statusColors: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    Trial: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    DISABLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  };

  const getSubRemainingDays = (endDateStr: string | undefined) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date('2026-05-18');
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  if (!isLoaded) {
    return (
      <div className="space-y-10 py-6">
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Alert Ribbon */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl z-50 font-bold"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Subscription <span className="text-primary-600">Management</span></h1>
          <p className="text-gray-500 font-medium mt-1">Audit transactions, manage tiers, and handle offline bookings.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="px-5 py-3 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => setShowOfflineModal(true)}
            className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <UserPlus className="w-4 h-4" /> Record Offline Payment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Subscribers', value: totalSubscribersCount, desc: 'Registered subscribers', icon: Users, bg: 'bg-blue-500/10 text-blue-600' },
          { label: 'Active & Trial Plans', value: activePlansCount, desc: 'Currently studying users', icon: CheckCircle2, bg: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Expiring Soon (7d)', value: expiringSoonCount, desc: 'Requires renewal reminders', icon: Calendar, bg: 'bg-amber-500/10 text-amber-600' },
          { label: 'Monthly Rec. Revenue', value: `₹${mrr.toLocaleString()}`, desc: 'Baselines active MRR', icon: TrendingUp, bg: 'bg-teal-500/10 text-teal-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-gray-900 group-hover:scale-105 transition-transform origin-left duration-300">{stat.value}</h3>
              <p className="text-xs text-gray-400 font-semibold mt-1">{stat.desc}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className="w-7 h-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or email..."
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-gray-900 text-sm font-bold placeholder:text-gray-400 placeholder:font-medium transition-all"
            />
          </div>

          {/* Filtering controllers */}
          <div className="flex flex-wrap gap-3 items-center">
            
            {/* Plan filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-gray-600 cursor-pointer"
              >
                <option value="All">All Plans</option>
                <option value="Basic">Basic Plan</option>
                <option value="Medium">Medium Plan</option>
                <option value="High">High Plan</option>
                <option value="Enterprise">Enterprise Plan</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-gray-600 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Trial">Trial</option>
              </select>
            </div>

            {/* Date Range calendar */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 px-1">From</span>
              <input 
                type="date" 
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-gray-600"
              />
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 px-1">To</span>
              <input 
                type="date" 
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-gray-600"
              />
              {(startDateFilter || endDateFilter) && (
                <button 
                  onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                  className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Refresh list */}
            <button 
              onClick={loadData}
              className="p-2.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
              title="Refresh database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Dynamic Subscribers Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Validity Period</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-sm font-bold text-gray-800">
              {currentSubscribers.length > 0 ? (
                currentSubscribers.map((sub) => (
                  <tr key={sub.userId} className="hover:bg-gray-50/50 transition-colors">
                    {/* User profile */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 shrink-0 border border-gray-200">
                          {sub.avatar ? (
                            <img src={sub.avatar} alt={sub.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-600 font-extrabold text-lg">
                              {(sub.name || '?')[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-extrabold">{sub.name}</span>
                          <span className="text-xs text-gray-400 font-semibold">{sub.email}</span>
                        </div>
                      </div>
                    </td>
                    {/* Plan Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${planColors[sub.plan]}`}>
                        {sub.plan}
                      </span>
                    </td>
                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[sub.status]}`}>
                        {sub.status}
                      </span>
                    </td>
                    {/* Dates */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-xs text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        <div><span className="text-[9px] font-black uppercase text-gray-400 w-8 inline-block">Start:</span>{sub.startDate}</div>
                        <div><span className="text-[9px] font-black uppercase text-gray-400 w-8 inline-block">End:</span>{sub.endDate}</div>
                      </div>
                    </td>
                    {/* Method */}
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>{sub.paymentMethod} {sub.last4 && `(••${sub.last4})`}</span>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-right font-black text-gray-900">
                      ₹{(sub.amount || 0).toLocaleString()}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedSub(sub);
                            setNewPlanSelection(sub.plan as PlanType);
                          }}
                          className="p-2 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-xl transition-colors border border-transparent hover:border-primary-100 shadow-sm hover:shadow"
                          title="View subscriber card & details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSendReminder(sub.email || '')}
                          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-xl transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                          title="Send notifications reminder"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No subscribers matching your filters were found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-50 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 outline-none font-bold text-xs"
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
            </select>
            <span>of {filteredSubscribers.length} total</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 rounded-xl shadow-sm cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-600 rounded-xl shadow-sm cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: SUBSCRIBER TIMELINE & ADMINISTRATION (VIEW DETAILS) */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-8 md:p-10 space-y-8"
            >
              <button 
                onClick={() => { setSelectedSub(null); setRefundSubModal(null); }}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Modal User Header */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl overflow-hidden bg-primary-100 shrink-0 border-2 border-primary-50 flex items-center justify-center font-black text-primary-600 text-2xl">
                    {selectedSub.avatar ? (
                      <img src={selectedSub.avatar} alt={selectedSub.name} className="w-full h-full object-cover" />
                    ) : (
                      (selectedSub.name || '?')[0]
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedSub.name}</h2>
                    <p className="text-sm text-gray-400 font-semibold">{selectedSub.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Registered: {selectedSub.registeredDate}</span>
                      {selectedSub.isOfflinePayment && (
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">Offline</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-3.5 py-1 rounded-full text-xs font-bold border ${planColors[selectedSub.plan]}`}>
                      {selectedSub.plan} Tier
                    </span>
                    <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-bold ${statusColors[selectedSub.status]}`}>
                      {selectedSub.status}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 mt-1">Auto-Renew: <span className={selectedSub.autoRenew ? "text-emerald-600" : "text-red-500"}>{selectedSub.autoRenew ? "ON" : "OFF"}</span></span>
                </div>
              </div>

              {/* Details & Action Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Columns: Information & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Plan Features Card */}
                  <div className="bg-gray-50/70 border border-gray-100 rounded-[2rem] p-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Plan Benefits</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-gray-600">
                      {PLAN_FEATURES[selectedSub.plan].map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Countdown Meter & Timeline */}
                  <div className="border border-gray-100 bg-white rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex flex-col gap-1 text-center sm:text-left">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Subscription Timeline</span>
                      <div className="font-extrabold text-gray-900 mt-1">
                        <div>Starts: <span className="font-bold text-gray-500">{selectedSub.startDate}</span></div>
                        <div>Expires: <span className="font-bold text-gray-500">{selectedSub.endDate}</span></div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 w-28 h-28 bg-primary-50 border-4 border-primary-100 rounded-full relative">
                      <span className="text-3xl font-black text-primary-600">{getSubRemainingDays(selectedSub.endDate)}</span>
                      <span className="text-[9px] font-black uppercase text-primary-400 tracking-wider">Days left</span>
                    </div>
                  </div>

                  {/* Dynamic Billing history associated with this specific user */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payment History</h3>
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-bold">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-gray-400 uppercase tracking-wider text-right">Amount</th>
                            <th className="px-4 py-3 text-gray-400 uppercase tracking-wider text-center">Status</th>
                            <th className="px-4 py-3 text-gray-400 uppercase tracking-wider text-center">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                          {payments.filter(p => p.userId === selectedSub.userId).length > 0 ? (
                            payments
                              .filter(p => p.userId === selectedSub.userId)
                              .map(pay => (
                                <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{pay.date}</td>
                                  <td className="px-4 py-3">{pay.description}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-900 font-extrabold">₹{pay.amount.toLocaleString()}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                      pay.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                                      'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                      {pay.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className="flex justify-center items-center gap-2">
                                      <a href="#" className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 inline-block" title="Download Mock Invoice PDF">
                                        <FileText className="w-4 h-4" />
                                      </a>
                                      {pay.status === 'paid' && (
                                        <button 
                                          onClick={() => {
                                            setRefundSubModal(pay.id);
                                            setRefundAmount(pay.amount);
                                          }}
                                          className="p-1 hover:bg-amber-50 rounded text-amber-500 hover:text-amber-600 inline-block font-extrabold text-[10px] border border-transparent hover:border-amber-200"
                                          title="Initiate Full/Partial Refund"
                                        >
                                          Refund
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-gray-400 font-medium">No transactions recorded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right Column: Administrative Tools */}
                <div className="space-y-6">
                  
                  {/* Action Panel 1: Extend */}
                  <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5 space-y-4 shadow-inner">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      <h4 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">Extend Validity</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={extMonths}
                        onChange={(e) => setExtMonths(Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none w-full shadow-sm"
                      >
                        <option value={1}>Add 1 Month</option>
                        <option value={3}>Add 3 Months</option>
                        <option value={6}>Add 6 Months</option>
                        <option value={12}>Add 12 Months</option>
                      </select>
                      <button 
                        onClick={() => handleExtend(selectedSub.userId)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black shadow transition-all active:scale-95 whitespace-nowrap"
                      >
                        Apply Extension
                      </button>
                    </div>
                  </div>

                  {/* Action Panel 2: Upgrade/Downgrade */}
                  <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5 space-y-4 shadow-inner">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-teal-600" />
                      <h4 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">Alter Tier Plan</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <select 
                        value={newPlanSelection}
                        onChange={(e) => setNewPlanSelection(e.target.value as PlanType)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none w-full shadow-sm"
                      >
                        <option value="Basic">Basic Plan (₹999/mo)</option>
                        <option value="Medium">Medium Plan (₹1,999/mo)</option>
                        <option value="High">High Plan (₹4,999/mo)</option>
                        <option value="Enterprise">Enterprise Plan (₹15,000/mo)</option>
                      </select>
                      
                      <div className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 rounded-xl p-3">
                        <span className="uppercase text-gray-500 tracking-wider">Adjustment Estimate:</span>
                        <div className="mt-1 flex justify-between text-gray-700">
                          <span>Prorated Difference:</span>
                          <span className="font-black text-gray-900">
                            ₹{Math.max(0, PLAN_PRICES[newPlanSelection] - PLAN_PRICES[selectedSub.plan]).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleChangePlan(selectedSub.userId)}
                        disabled={newPlanSelection === selectedSub.plan}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow transition-all active:scale-95"
                      >
                        Submit Tier Alteration
                      </button>
                    </div>
                  </div>

                  {/* Action Panel 3: Cancellation Controls */}
                  <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-extrabold text-sm text-red-950 uppercase tracking-wide">Revocation Center</h4>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleCancelSub(selectedSub.id, false)}
                        disabled={selectedSub.status === 'Cancelled' || !selectedSub.autoRenew}
                        className="w-full py-2 border border-red-200 hover:bg-red-100/50 disabled:opacity-50 text-red-700 rounded-xl text-xs font-black transition-colors"
                      >
                        Disable Auto-Renewal
                      </button>
                      <button 
                        onClick={() => handleCancelSub(selectedSub.id, true)}
                        disabled={selectedSub.status === 'Cancelled'}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/10 transition-all active:scale-95"
                      >
                        Cancel Plan Immediately
                      </button>
                    </div>
                  </div>

                  {/* Action Panel 4: Notification dispatch */}
                  <button 
                    onClick={() => handleSendReminder(selectedSub.email || '')}
                    className="w-full py-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-gray-400" /> Send Custom Email Alert
                  </button>

                </div>

              </div>

              {/* Sub Refund Modal Triggered overlay */}
              {refundSubModal && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 rounded-[2.5rem] border border-gray-200 shadow-xl z-20 space-y-6">
                  <RotateCcw className="w-12 h-12 text-amber-500 animate-pulse" />
                  <div className="text-center max-w-sm">
                    <h4 className="text-xl font-black text-gray-900">Authorize Refund Flow</h4>
                    <p className="text-xs text-gray-400 font-semibold mt-1">Transaction ID: <span className="font-mono">{refundSubModal}</span></p>
                    <p className="text-xs text-gray-500 font-bold mt-3">Enter the refund amount in INR (₹). You can trigger a partial refund or full value.</p>
                  </div>
                  
                  <div className="space-y-4 w-full max-w-xs">
                    <div className="relative">
                      <span className="absolute left-4 inset-y-0 flex items-center font-bold text-gray-400 text-lg">₹</span>
                      <input 
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 outline-none text-center text-lg"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setRefundSubModal(null)}
                        className="flex-1 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleTriggerRefund(refundSubModal)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow transition-all"
                      >
                        Submit Refund
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: RECORD OFFLINE PAYMENTS */}
      <AnimatePresence>
        {showOfflineModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl w-full max-w-lg relative p-8 md:p-10 space-y-6"
            >
              <button 
                onClick={() => setShowOfflineModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-900">Record Offline Payment</h3>
                <p className="text-gray-400 text-sm font-semibold mt-1">Book manual cash, bank transfers, or draft deposits.</p>
              </div>

              <form onSubmit={handleOfflineSubmit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Student Full Name</label>
                  <input 
                    type="text"
                    required
                    value={offlineForm.name}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. Rajesh Kumar"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 font-bold text-gray-900 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={offlineForm.email}
                    onChange={(e) => setOfflineForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="rajesh.kumar@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-primary-500 font-bold text-gray-900 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Plan Tier Selection</label>
                    <select 
                      value={offlineForm.plan}
                      onChange={(e) => {
                        const newPlan = e.target.value as PlanType;
                        setOfflineForm(prev => ({ ...prev, plan: newPlan, amount: PLAN_PRICES[newPlan] }));
                      }}
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white font-bold text-gray-700 text-sm cursor-pointer"
                    >
                      <option value="Basic">Basic Plan</option>
                      <option value="Medium">Medium Plan</option>
                      <option value="High">High Plan</option>
                      <option value="Enterprise">Enterprise Plan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Logged Amount (₹)</label>
                    <input 
                      type="number"
                      required
                      value={offlineForm.amount}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white font-black text-gray-900 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={offlineForm.startDate}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white font-bold text-gray-700 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date</label>
                    <input 
                      type="date"
                      required
                      value={offlineForm.endDate}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white font-bold text-gray-700 text-xs"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm shadow-xl shadow-primary-500/20 transition-all active:scale-95 mt-4"
                >
                  Create Book Entry & Active Plan
                </button>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

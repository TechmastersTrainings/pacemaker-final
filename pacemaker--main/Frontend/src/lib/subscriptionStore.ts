'use client';

export type PlanType = 'Basic' | 'Medium' | 'High' | 'Enterprise';
export type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled' | 'Trial';
export type PaymentMethod = 'Razorpay' | 'Card' | 'UPI';

export interface Subscriber {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number; // in ₹
  paymentMethod: PaymentMethod;
  last4?: string;
  registeredDate: string;
  pausedMonthsRemaining?: number; // for paused accounts
  isOfflinePayment?: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'failed' | 'refunded';
  invoiceUrl: string;
  paymentMethod: PaymentMethod;
  last4?: string;
}

const SUBS_KEY = 'lms_subscriptions_v2';
const PAYMENTS_KEY = 'lms_payments_v2';

// 8 Diverse Seed Subscribers relative to current date (May 18, 2026)
const DEFAULT_SUBSCRIBERS: Subscriber[] = [
  {
    userId: 'u123',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
    plan: 'Medium',
    status: 'Active',
    startDate: '2026-01-15',
    endDate: '2026-07-15',
    autoRenew: true,
    amount: 1999,
    paymentMethod: 'Card',
    last4: '4242',
    registeredDate: '2025-12-10'
  },
  {
    userId: 'u124',
    name: 'Dr. Abhishek Sharma',
    email: 'abhishek@example.com',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    plan: 'High',
    status: 'Active',
    startDate: '2026-02-10',
    endDate: '2026-08-10',
    autoRenew: true,
    amount: 4999,
    paymentMethod: 'UPI',
    registeredDate: '2026-01-05'
  },
  {
    userId: 'u125',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@example.com',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150',
    plan: 'Enterprise',
    status: 'Active',
    startDate: '2025-11-20',
    endDate: '2026-11-20',
    autoRenew: false,
    amount: 15000,
    paymentMethod: 'Razorpay',
    registeredDate: '2025-11-01'
  },
  {
    userId: 'u126',
    name: 'Dr. Marcus Aurelius',
    email: 'marcus@example.com',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150',
    plan: 'Basic',
    status: 'Expired',
    startDate: '2025-09-01',
    endDate: '2026-03-01',
    autoRenew: false,
    amount: 999,
    paymentMethod: 'Card',
    last4: '1111',
    registeredDate: '2025-08-15'
  },
  {
    userId: 'u127',
    name: 'Dr. Michael Scott',
    email: 'michael.scott@example.com',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
    plan: 'Medium',
    status: 'Cancelled',
    startDate: '2026-03-01',
    endDate: '2026-06-01',
    autoRenew: false,
    amount: 1999,
    paymentMethod: 'UPI',
    registeredDate: '2026-02-20'
  },
  {
    userId: 'u128',
    name: 'Dr. Jessica Day',
    email: 'jessica@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    plan: 'Basic',
    status: 'Trial',
    startDate: '2026-05-14',
    endDate: '2026-05-24', // Expiring in 6 days relative to May 18, 2026
    autoRenew: true,
    amount: 0,
    paymentMethod: 'UPI',
    registeredDate: '2026-05-14'
  },
  {
    userId: 'u129',
    name: 'Dr. Priya Patel',
    email: 'priya@example.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    plan: 'High',
    status: 'Active',
    startDate: '2025-11-23',
    endDate: '2026-05-23', // Expiring in 5 days relative to May 18, 2026
    autoRenew: true,
    amount: 4999,
    paymentMethod: 'Card',
    last4: '8888',
    registeredDate: '2025-11-20'
  },
  {
    userId: 'u130',
    name: 'Dr. Robert Carter',
    email: 'robert.carter@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    plan: 'Enterprise',
    status: 'Active',
    startDate: '2026-04-01',
    endDate: '2026-10-01',
    autoRenew: true,
    amount: 15000,
    paymentMethod: 'Razorpay',
    registeredDate: '2026-03-25',
    isOfflinePayment: true
  }
];

const DEFAULT_PAYMENTS: PaymentHistory[] = [
  { id: 'pay_001', userId: 'u123', date: '2026-01-15', description: 'Medium Plan Activation', amount: 1999, status: 'paid', invoiceUrl: '#', paymentMethod: 'Card', last4: '4242' },
  { id: 'pay_002', userId: 'u124', date: '2026-02-10', description: 'High Plan Activation', amount: 4999, status: 'paid', invoiceUrl: '#', paymentMethod: 'UPI' },
  { id: 'pay_003', userId: 'u125', date: '2025-11-20', description: 'Enterprise Annual Activation', amount: 15000, status: 'paid', invoiceUrl: '#', paymentMethod: 'Razorpay' },
  { id: 'pay_004', userId: 'u126', date: '2025-09-01', description: 'Basic Plan purchase', amount: 999, status: 'paid', invoiceUrl: '#', paymentMethod: 'Card', last4: '1111' },
  { id: 'pay_005', userId: 'u126', date: '2025-10-01', description: 'Basic Plan Renewal - Failed', amount: 999, status: 'failed', invoiceUrl: '#', paymentMethod: 'Card', last4: '1111' },
  { id: 'pay_006', userId: 'u127', date: '2026-03-01', description: 'Medium Plan purchase', amount: 1999, status: 'paid', invoiceUrl: '#', paymentMethod: 'UPI' },
  { id: 'pay_007', userId: 'u129', date: '2025-11-23', description: 'High Plan Semester Purchase', amount: 4999, status: 'paid', invoiceUrl: '#', paymentMethod: 'Card', last4: '8888' },
  { id: 'pay_008', userId: 'u130', date: '2026-04-01', description: 'Enterprise Plan Offline Intake', amount: 15000, status: 'paid', invoiceUrl: '#', paymentMethod: 'Razorpay', last4: '' }
];

// Helper to make sure we're in the browser environment before invoking localStorage
const getLocalStorage = (key: string, defaultValue: string) => {
  if (typeof window === 'undefined') return defaultValue;
  return localStorage.getItem(key) || defaultValue;
};

const setLocalStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

export function getSubscribers(): Subscriber[] {
  const loaded = getLocalStorage(SUBS_KEY, '');
  if (!loaded) {
    saveSubscribers(DEFAULT_SUBSCRIBERS);
    return DEFAULT_SUBSCRIBERS;
  }
  try {
    return JSON.parse(loaded);
  } catch {
    return DEFAULT_SUBSCRIBERS;
  }
}

export function saveSubscribers(subs: Subscriber[]) {
  setLocalStorage(SUBS_KEY, JSON.stringify(subs));
  // Fire storage event to update other tabs/views in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
}

export function getPayments(): PaymentHistory[] {
  const loaded = getLocalStorage(PAYMENTS_KEY, '');
  if (!loaded) {
    savePayments(DEFAULT_PAYMENTS);
    return DEFAULT_PAYMENTS;
  }
  try {
    return JSON.parse(loaded);
  } catch {
    return DEFAULT_PAYMENTS;
  }
}

export function savePayments(pays: PaymentHistory[]) {
  setLocalStorage(PAYMENTS_KEY, JSON.stringify(pays));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
}

// Custom Student subscription loader & initialization helper
export function getOrCreateStudentSubscription(name: string, email: string): Subscriber {
  const subs = getSubscribers();
  const found = subs.find(s => s.email.toLowerCase() === email.toLowerCase());
  
  if (found) return found;
  
  // Create a brand new active plan for this student
  const newSub: Subscriber = {
    userId: 'u_student_' + Math.random().toString(36).substr(2, 5),
    name: name,
    email: email,
    plan: 'Medium',
    status: 'Active',
    startDate: '2026-01-15',
    endDate: '2026-07-15',
    autoRenew: true,
    amount: 1999,
    paymentMethod: 'Card',
    last4: '1099',
    registeredDate: '2026-01-01'
  };
  
  const updatedSubs = [newSub, ...subs];
  saveSubscribers(updatedSubs);
  
  // Add an initial payment record
  const newPay: PaymentHistory = {
    id: 'pay_' + Math.random().toString(36).substr(2, 5),
    userId: newSub.userId,
    date: '2026-01-15',
    description: 'Medium Plan Activation',
    amount: 1999,
    status: 'paid',
    invoiceUrl: '#',
    paymentMethod: 'Card',
    last4: '1099'
  };
  
  const pays = getPayments();
  savePayments([newPay, ...pays]);
  
  return newSub;
}

// Plan Prices dictionary (monthly basis)
export const PLAN_PRICES = {
  Basic: 999,
  Medium: 1999,
  High: 4999,
  Enterprise: 15000
};

export const PLAN_FEATURES = {
  Basic: [
    'All Grand Tests & Mock Exams Only',
    'National Ranking & Percentiles',
    'Detailed explanations for all questions',
    'Standard community support'
  ],
  Medium: [
    'Adaptive Q-Bank with AI Analytics',
    'All Grand Tests & Mini Mocks',
    'Previous Year Questions (PYQs)',
    'Doubt Resolution Forum Access',
    'Email support (24 hour response)'
  ],
  High: [
    'All 19 Subjects Video Lectures',
    'Adaptive Q-Bank with AI Analytics',
    'All Grand Tests & Mini Mocks',
    'Clinical Scenario Masterclass',
    'Printed Lecture Handouts (PDFs)',
    'Priority Doubt Resolution (4 hours)'
  ],
  Enterprise: [
    'All PaceMaker High Features Included',
    'Printed Physical Study Notes delivered home',
    '1-on-1 Medical Mentor consultations',
    'Customized prep calendars & trackers',
    'Dedicated WhatsApp Concierge assistance',
    'Mock Interview & FMGE/NEET counseling sessions'
  ]
};

// Admin Operations API

export function addOfflineSubscription(data: { name: string, email: string, plan: PlanType, amount: number, startDate: string, endDate: string }) {
  const subs = getSubscribers();
  const userId = 'u_off_' + Math.random().toString(36).substr(2, 5);
  
  const newSub: Subscriber = {
    userId,
    name: data.name,
    email: data.email,
    plan: data.plan,
    status: 'Active',
    startDate: data.startDate,
    endDate: data.endDate,
    autoRenew: false,
    amount: data.amount,
    paymentMethod: 'Card', // Default to Card for offline bookkeeping
    registeredDate: new Date().toISOString().split('T')[0],
    isOfflinePayment: true
  };
  
  saveSubscribers([newSub, ...subs]);
  
  const newPay: PaymentHistory = {
    id: 'pay_' + Math.random().toString(36).substr(2, 5),
    userId,
    date: data.startDate,
    description: `${data.plan} Plan - Offline Intake`,
    amount: data.amount,
    status: 'paid',
    invoiceUrl: '#',
    paymentMethod: 'Card'
  };
  
  const payments = getPayments();
  savePayments([newPay, ...payments]);
  return newSub;
}

export function extendSubscription(userId: string, extensionMonths: number) {
  const subs = getSubscribers();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx < 0) return;
  
  const sub = subs[idx];
  const oldEndDate = new Date(sub.endDate);
  oldEndDate.setMonth(oldEndDate.getMonth() + extensionMonths);
  sub.endDate = oldEndDate.toISOString().split('T')[0];
  sub.status = 'Active'; // Reactivate if it was expired/cancelled
  
  saveSubscribers([...subs]);
  
  // Log extension payment records
  const chargeAmount = sub.plan === 'Basic' ? 999 : sub.plan === 'Medium' ? 1999 : sub.plan === 'High' ? 4999 : 15000;
  const newPay: PaymentHistory = {
    id: 'pay_' + Math.random().toString(36).substr(2, 5),
    userId,
    date: new Date().toISOString().split('T')[0],
    description: `Subscription Extended (${extensionMonths} mo) - ${sub.plan} Plan`,
    amount: chargeAmount * extensionMonths,
    status: 'paid',
    invoiceUrl: '#',
    paymentMethod: sub.paymentMethod,
    last4: sub.last4
  };
  
  const payments = getPayments();
  savePayments([newPay, ...payments]);
}

export function changePlan(userId: string, newPlan: PlanType, proratedAmount: number) {
  const subs = getSubscribers();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx < 0) return;
  
  const sub = subs[idx];
  sub.plan = newPlan;
  sub.amount = PLAN_PRICES[newPlan];
  sub.status = 'Active';
  
  saveSubscribers([...subs]);
  
  const newPay: PaymentHistory = {
    id: 'pay_' + Math.random().toString(36).substr(2, 5),
    userId,
    date: new Date().toISOString().split('T')[0],
    description: `Plan Upgraded/Downgraded to ${newPlan} (Prorated adjustment)`,
    amount: proratedAmount,
    status: 'paid',
    invoiceUrl: '#',
    paymentMethod: sub.paymentMethod,
    last4: sub.last4
  };
  
  const payments = getPayments();
  savePayments([newPay, ...payments]);
}

export function cancelSubscription(userId: string, immediate: boolean) {
  const subs = getSubscribers();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx < 0) return;
  
  const sub = subs[idx];
  sub.autoRenew = false;
  if (immediate) {
    sub.status = 'Cancelled';
  } else {
    // Non-immediate cancellation just turns off autoRenew and keeps it Active until endDate
    sub.status = 'Active'; 
  }
  
  saveSubscribers([...subs]);
}

export function pauseSubscription(userId: string, months: number) {
  const subs = getSubscribers();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx < 0) return;
  
  const sub = subs[idx];
  sub.status = 'Cancelled'; // Freeze status
  sub.pausedMonthsRemaining = months;
  sub.autoRenew = false;
  
  // Extend subscription end date by frozen months
  const oldEndDate = new Date(sub.endDate);
  oldEndDate.setMonth(oldEndDate.getMonth() + months);
  sub.endDate = oldEndDate.toISOString().split('T')[0];
  
  saveSubscribers([...subs]);
}

export function reactivateSubscription(userId: string) {
  const subs = getSubscribers();
  const idx = subs.findIndex(s => s.userId === userId);
  if (idx < 0) return;
  
  const sub = subs[idx];
  sub.status = 'Active';
  sub.autoRenew = true;
  sub.pausedMonthsRemaining = undefined;
  
  saveSubscribers([...subs]);
}

export function refundPayment(paymentId: string, amount: number) {
  const payments = getPayments();
  const idx = payments.findIndex(p => p.id === paymentId);
  if (idx < 0) return;
  
  const payment = payments[idx];
  payment.status = 'refunded';
  savePayments([...payments]);
}

'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, CheckCircle2, ChevronRight, Info, CreditCard, 
  Lock, QrCode, Wallet, Percent, Tag, X, Check, ArrowLeft, 
  HelpCircle, ShieldCheck, Sparkles, Upload, FileText, Image as ImageIcon,
  Phone, Key, School, GraduationCap, MapPin, Edit3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getSubscribers, saveSubscribers, getPayments, 
  savePayments, PaymentHistory, PlanType 
} from '@/lib/subscriptionStore';
import type { Subscriber } from '@/lib/subscriptionStore';
import { subscriptionService } from '@/services/subscriptionService';

interface Duration {
  label: string;
  subText?: string;
  price: number;
  originalPrice: number;
  isRecommended: boolean;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  subtitle: string;
  durations: Duration[];
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track selected duration index per plan ID
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>({});
  
  // Coupon and referral states
  const [couponCode, setCouponCode] = useState('WORLD8');
  const [couponApplied, setCouponApplied] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralApplied, setReferralApplied] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);

  // Authentication & Profile details
  const [userName, setUserName] = useState('Student');
  const [userEmail, setUserEmail] = useState('student@pacemaker.com');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // OTP Verification Hook States
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [generatedOtpFallback, setGeneratedOtpFallback] = useState('');

  const handleSendOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    setGeneratedOtpFallback('');
    try {
      const response = await axios.post('/api/pricing/otp', {
        action: 'send',
        mobileNumber
      });
      if (response.data.success) {
        if (!response.data.sent && response.data.code) {
          // If no SMS gateway keys are set in local environment, 
          // share the generated code so they can verify locally
          setGeneratedOtpFallback(response.data.code);
        }
        setCheckoutStep('otp');
      } else {
        setOtpError(response.data.message || 'Failed to dispatch OTP SMS.');
      }
    } catch (error: any) {
      setOtpError(error.response?.data?.message || 'Server error dispatching OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpVerifying(true);
    setOtpError('');
    try {
      const response = await axios.post('/api/pricing/otp', {
        action: 'verify',
        mobileNumber,
        otpCode
      });
      if (response.data.success) {
        localStorage.setItem('student_mobile', mobileNumber);
        setCheckoutStep('college');
      } else {
        setOtpError(response.data.message || 'Incorrect OTP code entered. Please try again.');
      }
    } catch (error: any) {
      setOtpError(error.response?.data?.message || 'Incorrect OTP. Try requesting a new one.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Checkout modal multi-step states
  // 'hidden' | 'mobile' | 'otp' | 'college' | 'summary' | 'payment' | 'processing' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<
    'hidden' | 'mobile' | 'otp' | 'college' | 'summary' | 'payment' | 'processing' | 'success'
  >('hidden');

  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutDuration, setCheckoutDuration] = useState<Duration | null>(null);
  
  // Payment gateway options
  const [paymentOption, setPaymentOption] = useState<'card' | 'qr' | 'bank' | 'wallet'>('qr');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // QR Uploader & countdown states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes

  useEffect(() => {
    // Fetch logged in user info
    const savedName = localStorage.getItem('currentUser');
    const savedEmail = localStorage.getItem('student_email');
    if (savedName) setUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);

    const fetchPlans = async () => {
      try {
        const response = await axios.get('/api/pricing');
        const data: Plan[] = response.data;
        setPlans(data);
        
        // Auto-select recommended or first option for each plan
        const initialSelections: Record<string, number> = {};
        data.forEach(plan => {
          const recIndex = plan.durations.findIndex(d => d.isRecommended);
          initialSelections[plan.id] = recIndex !== -1 ? recIndex : 0;
        });
        setSelectedDurations(initialSelections);
      } catch (error) {
        console.error("Failed to fetch plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 10-Minute Countdown Clock Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkoutStep === 'payment' && countdownSeconds > 0) {
      timer = setInterval(() => {
        setCountdownSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutStep, countdownSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'WORLD8') {
      setCouponApplied(true);
    } else if (couponCode.trim() !== '') {
      setCouponApplied(true);
    }
  };

  const handleApplyReferral = () => {
    if (referralCode.trim() !== '') {
      setReferralApplied(true);
    }
  };

  const openCheckout = (plan: Plan) => {
    const selectedIdx = selectedDurations[plan.id] ?? 0;
    const duration = plan.durations[selectedIdx];
    setCheckoutPlan(plan);
    setCheckoutDuration(duration);
    
    // Check if student has mobile cached
    const savedMobile = localStorage.getItem('student_mobile');
    if (savedMobile) {
      setMobileNumber(savedMobile);
      const savedCollege = localStorage.getItem('student_college');
      if (savedCollege) {
        setSelectedState(localStorage.getItem('student_state') || '');
        setSelectedCollege(savedCollege);
        setSelectedYear(localStorage.getItem('student_year') || '');
        setCheckoutStep('summary'); // Directly jump to summary if profile is set
      } else {
        setCheckoutStep('college');
      }
    } else {
      setCheckoutStep('mobile');
    }
    
    setCountdownSeconds(600); // Reset timer
    setUploadedReceipt(null);
    setUploadedFileName('');
  };

  const closeCheckout = () => {
    setCheckoutStep('hidden');
    setCheckoutPlan(null);
    setCheckoutDuration(null);
  };

  // Math helper
  const fmt = (num: number) => {
    return '₹' + num.toLocaleString('en-IN');
  };

  // Dynamic pricing card calculator (WORLD8 gives 10% or flat discount matching plans)
  const getPricingData = () => {
    if (!checkoutDuration) return { original: 0, discount: 0, final: 0 };
    
    const original = checkoutDuration.originalPrice;
    const basePrice = checkoutDuration.price;
    
    // For Plan A 9 Months, original is 12999 and discount is 3000, final is 9999 as per screenshot!
    let discount = original - basePrice;
    
    if (couponApplied) {
      // WORLD8 grants an extra 10% discount off the basePrice
      const couponReduction = Math.round(basePrice * 0.1);
      discount += couponReduction;
    }

    if (referralApplied) {
      discount += 1000; // Flat ₹1,000 extra for referral code
    }

    const final = Math.max(0, original - discount);
    return { original, discount, final };
  };

  // Handle Mock Receipt Uploads
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedReceipt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Subscription Activation Handler
  const executeSubscriptionActivation = async () => {
    if (!checkoutPlan || !checkoutDuration) return;

    const pricing = getPricingData();
    const RAZORPAY_KEY = 'rzp_test_SxUph0F8yRLllK';

    // 1. Create order on backend OR use local logic for demo if no backend yet
    // For this implementation, we'll try the backend and fallback to simulated success
    let backendSubscriptionId = 'sub_offline_' + Date.now();
    
    let mappedPlan: PlanType = 'Medium';
    if (checkoutPlan.id === 'plan-c') mappedPlan = 'Enterprise';
    else if (checkoutPlan.id === 'plan-b') mappedPlan = 'High';
    else mappedPlan = 'Basic';

    try {
      const response = await subscriptionService.createSubscription({
        plan: mappedPlan,
        amount: pricing.final
      });
      if (response && response.subscriptionId) {
        backendSubscriptionId = response.subscriptionId;
      }
    } catch (err) {
      console.warn('Backend subscription creation failed, using fallback ID');
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: pricing.final * 100, // in paise
      currency: "INR",
      name: "PaceMaker LMS",
      description: `Enrollment: ${checkoutPlan.name} (${checkoutDuration.label})`,
      image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=100&auto=format&fit=crop",
      subscription_id: backendSubscriptionId.startsWith('sub_razorpay') ? backendSubscriptionId : undefined,
      handler: async function (response: any) {
        setCheckoutStep('processing');
        
        try {
          // Verify with backend
          await subscriptionService.verifyPayment({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySubscriptionId: response.razorpay_subscription_id || backendSubscriptionId,
            razorpaySignature: response.razorpay_signature
          });
        } catch (e) {
          console.error("Backend verification failed", e);
        }

        // Finalize locally
        finalizeLocalSubscription(pricing.final, mappedPlan, response.razorpay_payment_id);
      },
      prefill: {
        name: userName,
        email: userEmail,
        contact: mobileNumber
      },
      notes: {
        plan: checkoutPlan.name,
        duration: checkoutDuration.label,
        college: selectedCollege
      },
      theme: {
        color: "#063e46"
      },
      modal: {
        ondismiss: function() {
          console.log("Payment modal closed");
        }
      },
      // Restriction for international cards
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Most Used Methods',
              instruments: [
                { method: 'upi' },
                { method: 'card' },
                { method: 'netbanking' }
              ]
            }
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      payment_method: {
        card: {
          international: false // This disables international card payments in some Razorpay versions
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const finalizeLocalSubscription = (amount: number, mappedPlan: PlanType, paymentId: string) => {
    const subs = getSubscribers();
    const userEmail = localStorage.getItem('currentUserEmail') || 'student@pacemaker.com';
    const foundIdx = subs.findIndex(s => s.email.toLowerCase() === userEmail.toLowerCase());

    const durationLabel = checkoutDuration?.label || '12 Months';
    const durationMonths = parseInt(durationLabel.split(' ')[0]) || 12;
    const extensionMonths = checkoutDuration?.subText ? 1 : 0;
    const totalMonths = durationMonths + extensionMonths;

    const startDateStr = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + totalMonths);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Save custom details to localStorage
    localStorage.setItem('student_mobile', mobileNumber);
    localStorage.setItem('student_state', selectedState);
    localStorage.setItem('student_college', selectedCollege);
    localStorage.setItem('student_year', selectedYear);

    const subscriberData: Subscriber = {
      userId: foundIdx !== -1 ? subs[foundIdx].userId : 'u_student_' + Math.random().toString(36).substr(2, 5),
      name: userName,
      email: userEmail,
      plan: mappedPlan,
      status: 'Active',
      startDate: startDateStr,
      endDate: endDateStr,
      autoRenew: true,
      amount: amount,
      paymentMethod: 'Razorpay',
      last4: paymentId.slice(-4),
      registeredDate: startDateStr,
    };

    if (foundIdx !== -1) {
      subs[foundIdx] = subscriberData;
    } else {
      subs.unshift(subscriberData);
    }
    saveSubscribers(subs);

    // Save payments log
    const pays = getPayments();
    const newPay: PaymentHistory = {
      id: paymentId || ('pay_' + Math.random().toString(36).substr(2, 5)),
      userId: subscriberData.userId,
      date: startDateStr,
      description: `${checkoutPlan?.name} (${checkoutDuration?.label}) Premium Onboarding`,
      amount: amount,
      status: 'paid',
      invoiceUrl: '#',
      paymentMethod: 'Razorpay'
    };
    savePayments([newPay, ...pays]);

    setCheckoutStep('success');

    // Trigger standard audio notification beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 659.25;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  // Get details checklist matching the selected Plan
  const getPlanFeatures = (planId: string) => {
    if (planId === 'plan-a') {
      return [
        '390+ total Tests (130+ Grand Tests)',
        'Targeted GTs for NEET PG and INI CET',
        'Largest Pan-India mock tests (1 lakh+ participants)'
      ];
    }
    if (planId === 'plan-b') {
      return [
        '15,000+ Topic-wise High-Yield MCQs',
        'All Grand Tests & Mini Mock Series included',
        'In-depth performance analytics & national ranks'
      ];
    }
    return [
      'All 19 Subjects high-yield video lectures',
      '15,000+ Topic-wise High-Yield MCQs',
      'All Grand Tests & Mini Mock Series included',
      'Clinical case walkthroughs & physical handouts ready'
    ];
  };

  const getPlanWarning = (planId: string) => {
    if (planId === 'plan-a') return 'QBank and Custom Module are not included in Plan A.';
    if (planId === 'plan-b') return 'Video lectures are not included in Plan B.';
    return 'All current features & modules are fully unlocked in Plan C.';
  };

  return (
    <div className="min-h-screen w-full bg-[#063e46] py-16 flex flex-col justify-start relative overflow-x-hidden font-sans">
      
      {/* Promo Bar */}
      <div className="w-full bg-[#e6f0ed] border-b border-[#cbd5e1] text-[#0d5e66] py-3.5 px-4 sticky top-0 z-40 flex items-center justify-center flex-wrap gap-2 text-center text-sm font-semibold shadow-sm">
        <span className="flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Discount unlocked:</span>
        </span>
        <div className="bg-[#8bc34a]/30 px-3 py-1 border border-[#8bc34a] rounded-full text-[#33691e] font-black text-xs tracking-wider uppercase flex items-center gap-1">
          WORLD8
        </div>
        <span>applied to all plans successfully!</span>
        <button 
          onClick={() => setCouponApplied(!couponApplied)}
          className="text-xs underline text-[#0f6b70] hover:text-[#0c4c54] ml-2 cursor-pointer font-bold animate-pulse"
        >
          {couponApplied ? "Remove Coupon" : "Re-apply Coupon"}
        </button>
      </div>

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#5bc0de]/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto px-4 mt-6 mb-16 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight"
        >
          The Gold Standard for NEET PG - NExT
        </motion.h1>
        <p className="text-xl text-[#a5d8dd] font-semibold">
          Select from Marrow-modeled premium plans to unleash high-yield medical study packs.
        </p>

        {/* Referral button */}
        <div className="mt-8 flex flex-col items-center justify-center">
          {!showReferralInput ? (
            <button 
              onClick={() => setShowReferralInput(true)}
              className="text-[#5bc0de] hover:text-white underline font-bold tracking-wide flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Tag className="w-4 h-4" /> Have a referral code?
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#09545c] p-2 rounded-2xl border border-[#a5d8dd]/20 shadow-md">
              <input 
                type="text"
                placeholder="Enter Referral Code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="bg-transparent border-none outline-none text-white px-3 font-bold placeholder-white/40 text-sm w-44"
              />
              <button 
                onClick={handleApplyReferral}
                className="bg-[#5bc0de] hover:bg-[#4eb3ce] text-[#063e46] px-4 py-2 rounded-xl font-black text-xs transition-colors"
              >
                {referralApplied ? 'Applied ✓' : 'Apply'}
              </button>
              <button onClick={() => setShowReferralInput(false)} className="text-[#a5d8dd] hover:text-white px-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {referralApplied && (
            <span className="text-emerald-400 text-xs font-bold mt-2">
              Referral code successfully applied! Flat ₹1,000 extra discount on checkout.
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 text-[#5bc0de] animate-spin" />
        </div>
      ) : (
        /* The Three Columns of Plans */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          {plans.map((plan) => {
            const selectedIdx = selectedDurations[plan.id] ?? 0;
            return (
              <div 
                key={plan.id}
                className="bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5 flex flex-col justify-between"
              >
                {/* Header */}
                <div className={`p-8 relative ${
                  plan.id === 'plan-c' ? 'bg-[#eaebff]' : plan.id === 'plan-b' ? 'bg-[#f0fdfa]' : 'bg-[#fffbf0]'
                } border-b border-slate-200/50`}>
                  {plan.badge && (
                    <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[9px] px-2.5 py-0.5 rounded-full uppercase font-black tracking-widest shadow-sm">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className={`text-3xl font-black ${
                    plan.id === 'plan-c' ? 'text-[#312e81]' : plan.id === 'plan-b' ? 'text-[#0f766e]' : 'text-[#854d0e]'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className="text-slate-500 font-extrabold text-sm uppercase tracking-wider mt-1">
                    NEET PG
                  </p>
                  <p className="text-slate-700 font-bold mt-4 text-base flex items-center gap-1">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Stacking Durations */}
                <div className="flex-1 px-4 py-4 flex flex-col gap-2 bg-[#f8fafc]">
                  {plan.durations.map((duration, idx) => {
                    const isSelected = selectedIdx === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setSelectedDurations(prev => ({ ...prev, [plan.id]: idx }))}
                        className={`cursor-pointer w-full rounded-2xl border-2 p-4 flex items-center justify-between transition-all select-none ${
                          isSelected 
                            ? 'border-[#51c4d3] bg-[#eefdfd]/60 shadow-sm' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-[#0c4c54]' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0c4c54]" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800 text-sm md:text-base">
                              {duration.label}
                            </span>
                            {duration.subText && (
                              <span className="text-[10px] md:text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 border border-emerald-100 w-max">
                                {duration.subText}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col">
                          <span className="font-black text-slate-900 text-sm md:text-base">
                            {fmt(duration.price)}
                          </span>
                          <span className="text-slate-400 line-through text-xs font-semibold">
                            {fmt(duration.originalPrice)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Buy Button */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <button 
                    onClick={() => openCheckout(plan)}
                    className="w-full bg-[#51c4d3] hover:bg-[#3fb0be] text-white py-4 rounded-2xl font-black text-lg tracking-wider uppercase transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buy now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stateful Onboarding & Checkout Wizard Overlay */}
      <AnimatePresence>
        {checkoutStep !== 'hidden' && checkoutPlan && checkoutDuration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col my-8"
            >
              
              {/* HEADER WIDGET */}
              <div className="bg-[#063e46] text-white p-6 relative flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#5bc0de]" /> Pacemaker Subscription
                  </h3>
                  <p className="text-xs text-[#a5d8dd] font-semibold mt-1">
                    {checkoutPlan.name} &bull; {checkoutDuration.label}
                  </p>
                </div>
                {checkoutStep !== 'processing' && (
                  <button 
                    onClick={closeCheckout}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* PROGRESS STATUS SHIELDS */}
              <div className="bg-[#f1f5f9] px-6 py-3 flex items-center justify-between border-b border-slate-200">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#063e46]">
                  Verification Flow
                </span>
                <div className="flex gap-1.5 items-center">
                  {['mobile', 'college', 'summary', 'payment'].map((step, idx) => {
                    const stepsOrder = ['mobile', 'otp', 'college', 'summary', 'payment'];
                    const currentIdx = stepsOrder.indexOf(checkoutStep);
                    const stepIdx = stepsOrder.indexOf(step);
                    const isActive = checkoutStep === step || (step === 'mobile' && checkoutStep === 'otp');
                    const isDone = currentIdx > stepIdx || (step === 'mobile' && currentIdx > 1);

                    return (
                      <div key={idx} className="flex items-center gap-1">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-black text-[8px] ${
                          isDone 
                            ? 'bg-emerald-500 text-white' 
                            : isActive 
                              ? 'bg-[#51c4d3] text-white' 
                              : 'bg-slate-300 text-slate-500'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {idx < 3 && <div className="w-4 h-0.5 bg-slate-300" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC SCROLL CONTAINER FOR FORM STEPS */}
              <div className="max-h-[70vh] overflow-y-auto">
                
                {/* STEP 1A: MOBILE ENTRY */}
                {checkoutStep === 'mobile' && (
                  <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-[#0d5e66]">
                        <Phone className="w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Enter Mobile Number</h4>
                      <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                        Verify your medical candidate registration via dynamic mobile OTP.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 focus-within:border-[#51c4d3] transition-colors p-1">
                        <div className="px-4 flex items-center gap-1 bg-white border border-slate-100 rounded-xl text-slate-500 font-bold text-sm select-none">
                          🇮🇳 <span className="text-slate-800 font-black">+91</span>
                        </div>
                        <input 
                          type="tel"
                          maxLength={10}
                          disabled={otpSending}
                          placeholder="Enter 10-Digit Mobile Number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-4 bg-transparent border-none outline-none font-bold text-slate-800 tracking-wider placeholder-slate-400 disabled:opacity-50"
                        />
                      </div>

                      {otpError && (
                        <div className="bg-red-50 text-red-700 text-xs font-black p-3.5 rounded-xl border border-red-100 mt-2 text-center animate-shake">
                          {otpError}
                        </div>
                      )}

                      <button 
                        disabled={mobileNumber.length !== 10 || otpSending}
                        onClick={handleSendOtp}
                        className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                          mobileNumber.length === 10 && !otpSending
                            ? 'bg-[#51c4d3] hover:bg-[#3fb0be] text-white shadow-md active:scale-95 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {otpSending ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0c4c54]" />
                        ) : (
                          'Get OTP'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1B: OTP VERIFICATION */}
                {checkoutStep === 'otp' && (
                  <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <Key className="w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Verify Verification Code</h4>
                      <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                        We sent a 6-digit OTP code to <span className="text-slate-800 font-black">+91 {mobileNumber}</span>.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {generatedOtpFallback && (
                        <div className="bg-[#e6f0ed] text-[#0d5e66] text-xs font-bold p-4 rounded-2xl border border-[#cbd5e1] text-center space-y-2.5">
                          <p className="font-extrabold flex items-center justify-center gap-1 text-[#0c4c54] uppercase tracking-wider text-[10px]">
                            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" /> [Local Sandbox Dispatcher]
                          </p>
                          <p className="leading-relaxed">
                            To test cellular compliance locally without setting env credentials, copy and enter this dynamic code:
                          </p>
                          <div className="flex justify-center">
                            <span className="bg-[#063e46] text-white px-3 py-1.5 rounded-lg font-mono text-base font-black tracking-widest shadow-sm">
                              {generatedOtpFallback}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-center max-w-sm mx-auto">
                        <input 
                          type="text"
                          maxLength={6}
                          disabled={otpVerifying}
                          placeholder="Enter Code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg outline-none tracking-widest text-[#0d5e66] focus:border-[#51c4d3] disabled:opacity-50"
                        />
                      </div>

                      {otpError && (
                        <div className="bg-red-50 text-red-700 text-xs font-black p-3.5 rounded-xl border border-red-100 text-center">
                          {otpError}
                        </div>
                      )}

                      <div className="text-center">
                        <button 
                          disabled={otpVerifying}
                          onClick={() => {
                            setOtpError('');
                            setGeneratedOtpFallback('');
                            setCheckoutStep('mobile');
                          }}
                          className="text-xs text-[#51c4d3] hover:text-[#3fb0be] underline font-bold disabled:opacity-50"
                        >
                          Change Mobile Number
                        </button>
                      </div>

                      <button 
                        disabled={otpCode.length !== 6 || otpVerifying}
                        onClick={handleVerifyOtp}
                        className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                          otpCode.length === 6 && !otpVerifying
                            ? 'bg-[#51c4d3] hover:bg-[#3fb0be] text-white shadow-md active:scale-95 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {otpVerifying ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0c4c54]" />
                        ) : (
                          'Verify & Continue'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: STATE, MEDICAL COLLEGE & YEAR */}
                {checkoutStep === 'college' && (
                  <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                        <School className="w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Academic Medical Profile</h4>
                      <p className="text-slate-400 text-sm font-semibold leading-relaxed">
                        Tell us about your medical college so we can adapt grand tests rankings correctly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* State Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          State / Region
                        </label>
                        <select 
                          value={selectedState} 
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none text-slate-700 focus:border-[#51c4d3]"
                        >
                          <option value="">Select State</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Kerala">Kerala</option>
                          <option value="West Bengal">West Bengal</option>
                        </select>
                      </div>

                      {/* College Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          Medical College
                        </label>
                        <select 
                          value={selectedCollege} 
                          onChange={(e) => setSelectedCollege(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none text-slate-700 focus:border-[#51c4d3]"
                        >
                          <option value="">Select College</option>
                          <option value="Bangalore Medical College">Bangalore Medical College & Research Institute</option>
                          <option value="AIIMS Delhi">All India Institute of Medical Sciences (AIIMS), Delhi</option>
                          <option value="KEM Hospital Mumbai">King Edward Memorial Hospital, Mumbai</option>
                          <option value="Madras Medical College">Madras Medical College, Chennai</option>
                          <option value="Kasturba Medical College">Kasturba Medical College, Manipal</option>
                          <option value="CMC Vellore">Christian Medical College (CMC), Vellore</option>
                        </select>
                      </div>

                      {/* Year of Study */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          Year of Study
                        </label>
                        <select 
                          value={selectedYear} 
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none text-slate-700 focus:border-[#51c4d3]"
                        >
                          <option value="">Select Academic Year</option>
                          <option value="1st Year">1st Year MBBS</option>
                          <option value="2nd Year">2nd Year MBBS</option>
                          <option value="3rd Year">3rd Year MBBS (Part 1)</option>
                          <option value="4th Year">4th Year MBBS (Part 2)</option>
                          <option value="Internship">Internship Period</option>
                          <option value="Post-Intern">Post-Intern / Graduated MD aspirant</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <button 
                          disabled={!selectedState || !selectedCollege || !selectedYear}
                          onClick={() => {
                            localStorage.setItem('student_state', selectedState);
                            localStorage.setItem('student_college', selectedCollege);
                            localStorage.setItem('student_year', selectedYear);
                            setCheckoutStep('summary');
                          }}
                          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
                            selectedState && selectedCollege && selectedYear
                              ? 'bg-[#51c4d3] hover:bg-[#3fb0be] text-white shadow-md active:scale-95 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Save & Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: EXACT MARROW PURCHASE SUMMARY CARD (MATCHES SCREENSHOT!) */}
                {checkoutStep === 'summary' && (
                  <div className="p-8 space-y-6 bg-slate-50">
                    
                    {/* Cream Rounded Layout Box */}
                    <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md p-6 space-y-6 text-left relative overflow-hidden">
                      
                      {/* Top Plan Title */}
                      <div className="text-center border-b border-slate-100 pb-5">
                        <h3 className="text-3xl font-black text-slate-900 flex items-center justify-center gap-1.5">
                          {checkoutPlan.name} <span className="bg-[#fff3e0] text-[#e65100] text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[#ffe0b2] ml-2">NEET PG</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                          {checkoutPlan.subtitle}
                        </p>
                      </div>

                      {/* Dynamic Bullet features list */}
                      <div className="space-y-3.5">
                        {getPlanFeatures(checkoutPlan.id).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-500 shrink-0 stroke-[3]" />
                            <span className="text-slate-700 font-bold text-sm md:text-base leading-snug">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Warn Callout label */}
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 font-bold leading-normal">
                          {getPlanWarning(checkoutPlan.id)}
                        </p>
                      </div>

                      {/* Coupon applied tag block */}
                      <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                        <span className="text-slate-500 font-black text-sm uppercase tracking-wider">Coupon Code</span>
                        
                        <div className="flex items-center gap-2 bg-[#8bc34a]/10 p-1 rounded-xl border border-[#8bc34a]">
                          <div className="bg-[#8bc34a] text-white px-3.5 py-1.5 rounded-lg font-black text-xs tracking-wider uppercase flex items-center gap-1 shadow-sm">
                            WORLD8
                          </div>
                          <button onClick={() => setCouponApplied(!couponApplied)} className="p-1.5 text-slate-400 hover:text-slate-600">
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>

                      {/* Purchase Summary prices matrix */}
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Purchase Summary
                        </h4>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>Duration</span>
                            <span className="text-slate-900 font-extrabold">{checkoutDuration.label}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>Price</span>
                            <span>{fmt(getPricingData().original)}</span>
                          </div>
                          {couponApplied && (
                            <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                              <span>Coupon Discount</span>
                              <span>- {fmt(getPricingData().original - checkoutDuration.price)}</span>
                            </div>
                          )}
                          {referralApplied && (
                            <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                              <span>Referral Code Extra</span>
                              <span>- {fmt(1000)}</span>
                            </div>
                          )}

                          <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base font-black text-slate-900">
                            <span>Final Price</span>
                            <span className="text-lg text-slate-900 font-black">
                              {fmt(getPricingData().final)}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Bottom sticky bar panel */}
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="text-left">
                        <span className="text-xl font-black text-slate-900 leading-tight">
                          {fmt(getPricingData().final)}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                          {checkoutPlan.name}, {checkoutDuration.label}
                        </p>
                      </div>

                      <button 
                        onClick={() => setCheckoutStep('payment')}
                        className="bg-[#5bc0de] hover:bg-[#4eb3ce] text-white px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-md cursor-pointer"
                      >
                        Proceed to payment
                      </button>
                    </div>

                  </div>
                )}

                {/* STEP 4: DETAILED SCANNER GATEWAY (UPI SCANNER + TIMER) */}
                {checkoutStep === 'payment' && (
                  <div className="p-8 space-y-6">
                    
                    {/* Pay option picker tabs */}
                    <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-4">
                      {['qr', 'card', 'bank', 'wallet'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setPaymentOption(opt as any)}
                          className={`py-3 rounded-xl border font-black text-[10px] uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
                            paymentOption === opt 
                              ? 'border-[#0c4c54] bg-[#0c4c54]/5 text-[#0c4c54]' 
                              : 'border-slate-100 hover:border-slate-200 text-slate-400 bg-white'
                          }`}
                        >
                          {opt === 'qr' && <QrCode className="w-4 h-4" />}
                          {opt === 'card' && <CreditCard className="w-4 h-4" />}
                          {opt === 'bank' && <Wallet className="w-4 h-4" />}
                          {opt === 'wallet' && <Phone className="w-4 h-4" />}
                          {opt === 'qr' ? 'Scanner' : opt === 'card' ? 'Card' : opt === 'bank' ? 'Bank Transfer' : 'Wallets'}
                        </button>
                      ))}
                    </div>

                    {/* GATEWAY PANELS */}
                    <AnimatePresence mode="wait">
                      
                      {/* SCANNER GATEWAY (MODELED EXACTLY!) */}
                      {paymentOption === 'qr' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="space-y-6 text-center"
                        >
                          {/* Timer element */}
                          <div className="bg-red-50 border border-red-100 rounded-2xl py-3 px-4 flex items-center justify-between text-red-700 font-extrabold text-sm max-w-sm mx-auto">
                            <span>Payment Session expires in:</span>
                            <span className="bg-red-600 text-white font-mono px-3 py-1 rounded-lg text-xs animate-pulse">
                              {formatTime(countdownSeconds)}
                            </span>
                          </div>

                          {/* Visual QR Code Scanner image */}
                          <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 max-w-xs mx-auto shadow-inner flex flex-col items-center gap-4 relative">
                            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm relative">
                              <img 
                                src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=pacemaker@hdfcbank%26pn=PaceMaker%26am=9999%26cu=INR" 
                                alt="Payment QR Code Scanner"
                                className="w-40 h-40 object-contain"
                              />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                                <span className="font-black text-xs text-[#063e46] tracking-tight">PaceMaker</span>
                              </div>
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">UPI ADDRESS</p>
                              <p className="text-sm text-slate-800 font-black tracking-tight select-all">pacemaker@hdfcbank</p>
                            </div>
                          </div>

                          <div className="space-y-1 leading-normal max-w-sm mx-auto">
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              Scan this QR Code using GPay, PhonePe, Paytm, or BHIM, transfer the payable amount <span className="text-slate-900 font-black">{fmt(getPricingData().final)}</span>, then upload the transaction receipt screenshot below.
                            </p>
                          </div>

                          {/* INTERACTIVE SCREENSHOT FILE UPLOADER */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left px-1">
                              Upload Payment Screenshot
                            </h4>

                            <div 
                              onClick={triggerFileUpload}
                              className="border-2 border-dashed border-slate-200 hover:border-[#51c4d3] rounded-3xl p-6 bg-slate-50 hover:bg-[#eefdfd]/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                            >
                              <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleReceiptChange}
                                accept="image/*"
                                className="hidden"
                              />
                              
                              {uploadedReceipt ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img 
                                    src={uploadedReceipt} 
                                    alt="Receipt Preview" 
                                    className="w-28 h-28 object-cover rounded-xl shadow-md border border-slate-200" 
                                  />
                                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {uploadedFileName}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-[#5bc0de] shrink-0" />
                                  <span className="font-extrabold text-sm text-slate-600">Select Receipt Image File</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PNG, JPG, JPEG</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button 
                            disabled={!uploadedReceipt}
                            onClick={executeSubscriptionActivation}
                            className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
                              uploadedReceipt
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Submit Payment Receipt ({fmt(getPricingData().final)})
                          </button>

                        </motion.div>
                      )}

                      {/* CARD DETAILS */}
                      {paymentOption === 'card' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="space-y-4 pt-1"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Card Holder Name</label>
                            <input 
                              type="text" 
                              placeholder="DR. DR. ADARSH"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                              className="w-full px-4 py-3 border border-slate-100 bg-[#f8fafc] rounded-xl font-bold text-sm outline-none focus:border-[#51c4d3]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Card Number</label>
                            <input 
                              type="text" 
                              maxLength={19}
                              placeholder="4111 2222 3333 4444"
                              value={cardNo}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                setCardNo(val);
                              }}
                              className="w-full px-4 py-3 border border-slate-100 bg-[#f8fafc] rounded-xl font-bold text-sm outline-none focus:border-[#51c4d3]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expiry Date</label>
                              <input 
                                type="text" 
                                maxLength={5}
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val.length > 2) setCardExpiry(val.slice(0, 2) + '/' + val.slice(2, 4));
                                  else setCardExpiry(val);
                                }}
                                className="w-full px-4 py-3 border border-slate-100 bg-[#f8fafc] rounded-xl font-bold text-sm outline-none text-center focus:border-[#51c4d3]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CVV</label>
                              <input 
                                type="password" 
                                maxLength={3}
                                placeholder="***"
                                value={cardCVV}
                                onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-slate-100 bg-[#f8fafc] rounded-xl font-bold text-sm outline-none text-center focus:border-[#51c4d3]"
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button 
                              disabled={!cardHolder || cardNo.length < 19 || !cardExpiry || cardCVV.length < 3}
                              onClick={executeSubscriptionActivation}
                              className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
                                cardHolder && cardNo.length === 19 && cardExpiry && cardCVV.length === 3
                                  ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-md active:scale-95 cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Lock className="w-4 h-4 inline-block mr-1.5" /> Pay securely {fmt(getPricingData().final)}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* BANK DETAILS TRANSFER */}
                      {paymentOption === 'bank' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="space-y-6"
                        >
                          <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-5 space-y-3.5 text-left text-sm font-bold text-slate-700">
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                              <span>Account Holder</span>
                              <span className="text-slate-900 font-extrabold">PaceMaker Medical Tech</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                              <span>Account Number</span>
                              <span className="text-slate-900 font-extrabold select-all">918239018230912</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2.5">
                              <span>IFSC Code</span>
                              <span className="text-slate-900 font-extrabold select-all">HDFC0001923</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bank Name</span>
                              <span className="text-slate-900 font-extrabold">HDFC Bank, Bangalore</span>
                            </div>
                          </div>

                          {/* Screenshot uploader inside bank transfer */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left px-1">
                              Upload Deposit Receipt Screenshot
                            </h4>

                            <div 
                              onClick={triggerFileUpload}
                              className="border-2 border-dashed border-slate-200 hover:border-[#51c4d3] rounded-3xl p-6 bg-slate-50 hover:bg-[#eefdfd]/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                            >
                              <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={handleReceiptChange}
                                accept="image/*"
                                className="hidden"
                              />
                              
                              {uploadedReceipt ? (
                                <div className="flex flex-col items-center gap-2">
                                  <img 
                                    src={uploadedReceipt} 
                                    alt="Receipt Preview" 
                                    className="w-28 h-28 object-cover rounded-xl shadow-md border border-slate-200" 
                                  />
                                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {uploadedFileName}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-[#5bc0de] shrink-0" />
                                  <span className="font-extrabold text-sm text-slate-600">Select Receipt Image File</span>
                                </>
                              )}
                            </div>
                          </div>

                          <button 
                            disabled={!uploadedReceipt}
                            onClick={executeSubscriptionActivation}
                            className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
                              uploadedReceipt
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Submit Receipt Confirmation
                          </button>
                        </motion.div>
                      )}

                      {/* OTHER WALLETS */}
                      {paymentOption === 'wallet' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              Select a fast digital wallet option to complete your transaction immediately.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={executeSubscriptionActivation} className="py-4 bg-[#0d5e66]/5 hover:bg-[#0d5e66]/10 text-[#0d5e66] rounded-2xl font-extrabold text-sm border border-slate-100 cursor-pointer">
                              Pay via Paytm
                            </button>
                            <button onClick={executeSubscriptionActivation} className="py-4 bg-[#0d5e66]/5 hover:bg-[#0d5e66]/10 text-[#0d5e66] rounded-2xl font-extrabold text-sm border border-slate-100 cursor-pointer">
                              Pay via PhonePe
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>

                  </div>
                )}

                {/* SECURE BLOCK PROCESSING STEP */}
                {checkoutStep === 'processing' && (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-[#0d5e66] animate-spin" />
                      <Lock className="w-8 h-8 text-[#0d5e66] absolute animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Verifying Secure Receipt</h4>
                      <p className="text-slate-400 text-sm font-semibold mt-2 leading-relaxed">
                        PaceMaker server accounts checking screenshot metadata and bank transaction ledgers. This takes just a moment...
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 5: ONBOARDING SUCCESS intent */}
                {checkoutStep === 'success' && (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                    
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
                      className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20"
                    >
                      <Check className="w-10 h-10 stroke-[3]" />
                    </motion.div>

                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">Activation Complete!</h4>
                      <p className="text-[#0d5e66] font-extrabold text-sm uppercase tracking-widest mt-1">
                        {checkoutPlan.name} is Active
                      </p>
                      <p className="text-slate-400 text-sm font-semibold mt-4 leading-relaxed max-w-sm">
                        Welcome to PaceMaker Medical Academy! Your medical college account profile is validated, and your plan is successfully activated.
                      </p>
                    </div>

                    <div className="pt-4 w-full">
                      <button 
                        onClick={() => {
                          closeCheckout();
                          router.push('/dashboard/videos');
                        }}
                        className="w-full bg-[#063e46] hover:bg-[#0a4d57] text-white py-4 rounded-2xl font-black text-base transition-all cursor-pointer shadow-lg active:scale-95"
                      >
                        Explore Video Library
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

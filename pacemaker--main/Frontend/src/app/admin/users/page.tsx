'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, Filter, ShieldCheck, Mail, Phone, 
  Download, Clock, ArrowRight, Eye, Calendar, Plus, Trash2, Edit2, 
  ShieldAlert, Award, FileSpreadsheet, ChevronLeft, ChevronRight, Check, X,
  ShieldX, Ban, UserCheck, CreditCard, BookOpen, UserMinus, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';

// TypeScript Types
type UserRole = 'student' | 'instructor' | 'admin';
type UserStatus = 'active' | 'disabled';

interface ActivityLogItem {
  timestamp: string;
  action: string;
  ipAddress: string;
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'paid' | 'refunded' | 'failed';
}

interface CourseDetailItem {
  id: string;
  title: string;
  progress: number;
  joined: string;
}

interface PaceMakerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  phone?: string;
  enrolledCourses: string[]; // course IDs
  totalSpent: number;
  disableReason?: string;
  
  // Custom Detailed Data for tabs
  activityLog?: ActivityLogItem[];
  coursesDetail?: CourseDetailItem[];
  paymentHistory?: PaymentHistoryItem[];
}

// Initial Mock Users
const INITIAL_MOCK_USERS: PaceMakerUser[] = [
  {
    id: "u001",
    name: "Dr. Sarah Johnson",
    email: "sarah@example.com",
    role: "instructor",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-01-15",
    lastActive: "2026-05-25",
    phone: "+91 98765 43210",
    enrolledCourses: ["c001", "c002"],
    totalSpent: 4999,
    activityLog: [
      { timestamp: "2026-05-25 14:10", action: "Logged in successfully", ipAddress: "192.168.1.50" },
      { timestamp: "2026-05-24 10:15", action: "Uploaded Live Q&A Session Video", ipAddress: "192.168.1.50" },
      { timestamp: "2026-05-22 16:45", action: "Reviewed Exam Builder Test Anatomy I", ipAddress: "192.168.1.32" }
    ],
    coursesDetail: [
      { id: "c001", title: "Comprehensive Human Anatomy Masterclass", progress: 95, joined: "2026-01-16" },
      { id: "c002", title: "Cardiovascular Physiology & Clinical ECG", progress: 80, joined: "2026-02-01" }
    ],
    paymentHistory: [
      { id: "p001", date: "2026-01-15", amount: 2999, method: "Credit Card", status: "paid" },
      { id: "p002", date: "2026-02-01", amount: 2000, method: "UPI", status: "paid" }
    ]
  },
  {
    id: "u002",
    name: "Dr. Amit Patel",
    email: "amit.patel@example.com",
    role: "instructor",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-02-10",
    lastActive: "2026-05-24",
    phone: "+91 91234 56789",
    enrolledCourses: ["c003"],
    totalSpent: 2499,
    activityLog: [
      { timestamp: "2026-05-24 09:30", action: "Logged in successfully", ipAddress: "203.0.113.41" },
      { timestamp: "2026-05-20 18:02", action: "Published Neurology Quiz Challenge", ipAddress: "203.0.113.41" }
    ],
    coursesDetail: [
      { id: "c003", title: "Advanced Neuroanatomy & Synaptic Pathways", progress: 100, joined: "2026-02-11" }
    ],
    paymentHistory: [
      { id: "p003", date: "2026-02-10", amount: 2499, method: "Net Banking", status: "paid" }
    ]
  },
  {
    id: "u003",
    name: "Dr. Rajesh Sharma",
    email: "admin@pacemaker.com",
    role: "admin",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-01-01",
    lastActive: "2026-05-25",
    phone: "+91 99999 88888",
    enrolledCourses: [],
    totalSpent: 0,
    activityLog: [
      { timestamp: "2026-05-25 12:00", action: "Super Admin dashboard accessed", ipAddress: "103.44.52.12" },
      { timestamp: "2026-05-25 08:30", action: "System health check initiated", ipAddress: "127.0.0.1" },
      { timestamp: "2026-05-22 11:22", action: "Approved 4 Instructor Requests", ipAddress: "103.44.52.12" }
    ],
    coursesDetail: [],
    paymentHistory: []
  },
  {
    id: "u004",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    role: "student",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-03-01",
    lastActive: "2026-05-23",
    phone: "+91 88776 65544",
    enrolledCourses: ["c001", "c003", "c004"],
    totalSpent: 8997,
    activityLog: [
      { timestamp: "2026-05-23 21:40", action: "Attempted Neurology Quiz 1", ipAddress: "192.168.4.15" },
      { timestamp: "2026-05-23 20:00", action: "Completed Module 3 of Anatomy Masterclass", ipAddress: "192.168.4.15" },
      { timestamp: "2026-05-18 19:15", action: "Enrolled in Forensic Medicine Primer", ipAddress: "192.168.4.15" }
    ],
    coursesDetail: [
      { id: "c001", title: "Comprehensive Human Anatomy Masterclass", progress: 68, joined: "2026-03-01" },
      { id: "c003", title: "Advanced Neuroanatomy & Synaptic Pathways", progress: 40, joined: "2026-03-15" },
      { id: "c004", title: "Forensic Medicine & Toxicology Basics", progress: 10, joined: "2026-05-18" }
    ],
    paymentHistory: [
      { id: "p004", date: "2026-03-01", amount: 2999, method: "UPI", status: "paid" },
      { id: "p005", date: "2026-03-15", amount: 2499, method: "UPI", status: "paid" },
      { id: "p006", date: "2026-05-18", amount: 3499, method: "Credit Card", status: "paid" }
    ]
  },
  {
    id: "u005",
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    role: "student",
    status: "disabled",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-02-18",
    lastActive: "2026-04-12",
    phone: "+91 97766 55443",
    enrolledCourses: ["c002"],
    totalSpent: 1999,
    disableReason: "Violation of terms of service: Multiple concurrent logins detected from different cities within a 5-minute span.",
    activityLog: [
      { timestamp: "2026-04-12 23:45", action: "Account flagged for suspicious concurrent login", ipAddress: "198.51.100.2" },
      { timestamp: "2026-04-12 23:43", action: "Logged in from Mumbai, India", ipAddress: "103.22.45.1" },
      { timestamp: "2026-04-12 23:40", action: "Logged in from London, UK", ipAddress: "198.51.100.2" }
    ],
    coursesDetail: [
      { id: "c002", title: "Cardiovascular Physiology & Clinical ECG", progress: 24, joined: "2026-02-18" }
    ],
    paymentHistory: [
      { id: "p007", date: "2026-02-18", amount: 1999, method: "UPI", status: "paid" }
    ]
  },
  {
    id: "u006",
    name: "Dr. Emily Stone",
    email: "emily.stone@example.com",
    role: "student",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-04-05",
    lastActive: "2026-05-25",
    phone: "+1 (555) 321-4567",
    enrolledCourses: ["c004"],
    totalSpent: 2999,
    activityLog: [
      { timestamp: "2026-05-25 09:12", action: "Completed Lecture 5: DNA Profiling", ipAddress: "18.220.10.4" },
      { timestamp: "2026-05-24 14:22", action: "Logged in successfully", ipAddress: "18.220.10.4" }
    ],
    coursesDetail: [
      { id: "c004", title: "Forensic Medicine & Toxicology Basics", progress: 52, joined: "2026-04-05" }
    ],
    paymentHistory: [
      { id: "p008", date: "2026-04-05", amount: 2999, method: "Credit Card", status: "paid" }
    ]
  },
  {
    id: "u007",
    name: "Dr. Michael Chang",
    email: "m.chang@example.com",
    role: "instructor",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1582750433449-64c024716c17?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-03-22",
    lastActive: "2026-05-20",
    phone: "+1 (555) 765-4321",
    enrolledCourses: ["c005"],
    totalSpent: 3499,
    activityLog: [
      { timestamp: "2026-05-20 15:45", action: "Modified Lecture Materials: Surgical Suturing", ipAddress: "192.0.2.14" },
      { timestamp: "2026-05-15 11:30", action: "Logged in successfully", ipAddress: "192.0.2.14" }
    ],
    coursesDetail: [
      { id: "c005", title: "Essential Surgical Techniques & Suturing Lab", progress: 90, joined: "2026-03-22" }
    ],
    paymentHistory: [
      { id: "p009", date: "2026-03-22", amount: 3499, method: "Credit Card", status: "paid" }
    ]
  },
  {
    id: "u008",
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    role: "student",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1614644147724-2d4785d69962?auto=format&fit=crop&q=80&w=300",
    joinedDate: "2026-05-02",
    lastActive: "2026-05-25",
    phone: "+91 81234 56780",
    enrolledCourses: ["c001", "c005"],
    totalSpent: 6498,
    activityLog: [
      { timestamp: "2026-05-25 13:40", action: "Submitted Assignment: Suturing Lab Part 1", ipAddress: "115.110.222.18" },
      { timestamp: "2026-05-25 11:02", action: "Enrolled in Anatomy Masterclass", ipAddress: "115.110.222.18" },
      { timestamp: "2026-05-25 11:00", action: "Logged in successfully", ipAddress: "115.110.222.18" }
    ],
    coursesDetail: [
      { id: "c001", title: "Comprehensive Human Anatomy Masterclass", progress: 2, joined: "2026-05-25" },
      { id: "c005", title: "Essential Surgical Techniques & Suturing Lab", progress: 35, joined: "2026-05-02" }
    ],
    paymentHistory: [
      { id: "p010", date: "2026-05-02", amount: 3499, method: "UPI", status: "paid" },
      { id: "p011", date: "2026-05-25", amount: 2999, method: "UPI", status: "paid" }
    ]
  }
];

function AdminUsersManagementPage() {
  // --- Core States ---
  const [users, setUsers] = useState<PaceMakerUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filters and Sorting
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState<'name' | 'joinedDate' | 'lastActive'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals & Drawers
  const [selectedUserDetails, setSelectedUserDetails] = useState<PaceMakerUser | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<'profile' | 'activity' | 'courses' | 'payments'>('profile');
  
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'student' as UserRole, sendEmail: true });
  
  const [roleModalUser, setRoleModalUser] = useState<PaceMakerUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('student');
  
  const [disableModalUser, setDisableModalUser] = useState<PaceMakerUser | null>(null);
  const [disableReasonInput, setDisableReasonInput] = useState('');
  
  const [deleteModalUser, setDeleteModalUser] = useState<PaceMakerUser | null>(null);
  
  // Bulk Actions Modal states
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [bulkActionTargetRole, setBulkActionTargetRole] = useState<UserRole>('student');
  const [bulkActionConfirmOpen, setBulkActionConfirmOpen] = useState(false);
  
  // Custom toast notifications for visual polish
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'warning' | 'error'; message: string }[]>([]);

  // Show visual feedback toast
  const triggerToast = (type: 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Real-time Debouncing ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, dateRange, itemsPerPage]);

  // --- Initialize and Synchronize with LocalStorage ---
  useEffect(() => {
    const loadUsersData = () => {
      try {
        // Fetch registeredUsers from LocalStorage
        const storedAuthStr = localStorage.getItem('registeredUsers');
        let parsedAuth: any = {};
        
        if (storedAuthStr) {
          try {
            parsedAuth = JSON.parse(storedAuthStr);
          } catch (e) {
            console.error("Failed to parse registeredUsers", e);
          }
        }
        
        // Let's create an enriched list that merges both INITIAL_MOCK_USERS and parsedAuth
        const enrichedUsersMap = new Map<string, PaceMakerUser>();

        // Pre-populate mock users
        INITIAL_MOCK_USERS.forEach(user => {
          enrichedUsersMap.set(user.email.toLowerCase(), user);
        });

        // Overlay existing real registrations on top
        Object.keys(parsedAuth).forEach((emailKey) => {
          const authUser = parsedAuth[emailKey];
          const emailLower = emailKey.toLowerCase();
          
          const existingMock = enrichedUsersMap.get(emailLower);
          
          const joinedDate = authUser.registeredAt ? authUser.registeredAt.split('T')[0] : (existingMock?.joinedDate || new Date().toISOString().split('T')[0]);
          const lastActive = existingMock?.lastActive || joinedDate;
          
          enrichedUsersMap.set(emailLower, {
            id: existingMock?.id || `u_${Math.random().toString(36).substr(2, 6)}`,
            name: authUser.fullName || authUser.name || existingMock?.name || emailKey.split('@')[0],
            email: authUser.email || emailKey,
            role: authUser.role || existingMock?.role || 'student',
            status: authUser.status === 'pending' ? 'active' : (authUser.status === 'rejected' ? 'disabled' : (authUser.status || existingMock?.status || 'active')),
            avatar: existingMock?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName || emailKey.split('@')[0])}&background=0d9488&color=fff&bold=true`,
            joinedDate: joinedDate,
            lastActive: lastActive,
            phone: authUser.phone || existingMock?.phone || '',
            enrolledCourses: existingMock?.enrolledCourses || [],
            totalSpent: existingMock?.totalSpent || 0,
            activityLog: existingMock?.activityLog || [
              { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: "User session registered", ipAddress: "127.0.0.1" }
            ],
            coursesDetail: existingMock?.coursesDetail || [],
            paymentHistory: existingMock?.paymentHistory || [],
            disableReason: authUser.disableReason || existingMock?.disableReason || ''
          });
        });

        const finalList = Array.from(enrichedUsersMap.values());
        setUsers(finalList);

        // Sync back to local storage if it was empty so other sections see the same database!
        if (!storedAuthStr) {
          const syncToAuth: any = {};
          finalList.forEach(u => {
            syncToAuth[u.email] = {
              email: u.email,
              firstName: u.name.split(' ')[0],
              lastName: u.name.split(' ').slice(1).join(' ') || '',
              fullName: u.name,
              role: u.role,
              status: u.status === 'disabled' ? 'rejected' : 'approved',
              registeredAt: new Date(u.joinedDate).toISOString()
            };
          });
          localStorage.setItem('registeredUsers', JSON.stringify(syncToAuth));
        }

      } catch (e) {
        console.error("Local storage error:", e);
        setUsers(INITIAL_MOCK_USERS);
      }
    };

    loadUsersData();
    const timer = setTimeout(() => setIsLoaded(true), 800);

    const handleStorageChange = () => {
      loadUsersData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // --- Sync Back State Changes helper ---
  const persistUsers = (updatedUsers: PaceMakerUser[]) => {
    setUsers(updatedUsers);
    try {
      const storedAuthStr = localStorage.getItem('registeredUsers') || '{}';
      const storedAuth = JSON.parse(storedAuthStr);

      updatedUsers.forEach(u => {
        // Map states back to authentications schema
        storedAuth[u.email] = {
          ...storedAuth[u.email],
          email: u.email,
          fullName: u.name,
          role: u.role,
          status: u.status === 'disabled' ? 'rejected' : 'approved',
          disableReason: u.disableReason || '',
          registeredAt: new Date(u.joinedDate).toISOString()
        };
      });

      localStorage.setItem('registeredUsers', JSON.stringify(storedAuth));
    } catch (e) {
      console.error("Persistence failed:", e);
    }
  };

  // --- Filtering & Sorting Logic ---
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // 1) Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    }

    // 2) Role Filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // 3) Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }

    // 4) Join Date range filter
    if (dateRange.start) {
      result = result.filter(u => u.joinedDate >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter(u => u.joinedDate <= dateRange.end);
    }

    // 5) Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return 0;
    });

    return result;
  }, [users, debouncedSearch, roleFilter, statusFilter, dateRange, sortField, sortOrder]);

  // --- Pagination Slice ---
  const totalItems = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage, itemsPerPage]);

  // Checkbox management helper
  const handleSelectUser = (email: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleEmails = paginatedUsers.map(u => u.email);
      setSelectedUsers(new Set(visibleEmails));
    } else {
      setSelectedUsers(new Set());
    }
  };

  // --- Stats Calculations ---
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const disabled = users.filter(u => u.status === 'disabled').length;
    
    // Calculate new users registered in the current month (May 2026 based on 2026-05-25 context)
    const currentMonthPrefix = "2026-05";
    const newThisMonth = users.filter(u => u.joinedDate.startsWith(currentMonthPrefix)).length;

    return { total, active, disabled, newThisMonth };
  }, [users]);

  // --- Actions Implementations ---

  // 1) Change Role
  const handleOpenRoleModal = (user: PaceMakerUser) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role);
  };

  const executeChangeRole = () => {
    if (!roleModalUser) return;
    
    const updated = users.map(u => {
      if (u.email === roleModalUser.email) {
        const activity = [
          { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: `Role changed from ${u.role.toUpperCase()} to ${selectedNewRole.toUpperCase()} by Admin`, ipAddress: "127.0.0.1" },
          ...(u.activityLog || [])
        ];
        return { ...u, role: selectedNewRole, activityLog: activity };
      }
      return u;
    });

    persistUsers(updated);
    triggerToast('success', `Changed ${roleModalUser.name}'s role to ${selectedNewRole.toUpperCase()}`);
    setRoleModalUser(null);
  };

  // 2) Disable / Enable User
  const handleOpenDisableModal = (user: PaceMakerUser) => {
    if (user.status === 'active') {
      setDisableModalUser(user);
      setDisableReasonInput('');
    } else {
      // Toggle back to active directly
      executeToggleStatus(user, 'active');
    }
  };

  const executeToggleStatus = (user: PaceMakerUser, targetStatus: UserStatus, reason?: string) => {
    const updated = users.map(u => {
      if (u.email === user.email) {
        const activity = [
          { 
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), 
            action: targetStatus === 'active' ? "Account restored / enabled by Admin" : `Account disabled by Admin. Reason: ${reason || 'Not specified'}`, 
            ipAddress: "127.0.0.1" 
          },
          ...(u.activityLog || [])
        ];
        return { 
          ...u, 
          status: targetStatus, 
          disableReason: targetStatus === 'disabled' ? (reason || 'Admin administrative disable') : '', 
          activityLog: activity 
        };
      }
      return u;
    });

    persistUsers(updated);
    triggerToast(targetStatus === 'active' ? 'success' : 'warning', `${user.name} has been ${targetStatus === 'active' ? 'enabled' : 'disabled'}.`);
    setDisableModalUser(null);
  };

  // 3) Delete User
  const executeDeleteUser = (email: string) => {
    const user = users.find(u => u.email === email);
    if (!user) return;

    // Filter out user from state and persist
    const updated = users.filter(u => u.email !== email);
    setUsers(updated);
    
    // Sync with LocalStorage Auth keys
    try {
      const storedAuthStr = localStorage.getItem('registeredUsers') || '{}';
      const storedAuth = JSON.parse(storedAuthStr);
      delete storedAuth[email];
      localStorage.setItem('registeredUsers', JSON.stringify(storedAuth));
    } catch (e) {
      console.error(e);
    }

    triggerToast('error', `Permanently deleted account of ${user.name}`);
    setSelectedUsers(prev => {
      const next = new Set(prev);
      next.delete(email);
      return next;
    });
    setDeleteModalUser(null);
  };

  // 4) Add New User manually
  const executeAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      triggerToast('error', 'Please fill out all fields.');
      return;
    }

    // Check duplicate
    if (users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase())) {
      triggerToast('error', 'A user with this email address already exists.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newUser: PaceMakerUser = {
      id: `u${Math.floor(100 + Math.random() * 900)}`,
      name: newUserData.name,
      email: newUserData.email.toLowerCase(),
      role: newUserData.role,
      status: 'active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUserData.name)}&background=0d9488&color=fff&bold=true`,
      joinedDate: todayStr,
      lastActive: todayStr,
      phone: '',
      enrolledCourses: [],
      totalSpent: 0,
      activityLog: [
        { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: "Profile manually created by Super Admin", ipAddress: "127.0.0.1" }
      ],
      coursesDetail: [],
      paymentHistory: []
    };

    persistUsers([newUser, ...users]);

    if (newUserData.sendEmail) {
      triggerToast('success', `Sent welcome credentials email to ${newUserData.email}`);
    }

    triggerToast('success', `Created user profile for ${newUserData.name}`);
    setNewUserData({ name: '', email: '', password: '', role: 'student', sendEmail: true });
    setAddUserModalOpen(false);
  };

  // 5) Bulk Actions Execution
  const executeBulkAction = () => {
    if (selectedUsers.size === 0 || !bulkActionType) return;

    let successMessage = '';
    const updated = users.map(u => {
      if (selectedUsers.has(u.email)) {
        let status = u.status;
        let role = u.role;
        let disableReason = u.disableReason;
        const actions = [];

        if (bulkActionType === 'disable') {
          status = 'disabled';
          disableReason = 'Bulk disabled by administrator';
          actions.push({ timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: "Account disabled in bulk operations", ipAddress: "127.0.0.1" });
          successMessage = `Disabled ${selectedUsers.size} selected users`;
        } else if (bulkActionType === 'enable') {
          status = 'active';
          disableReason = '';
          actions.push({ timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: "Account restored in bulk operations", ipAddress: "127.0.0.1" });
          successMessage = `Enabled ${selectedUsers.size} selected users`;
        } else if (bulkActionType === 'change_role') {
          role = bulkActionTargetRole;
          actions.push({ timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), action: `Role bulk changed to ${bulkActionTargetRole.toUpperCase()}`, ipAddress: "127.0.0.1" });
          successMessage = `Promoted ${selectedUsers.size} users to ${bulkActionTargetRole.toUpperCase()}`;
        }

        return {
          ...u,
          status,
          role,
          disableReason,
          activityLog: [...actions, ...(u.activityLog || [])]
        };
      }
      return u;
    });

    if (bulkActionType === 'delete') {
      // Handles delete action
      const remaining = users.filter(u => !selectedUsers.has(u.email));
      
      // Update local auth storage
      try {
        const storedAuthStr = localStorage.getItem('registeredUsers') || '{}';
        const storedAuth = JSON.parse(storedAuthStr);
        selectedUsers.forEach(email => delete storedAuth[email]);
        localStorage.setItem('registeredUsers', JSON.stringify(storedAuth));
      } catch(e) {
        console.error(e);
      }

      setUsers(remaining);
      triggerToast('error', `Permanently deleted ${selectedUsers.size} selected users.`);
    } else {
      persistUsers(updated);
      triggerToast('success', successMessage);
    }

    setSelectedUsers(new Set());
    setBulkActionConfirmOpen(false);
    setBulkActionType('');
  };

  // 6) Export to CSV
  const handleExportCSV = () => {
    try {
      // Build Headers
      const headers = ['User ID', 'Full Name', 'Email Address', 'Role', 'Status', 'Joined Date', 'Last Active Date', 'Total Courses Enrolled', 'Total Spent ($)'];
      
      // Convert current filtered items into CSV rows
      const rows = filteredAndSortedUsers.map(u => [
        u.id,
        `"${u.name}"`,
        u.email,
        u.role.toUpperCase(),
        u.status.toUpperCase(),
        u.joinedDate,
        u.lastActive,
        u.enrolledCourses.length,
        u.totalSpent
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `pacemaker-users-export-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast('success', `Exported ${filteredAndSortedUsers.length} records to CSV file.`);
    } catch (e) {
      console.error(e);
      triggerToast('error', 'Failed to generate CSV export.');
    }
  };

  // Skeleton Loader screen
  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-teal-100 rounded"></div>
            <div className="h-8 w-64 bg-teal-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Toast Notification Container */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold pointer-events-auto ${
                toast.type === 'success' ? 'bg-teal-50 border-teal-100 text-teal-800' :
                toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
              {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-4 border border-primary-100 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Platform Administration
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 font-medium mt-1">Manage global users, inspect activities, change security roles, and enforce policies.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-5 py-3 border border-gray-200 hover:border-primary-600 hover:text-primary-700 bg-white text-gray-700 text-sm font-black uppercase tracking-widest rounded-2xl shadow-sm transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-gray-400" /> Export CSV
          </button>
          
          <button
            onClick={() => setAddUserModalOpen(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Enrolled Users', count: stats.total, color: 'text-primary-600', bg: 'bg-primary-50/70 border-primary-100', icon: Users },
          { label: 'Active Learners', count: stats.active, color: 'text-teal-600', bg: 'bg-teal-50/70 border-teal-100', icon: CheckCircle2 },
          { label: 'Enforced Bans', count: stats.disabled, color: 'text-red-600', bg: 'bg-red-50/70 border-red-100', icon: Ban },
          { label: 'New Registrations', count: stats.newThisMonth, color: 'text-blue-600', bg: 'bg-blue-50/70 border-blue-100', icon: Calendar },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
              <span className={`text-3xl font-black ${stat.color}`}>{stat.count}</span>
            </div>
            <p className={`mt-3 text-xs font-black ${stat.color} opacity-80 uppercase tracking-[0.1em]`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bulk actions and filter controls panel */}
      <div className="mb-6 p-6 bg-white rounded-[2rem] border border-gray-200/80 shadow-md flex flex-col gap-6">
        
        {/* Row 1: Search & Filter Tabs */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200 max-w-fit overflow-x-auto">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'student', label: 'Students' },
              { id: 'instructor', label: 'Instructors' },
              { id: 'admin', label: 'Admins' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  roleFilter === tab.id 
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200 max-w-fit overflow-x-auto">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'disabled', label: 'Disabled' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === tab.id 
                    ? 'bg-white text-primary-700 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Advanced filters (Sorting, Date range) */}
        <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Join Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Joined date range:
            </span>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 shadow-sm">
              <input 
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none border-none cursor-pointer"
              />
              <span className="text-xs text-gray-400 font-bold">to</span>
              <input 
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none border-none cursor-pointer"
              />
              {(dateRange.start || dateRange.end) && (
                <button 
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Sort selection */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort by:
            </span>
            
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-gray-50 hover:bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-1 focus:ring-primary-500 shadow-sm"
              >
                <option value="name">Name</option>
                <option value="joinedDate">Joined Date</option>
                <option value="lastActive">Last Active</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-white text-xs font-bold text-gray-700 rounded-xl transition-all shadow-sm flex items-center gap-1"
              >
                {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Bulk Actions (visible only when items are checked) */}
        {selectedUsers.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary-50/50 border border-primary-100/70 rounded-[1.5rem] flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-primary-850">
              <Users className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-black text-primary-800">
                {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={bulkActionType}
                onChange={(e) => setBulkActionType(e.target.value)}
                className="bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs font-black text-gray-700 outline-none"
              >
                <option value="">Choose Bulk Action...</option>
                <option value="change_role">Promote/Change Role to...</option>
                <option value="disable">Disable Checked Accounts</option>
                <option value="enable">Enable Checked Accounts</option>
                <option value="delete">Delete Permanently</option>
              </select>

              {bulkActionType === 'change_role' && (
                <select
                  value={bulkActionTargetRole}
                  onChange={(e) => setBulkActionTargetRole(e.target.value as any)}
                  className="bg-white px-3 py-2 border border-gray-200 rounded-xl text-xs font-black text-gray-700 outline-none"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              )}

              <button
                disabled={!bulkActionType}
                onClick={() => setBulkActionConfirmOpen(true)}
                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary-600/10"
              >
                Apply Action
              </button>

              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Users Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden mb-6">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.has(u.email))}
                    className="w-4.5 h-4.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Learner / Educator</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Joined</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Active</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-bold">No accounts found matching current query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isChecked = selectedUsers.has(user.email);
                  const isDisabled = user.status === 'disabled';
                  
                  return (
                    <tr 
                      key={user.email} 
                      className={`transition-colors group hover:bg-gray-50/50 ${isDisabled ? 'bg-gray-50/30 text-gray-400' : ''}`}
                    >
                      <td className="px-6 py-4.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSelectUser(user.email)}
                          className="w-4.5 h-4.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4.5">
                        <div 
                          className="flex items-center gap-4 cursor-pointer" 
                          onClick={() => {
                            setSelectedUserDetails(user);
                            setDetailsActiveTab('profile');
                          }}
                        >
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-primary-100 flex items-center justify-center font-black text-lg text-primary-700 shadow-sm border border-white/50 shrink-0 ${isDisabled ? 'grayscale opacity-70' : ''}`}>
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors ${isDisabled ? 'text-gray-400 line-through' : ''}`}>
                              {user.name}
                            </p>
                            <p className="text-xs font-medium text-gray-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                          user.role === 'instructor' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-teal-50 text-teal-650 border border-teal-100'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isDisabled ? 'bg-red-50 text-red-650 border border-red-100' : 'bg-green-50 text-green-650 border border-green-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-red-500' : 'bg-green-500'}`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(user.joinedDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(user.lastActive).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserDetails(user);
                              setDetailsActiveTab('profile');
                            }}
                            className="p-2 border border-gray-100 hover:border-primary-300 hover:bg-primary-50 rounded-xl text-gray-500 hover:text-primary-700 transition-all shadow-sm"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenRoleModal(user)}
                            className="p-2 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-gray-500 hover:text-blue-700 transition-all shadow-sm"
                            title="Edit User Role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenDisableModal(user)}
                            className={`p-2 border rounded-xl transition-all shadow-sm ${
                              isDisabled 
                                ? 'border-green-100 hover:border-green-300 hover:bg-green-50 text-green-600'
                                : 'border-gray-100 hover:border-red-300 hover:bg-red-50 text-gray-500 hover:text-red-700'
                            }`}
                            title={isDisabled ? 'Enable Account' : 'Disable Account'}
                          >
                            {isDisabled ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => setDeleteModalUser(user)}
                            className="p-2 border border-gray-100 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-650 rounded-xl transition-all shadow-sm"
                            title="Delete User Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 px-2 py-1 focus:ring-1 focus:ring-primary-500 shadow-sm"
            >
              {[10, 25, 50, 100].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span className="text-xs font-bold text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} accounts
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-xl disabled:opacity-50 text-gray-600 transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                    isSelected 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' 
                      : 'bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-xl disabled:opacity-50 text-gray-600 transition-all shadow-sm cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================== MODALS SECTION ==================================== */}

      {/* 1) Add User Modal */}
      <AnimatePresence>
        {addUserModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddUserModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden bg-gradient-to-b from-white to-gray-50"
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-150">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Create Profile</h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Register user credentials manually.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAddUserModalOpen(false)}
                  className="p-2 border border-gray-200 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={executeAddUser} className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium text-sm outline-none"
                    placeholder="Dr. Rajesh Koothrappali"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium text-sm outline-none"
                    placeholder="doctor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium text-sm outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Security Role</label>
                  <select 
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 text-sm outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Send welcome email toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div>
                    <p className="text-xs font-black text-gray-700">Send Welcome Email</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Sends credentials & setup keys.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewUserData(prev => ({ ...prev, sendEmail: !prev.sendEmail }))}
                    className="text-primary-600 hover:text-primary-750"
                  >
                    {newUserData.sendEmail ? (
                      <ToggleRight className="w-10 h-10 text-primary-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAddUserModalOpen(false)}
                    className="flex-1 py-3.5 border-2 border-gray-100 hover:border-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-600/10 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2) Edit User Role Modal */}
      <AnimatePresence>
        {roleModalUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRoleModalUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">Change Security Role</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Adjust privileges for {roleModalUser.name}</p>
                </div>
                <button 
                  onClick={() => setRoleModalUser(null)}
                  className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Warnings on Admin Demotion */}
              {roleModalUser.role === 'admin' && selectedNewRole !== 'admin' && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3 mb-6">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-red-900">Demotion Warning</h4>
                    <p className="text-[11px] font-bold text-red-750 mt-0.5">
                      This user is currently a **Super Administrator**. Revoking this role will disable their access to platform logs, analytics, user bans, and exams creator tool instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Warning when promoting new Admin */}
              {roleModalUser.role !== 'admin' && selectedNewRole === 'admin' && (
                <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex items-start gap-3 mb-6">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-amber-900">Privilege Elevation</h4>
                    <p className="text-[11px] font-bold text-amber-750 mt-0.5">
                      You are promoting this user to **Super Administrator**. They will have unrestricted access to all tables, billing reports, and platform settings.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select Privileges Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'student', title: 'Student', color: 'border-teal-200 text-teal-650 hover:bg-teal-50 bg-teal-50/20' },
                      { id: 'instructor', title: 'Instructor', color: 'border-blue-200 text-blue-650 hover:bg-blue-50 bg-blue-50/20' },
                      { id: 'admin', title: 'Admin', color: 'border-red-200 text-red-650 hover:bg-red-50 bg-red-50/20' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedNewRole(r.id as any)}
                        className={`p-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                          selectedNewRole === r.id 
                            ? 'ring-2 ring-primary-500 bg-white shadow-md border-primary-500' 
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setRoleModalUser(null)}
                    className="flex-1 py-3.5 border-2 border-gray-100 hover:border-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-850"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeChangeRole}
                    className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-600/10"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3) Disable User Modal */}
      <AnimatePresence>
        {disableModalUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDisableModalUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Restrict Account</h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Enforce suspension on account</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDisableModalUser(null)}
                  className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs font-bold text-gray-500 mb-5">
                Suspending **{disableModalUser.name}** ({disableModalUser.email}) prevents them from logging in, viewing subscribed courses, and participating in scheduled video classes instantly.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Reason for Suspension (Optional)</label>
                  <textarea 
                    value={disableReasonInput}
                    onChange={(e) => setDisableReasonInput(e.target.value)}
                    placeholder="e.g. Terms violations: spamming forums, multiple IP access, duplicate accounts..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-gray-900 text-xs placeholder:text-gray-400 placeholder:font-medium outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => setDisableModalUser(null)}
                    className="flex-1 py-3.5 border-2 border-gray-100 hover:border-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-850"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => executeToggleStatus(disableModalUser, 'disabled', disableReasonInput)}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/10"
                  >
                    Restrict User
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4) Delete User Modal */}
      <AnimatePresence>
        {deleteModalUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteModalUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-650" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Delete Account</h3>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">Permanent account deletion</p>
                  </div>
                </div>
                <button 
                  onClick={() => setDeleteModalUser(null)}
                  className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severe Warning Alert */}
              <div className="p-4 bg-red-50 border border-red-150 text-red-800 rounded-2xl flex items-start gap-3 mb-6">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-red-950">Warning: Action Cannot Be Undone</h4>
                  <p className="text-[11px] font-bold text-red-750 mt-0.5">
                    Deleting **{deleteModalUser.name}** permanently purges their activity log, invoice records, exam attempts, and progress profiles from the system. 
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  Would you like to **Disable/Suspend** their account safely instead, keeping their data intact, or proceed with a **Permanent Delete**?
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      executeToggleStatus(deleteModalUser, 'disabled', 'Disabled instead of permanent delete');
                      setDeleteModalUser(null);
                    }}
                    className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs uppercase tracking-widest rounded-2xl transition-colors"
                  >
                    Safely Disable Account Instead
                  </button>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDeleteModalUser(null)}
                      className="flex-1 py-3.5 border-2 border-gray-100 hover:border-gray-200 font-black text-xs uppercase tracking-widest rounded-2xl text-gray-550"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => executeDeleteUser(deleteModalUser.email)}
                      className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/10"
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5) Bulk Actions Confirmation Dialog */}
      <AnimatePresence>
        {bulkActionConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBulkActionConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">Confirm Bulk Operation</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">Applying changes in bulk batch</p>
                </div>
                <button 
                  onClick={() => setBulkActionConfirmOpen(false)}
                  className="p-1.5 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex items-start gap-3 mb-6">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-amber-900">Are you absolutely sure?</h4>
                  <p className="text-[11px] font-bold text-amber-700 mt-0.5">
                    This action will immediately apply **{bulkActionType.toUpperCase()}** to all **{selectedUsers.size}** selected user accounts. This may cause structural data loss or access lockdowns.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setBulkActionConfirmOpen(false)}
                  className="flex-1 py-3.5 border-2 border-gray-100 hover:border-gray-200 font-black text-xs uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-850"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeBulkAction}
                  className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-600/10"
                >
                  Confirm & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6) High-Fidelity Details Modal (Tabs Drawer) */}
      <AnimatePresence>
        {selectedUserDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUserDetails(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-200"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-18 h-18 rounded-3xl overflow-hidden bg-primary-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-primary-600/20">
                    {selectedUserDetails.avatar ? (
                      <img src={selectedUserDetails.avatar} alt={selectedUserDetails.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedUserDetails.name.split(' ').map(n => n[0]).join('').substring(0,2)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedUserDetails.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        selectedUserDetails.role === 'admin' ? 'bg-red-50 text-red-650' :
                        selectedUserDetails.role === 'instructor' ? 'bg-blue-50 text-blue-650' :
                        'bg-teal-50 text-teal-650'
                      }`}>
                        {selectedUserDetails.role}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <span className="text-xs font-bold text-gray-500">{selectedUserDetails.email}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <span className="text-xs font-bold text-gray-400">ID: {selectedUserDetails.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedUserDetails(null)} 
                    className="p-2.5 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-800" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-10 bg-gray-50 border-b border-gray-100 flex gap-6 shrink-0">
                {[
                  { id: 'profile', label: 'User Profile', icon: ShieldCheck },
                  { id: 'activity', label: 'Activity Logs', icon: Clock },
                  { id: 'courses', label: 'Enrolled Courses', icon: BookOpen },
                  { id: 'payments', label: 'Payment History', icon: CreditCard }
                ].map(tab => {
                  const isActive = detailsActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDetailsActiveTab(tab.id as any)}
                      className={`py-4 px-2 border-b-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all relative cursor-pointer ${
                        isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-10 bg-[#fdfbf7]">
                
                {/* 1) TAB: PROFILE */}
                {detailsActiveTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Core Registration</h4>
                        <div className="space-y-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
                          <DetailItem label="Full Name" value={selectedUserDetails.name} />
                          <DetailItem label="Email ID" value={selectedUserDetails.email} />
                          <DetailItem label="Phone Number" value={selectedUserDetails.phone || 'Not provided'} />
                          <DetailItem label="Joined Platform On" value={new Date(selectedUserDetails.joinedDate).toLocaleDateString()} />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Account Diagnostics</h4>
                        <div className="space-y-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
                          <DetailItem label="Security Role Clearance" value={selectedUserDetails.role.toUpperCase()} />
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clearance status</label>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${
                              selectedUserDetails.status === 'disabled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {selectedUserDetails.status}
                            </span>
                          </div>
                          
                          {selectedUserDetails.status === 'disabled' && (
                            <div className="pt-2">
                              <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Reason for Lockout</label>
                              <p className="text-xs font-bold text-red-950 bg-red-50/50 p-3 rounded-xl border border-red-100/50 leading-relaxed">
                                {selectedUserDetails.disableReason || 'No descriptive reason logged.'}
                              </p>
                            </div>
                          )}

                          <DetailItem label="Total Spent" value={`$${selectedUserDetails.totalSpent.toLocaleString()}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2) TAB: ACTIVITY LOGS */}
                {detailsActiveTab === 'activity' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">User Activity Timeline</h4>
                      
                      {(!selectedUserDetails.activityLog || selectedUserDetails.activityLog.length === 0) ? (
                        <p className="text-xs font-bold text-gray-400 text-center py-6">No historical activity logs recorded for this account.</p>
                      ) : (
                        <div className="relative border-l border-gray-150 pl-6 ml-2 space-y-6">
                          {selectedUserDetails.activityLog.map((log, idx) => (
                            <div key={idx} className="relative">
                              {/* Dot marker */}
                              <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 border-white bg-primary-600 flex items-center justify-center shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              </span>
                              
                              <div>
                                <span className="text-[10px] font-black text-gray-400 tracking-wider">{log.timestamp}</span>
                                <p className="text-sm font-black text-gray-800 mt-1">{log.action}</p>
                                <span className="text-[10px] font-bold text-gray-400 mt-0.5 block">IP Address: {log.ipAddress}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 3) TAB: ENROLLED COURSES */}
                {detailsActiveTab === 'courses' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Subscribed Curriculum</h4>
                    
                    {(!selectedUserDetails.coursesDetail || selectedUserDetails.coursesDetail.length === 0) ? (
                      <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-xs font-bold text-gray-400">User is not currently enrolled in any PaceMaker courses.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUserDetails.coursesDetail.map(course => (
                          <div key={course.id} className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 text-primary-600">
                                <Award className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">ID: {course.id}</span>
                              </div>
                              <h5 className="text-sm font-black text-gray-900 mt-1.5 leading-snug">{course.title}</h5>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1.5">
                                <span>Progress Complete</span>
                                <span className="text-primary-700">{course.progress}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${course.progress}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 mt-2 block">Registered: {new Date(course.joined).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4) TAB: PAYMENT HISTORY */}
                {detailsActiveTab === 'payments' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-wider">Transaction ID</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-wider">Payment Method</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-wider text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                          {(!selectedUserDetails.paymentHistory || selectedUserDetails.paymentHistory.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No payment transaction records exist for this user.</td>
                            </tr>
                          ) : (
                            selectedUserDetails.paymentHistory.map(pmt => (
                              <tr key={pmt.id} className="hover:bg-gray-50/20">
                                <td className="px-6 py-4 text-gray-900">{pmt.id}</td>
                                <td className="px-6 py-4 text-gray-400">{new Date(pmt.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-gray-500">{pmt.method}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    pmt.status === 'paid' ? 'bg-teal-50 text-teal-650' : 'bg-red-50 text-red-650'
                                  }`}>
                                    {pmt.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-900 font-black">${pmt.amount.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Modal Footer (Actions Drawer) */}
              <div className="px-10 py-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">Current Status:</span>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    selectedUserDetails.status === 'disabled' ? 'bg-red-100 text-red-750' : 'bg-green-100 text-green-750'
                  }`}>
                    {selectedUserDetails.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {selectedUserDetails.status === 'active' ? (
                    <button
                      onClick={() => {
                        handleOpenDisableModal(selectedUserDetails);
                        setSelectedUserDetails(null);
                      }}
                      className="px-6 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Ban className="w-4 h-4" /> Restrict User
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        executeToggleStatus(selectedUserDetails, 'active');
                        setSelectedUserDetails(null);
                      }}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-md shadow-teal-600/10"
                    >
                      <UserCheck className="w-4 h-4" /> Restore Access
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleOpenRoleModal(selectedUserDetails);
                      setSelectedUserDetails(null);
                    }}
                    className="px-6 py-2.5 bg-white border border-gray-200 hover:border-blue-600 text-blue-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" /> Adjust Privileges
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

// Full Error Boundary Wrapped view exporting
export default function AdminUsersPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminUsersManagementPage />
    </ErrorBoundary>
  );
}

// Simple Helper detail component
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
      <p className="text-sm font-black text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

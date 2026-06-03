'use client';

import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Clock, Eye, 
  Search, Filter, ChevronRight, Mail, Phone, 
  GraduationCap, Briefcase, MapPin, Calendar,
  Download, ArrowLeft, ShieldCheck, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTableSkeleton } from '@/components/Skeletons';
import ErrorBoundary from '@/components/ErrorBoundary';


type InstructorStatus = 'pending' | 'approved' | 'rejected';

type Instructor = {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  status: InstructorStatus;
  registeredAt: string;
  // Professional details
  specialization?: string;
  subSpecialization?: string;
  qualification?: string;
  college?: string;
  graduationYear?: string;
  experience?: string;
  designation?: string;
  hospital?: string;
  teachingExperience?: string;
  // Personal/Contact
  dob?: string;
  gender?: string;
  nationality?: string;
  phone?: string;
  altPhone?: string;
  address?: string;
};

function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | InstructorStatus>('all');
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadInstructors = () => {
      const stored = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
      const list = Object.values(stored)
        .filter((user: any) => user.role === 'instructor') as Instructor[];
      setInstructors(list.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()));
    };

    loadInstructors();
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 850);

    const handleStorage = () => {
      loadInstructors();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateStatus = (email: string, newStatus: InstructorStatus) => {
    const stored = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
    if (stored[email]) {
      stored[email].status = newStatus;
      localStorage.setItem('registeredUsers', JSON.stringify(stored));
      
      setInstructors(prev => prev.map(inst => 
        inst.email === email ? { ...inst, status: newStatus } : inst
      ));
      
      if (selectedInstructor?.email === email) {
        setSelectedInstructor({ ...selectedInstructor, status: newStatus });
      }
    }
  };

  const filteredInstructors = instructors.filter(inst => {
    const matchesSearch = inst.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inst.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || inst.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (!isLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <AdminTableSkeleton />
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-black uppercase tracking-widest mb-4 border border-teal-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Verification Center
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Instructor Approvals</h1>
          <p className="text-gray-500 font-medium mt-1">Review and manage professional teaching applications.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            {(['all', 'pending', 'approved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Pending Requests', count: instructors.filter(i => i.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Active Instructors', count: instructors.filter(i => i.status === 'approved').length, color: 'text-teal-600', bg: 'bg-teal-50', icon: CheckCircle2 },
          { label: 'Total Applications', count: instructors.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white/50 shadow-sm`}>
            <div className="flex items-center justify-between">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <span className={`text-2xl font-black ${stat.color}`}>{stat.count}</span>
            </div>
            <p className={`mt-2 text-sm font-bold ${stat.color} opacity-80 uppercase tracking-widest`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Instructor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Specialization</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Registered</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInstructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-bold">No instructor applications found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInstructors.map((inst) => (
                  <tr key={inst.email} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-teal-600/20">
                          {inst.firstName[0]}{inst.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{inst.fullName}</p>
                          <p className="text-xs font-medium text-gray-500 mt-0.5">{inst.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{inst.specialization || 'Not specified'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-gray-500">
                        {new Date(inst.registeredAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        inst.status === 'approved' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                        inst.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {inst.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : inst.status === 'pending' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {inst.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedInstructor(inst)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 hover:border-teal-600 hover:text-teal-600 transition-all flex items-center gap-2 ml-auto"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedInstructor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedInstructor(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-10 py-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-teal-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-teal-600/30">
                    {selectedInstructor.firstName[0]}{selectedInstructor.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedInstructor.fullName}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-bold text-teal-600 uppercase tracking-widest">{selectedInstructor.specialization || 'General'} Specialist</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-sm font-medium text-gray-500">{selectedInstructor.email}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedInstructor(null)} className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  
                  {/* Left Column: Information */}
                  <div className="space-y-10">
                    {/* Personal & Contact */}
                    <section>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal & Contact
                      </h3>
                      <div className="space-y-4">
                        <DetailItem label="Full Name" value={selectedInstructor.fullName} />
                        <DetailItem label="Email Address" value={selectedInstructor.email} />
                        <DetailItem label="Mobile" value={selectedInstructor.phone} />
                        <DetailItem label="Nationality" value={selectedInstructor.nationality} />
                        <DetailItem label="Address" value={selectedInstructor.address} full />
                      </div>
                    </section>

                    {/* Professional Info */}
                    <section>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Professional Credentials
                      </h3>
                      <div className="space-y-4">
                        <DetailItem label="Highest Degree" value={selectedInstructor.qualification} />
                        <DetailItem label="Specialization" value={selectedInstructor.specialization} />
                        <DetailItem label="Sub-Specialization" value={selectedInstructor.subSpecialization} />
                        <DetailItem label="College/Uni" value={selectedInstructor.college} />
                        <DetailItem label="Graduation Year" value={selectedInstructor.graduationYear} />
                      </div>
                    </section>
                  </div>

                  {/* Right Column: Experience & Position */}
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Current Position
                      </h3>
                      <div className="space-y-4">
                        <DetailItem label="Designation" value={selectedInstructor.designation} />
                        <DetailItem label="Hospital/Institute" value={selectedInstructor.hospital} />
                        <DetailItem label="Total Experience" value={`${selectedInstructor.experience} Years`} />
                        <DetailItem label="Teaching Exp." value={selectedInstructor.teachingExperience} />
                      </div>
                    </section>

                    {/* Documents */}
                    <section>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Verification Documents
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {['Medical Degree', 'ID Proof', 'CV / Resume'].map((doc) => (
                          <div key={doc} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:border-teal-200 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                                <Download className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                              </div>
                              <span className="text-xs font-black text-gray-700">{doc}</span>
                            </div>
                            <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">View PDF</button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Actions) */}
              <div className="px-10 py-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">Current Status:</span>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedInstructor.status === 'approved' ? 'bg-teal-100 text-teal-700' :
                    selectedInstructor.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedInstructor.status}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {selectedInstructor.status !== 'rejected' && (
                    <button 
                      onClick={() => updateStatus(selectedInstructor.email, 'rejected')}
                      className="px-8 py-3 rounded-2xl font-black text-sm text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                    >
                      Reject Application
                    </button>
                  )}
                  {selectedInstructor.status !== 'approved' ? (
                    <button 
                      onClick={() => {
                        updateStatus(selectedInstructor.email, 'approved');
                        setSelectedInstructor(null);
                      }}
                      className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-teal-600/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Instructor
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateStatus(selectedInstructor.email, 'pending')}
                      className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-amber-600/20 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" /> Move to Pending
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminInstructorsPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AdminInstructorsPage />
    </ErrorBoundary>
  );
}


function DetailItem({ label, value, full = false }: { label: string, value?: string, full?: boolean }) {
  return (
    <div className={`${full ? 'col-span-2' : ''}`}>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <p className="text-sm font-bold text-gray-900 leading-relaxed">{value || 'N/A'}</p>
    </div>
  );
}

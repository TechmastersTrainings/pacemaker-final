'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Phone, GraduationCap, 
  ArrowRight, Building2, MapPin, Globe, 
  Briefcase, BookOpen, Clock 
} from 'lucide-react';
import { syncUserWithForum } from '@/lib/forumService';
import { authService } from '@/services/authService';

export default function RegisterPage() {
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Student-specific fields
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    collegeName: '',
    state: '',
    city: '',
    enrollSubject: '',
    enrollDuration: '',
    studyLevel: 'UG',
    academicYear: '',
    specialization: '',
    pgDegreeType: '',
    residencyYear: ''
  });

  // Instructor-specific fields (Comprehensive)
  const [instructorData, setInstructorData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    nationality: '',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    specialization: '',
    subSpecialization: '',
    qualification: '',
    college: '',
    graduationYear: '',
    experience: '',
    designation: '',
    hospital: '',
    teachingExperience: '',
    password: '',
    stateMedicalCouncil: '',
    medicalCouncilNumber: '',
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    medicalCert: false,
    aadharCard: false,
  });

  const [isCouncilValidating, setIsCouncilValidating] = useState(false);
  const [isCouncilValid, setIsCouncilValid] = useState<boolean | null>(null);

  const handleValidateCouncil = () => {
    setIsCouncilValidating(true);
    setTimeout(() => {
      setIsCouncilValidating(false);
      setIsCouncilValid(instructorData.medicalCouncilNumber.length > 4);
    }, 1000);
  };
  
  const handleFileUpload = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedDocs(prev => ({ ...prev, [docName]: true }));
    }
  };

  const [instructorStep, setInstructorStep] = useState(1);
  const totalInstructorSteps = 5;

  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudentData(prev => {
      const nextData = { ...prev, [name]: value };
      if (prev.studyLevel === 'UG' && name === 'enrollSubject') {
        if (value === 'All') {
          nextData.enrollDuration = '6 Months';
        } else if (value !== '') {
          nextData.enrollDuration = '3 Months';
        }
      }
      return nextData;
    });
  };

  const handleInstructorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInstructorData({ ...instructorData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const userData = role === 'student' ? studentData : instructorData;
      const fullName = `${userData.firstName} ${userData.lastName}`;
      
      // Call backend API
      await authService.register({
        name: fullName,
        email: userData.email,
        password: userData.password,
        role: role.toUpperCase(), // Backend expects uppercase usually
      });
      
      // Optional: Store additional metadata locally if needed for UI
      const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
      storedUsers[userData.email] = { 
        ...userData,
        fullName: fullName,
        role: role,
        status: role === 'instructor' ? 'pending' : 'approved',
        registeredAt: new Date().toISOString()
      };
      localStorage.setItem('registeredUsers', JSON.stringify(storedUsers));
      
      // Auto-create/sync forum account on registration
      const userUsername = userData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      syncUserWithForum(userData.email, fullName, userUsername, role);
      
      if (role === 'instructor') {
        router.push(`/login?registered=true&email=${encodeURIComponent(userData.email)}&role=instructor`);
      } else {
        // Students can now login with their credentials
        router.push(`/login?registered=true&email=${encodeURIComponent(userData.email)}&role=student`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubjectOptions = () => {
    if (studentData.studyLevel === 'UG') {
      switch (studentData.academicYear) {
        case '1st Year': return ['Anatomy', 'Physiology', 'Biochemistry', 'All'];
        case '2nd Year': return ['Pathology', 'Microbiology', 'Pharmacology', 'Forensic medicine', 'All'];
        case '3rd Year': return ['Opthalmology', 'ENT', 'PSM / community medicine', 'All'];
        case '4th Year': return ['General medicine', 'Surgery', 'OBG', 'Pediatrics', 'Dermatology', 'Orthopedics', 'Psychiatry', 'Anesthesia', 'Radiology', 'All'];
        case 'Internship': return ['All'];
        default: return [];
      }
    } else {
      return ['Anatomy', 'Physiology', 'Pathology', 'Surgery', 'General medicine', 'Pediatrics', 'All'];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#fdfbf7]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full md:max-w-[700px] glass-panel rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden bg-white border border-gray-200"
      >
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl z-0"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-center text-gray-900 mb-2 tracking-tight">Create Your Account</h2>
          <p className="text-center text-gray-600 font-medium mb-10">Select your role to begin your medical journey.</p>
          
          {/* Role Selector */}
          <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-10 max-w-sm mx-auto border border-gray-200">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${role === 'student' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              I am a Student
            </button>
            <button 
              onClick={() => setRole('instructor')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${role === 'instructor' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              I am an Instructor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Fields */}
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" name="firstName" required
                    value={role === 'student' ? studentData.firstName : instructorData.firstName}
                    onChange={role === 'student' ? handleStudentChange : handleInstructorChange}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                    placeholder="Enter first name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" name="lastName" required
                    value={role === 'student' ? studentData.lastName : instructorData.lastName}
                    onChange={role === 'student' ? handleStudentChange : handleInstructorChange}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" name="email" required
                    value={role === 'student' ? studentData.email : instructorData.email}
                    onChange={role === 'student' ? handleStudentChange : handleInstructorChange}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" name="password" required
                    value={role === 'student' ? studentData.password : instructorData.password}
                    onChange={role === 'student' ? handleStudentChange : handleInstructorChange}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Role Specific Fields */}
            <AnimatePresence mode="wait">
              {role === 'student' ? (
                <motion.div 
                  key="student-fields" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="tel" name="phone" required
                          value={studentData.phone} onChange={handleStudentChange}
                          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                          placeholder="+91 0000000000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="col-span-1">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Study Level</label>
                      <div className="flex p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
                         <button 
                           type="button"
                           onClick={() => setStudentData({...studentData, studyLevel: 'UG'})}
                           className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${studentData.studyLevel === 'UG' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                         >
                           Undergraduate (UG)
                         </button>
                         <button 
                           type="button"
                           onClick={() => setStudentData({...studentData, studyLevel: 'PG'})}
                           className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${studentData.studyLevel === 'PG' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                         >
                           Postgraduate (PG)
                         </button>
                      </div>
                    </div>
                  </div>

                  {studentData.studyLevel === 'UG' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Academic Year</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="academicYear" required
                              value={studentData.academicYear} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Year</option>
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                              <option value="Internship">Internship</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">College Name</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="text" name="collegeName" required
                              value={studentData.collegeName} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                              placeholder="College Name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Subject to Enroll</label>
                          <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="enrollSubject" required
                              value={studentData.enrollSubject} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Subject</option>
                              {getSubjectOptions().map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Enrollment Period</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="enrollDuration" required
                              value={studentData.enrollDuration} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Period</option>
                              <option value="3 Months">3 Months</option>
                              <option value="6 Months">6 Months</option>
                              <option value="12 Months">12 Months</option>
                              <option value="24 Months">24 Months</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">PG Degree Type</label>
                          <div className="relative">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="pgDegreeType" required
                              value={studentData.pgDegreeType} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Type</option>
                              <option value="MD">MD</option>
                              <option value="MS">MS</option>
                              <option value="DM">DM</option>
                              <option value="MCh">MCh</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Branch</label>
                          <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="specialization" required
                              value={studentData.specialization} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Branch</option>
                              <option value="General Medicine">General Medicine</option>
                              <option value="Pediatrics">Pediatrics</option>
                              <option value="Dermatology">Dermatology</option>
                              <option value="Radiology">Radiology</option>
                              <option value="Psychiatry">Psychiatry</option>
                              <option value="General Surgery">General Surgery</option>
                              <option value="Orthopedics">Orthopedics</option>
                              <option value="Obstetrics &amp; Gynecology">Obstetrics &amp; Gynecology</option>
                              <option value="Ophthalmology">Ophthalmology</option>
                              <option value="ENT">ENT</option>
                              <option value="Anesthesiology">Anesthesiology</option>
                              <option value="Pathology">Pathology</option>
                              <option value="Community Medicine">Community Medicine</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Residency Year</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="residencyYear" required
                              value={studentData.residencyYear} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Year</option>
                              <option value="1st Year PG">1st Year PG</option>
                              <option value="2nd Year PG">2nd Year PG</option>
                              <option value="3rd Year PG">3rd Year PG</option>
                              <option value="Final Year">Final Year</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">College Name</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="text" name="collegeName" required
                              value={studentData.collegeName} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                              placeholder="College Name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Enrollment Period</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select 
                              name="enrollDuration" required
                              value={studentData.enrollDuration} onChange={handleStudentChange}
                              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 appearance-none"
                            >
                              <option value="">Select Period</option>
                              <option value="6 Months">6 Months</option>
                              <option value="12 Months">12 Months</option>
                              <option value="24 Months">24 Months</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">State</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" name="state" required
                          value={studentData.state} onChange={handleStudentChange}
                          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" name="city" required
                          value={studentData.city} onChange={handleStudentChange}
                          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                          placeholder="City"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="instructor-fields" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Step Indicators */}
                  <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${instructorStep >= s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                          {s}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${instructorStep === s ? 'text-primary-600' : 'text-gray-400'}`}>
                          {s === 1 ? 'Personal' : s === 2 ? 'Contact' : s === 3 ? 'Professional' : s === 4 ? 'Position' : 'Documents'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* STEP 1: PERSONAL INFORMATION */}
                  {instructorStep === 1 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Date of Birth</label>
                            <input type="date" name="dob" required value={instructorData.dob} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" />
                         </div>
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Gender</label>
                            <select name="gender" required value={instructorData.gender} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                               <option value="">Select Gender</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Other">Other</option>
                            </select>
                         </div>
                       </div>
                       <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Nationality</label>
                          <select name="nationality" required value={instructorData.nationality} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                             <option value="">Select Nationality</option>
                             <option value="Indian">Indian</option>
                             <option value="American">American</option>
                             <option value="Other">Other</option>
                          </select>
                       </div>
                    </motion.div>
                  )}

                  {/* STEP 2: CONTACT INFORMATION */}
                  {instructorStep === 2 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Mobile Number</label>
                            <div className="relative">
                               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                               <input type="tel" name="phone" required value={instructorData.phone} onChange={handleInstructorChange} className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="+91 00000 00000" />
                            </div>
                         </div>
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Alternate Mobile</label>
                            <div className="relative">
                               <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                               <input type="tel" name="altPhone" value={instructorData.altPhone} onChange={handleInstructorChange} className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="Optional" />
                            </div>
                         </div>
                       </div>
                       <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Full Address</label>
                          <div className="relative">
                             <MapPin className="absolute left-4 top-6 w-5 h-5 text-gray-400" />
                             <textarea name="address" required value={instructorData.address} onChange={(e) => setInstructorData({...instructorData, address: e.target.value})} rows={3} className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900 resize-none" placeholder="Street, City, State, Pincode" />
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {/* STEP 3: PROFESSIONAL INFORMATION */}
                  {instructorStep === 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Specialization</label>
                            <select name="specialization" required value={instructorData.specialization} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                               <option value="">Select Specialization</option>
                               <option value="Cardiology">Cardiology</option>
                               <option value="Neurology">Neurology</option>
                               <option value="Oncology">Oncology</option>
                               <option value="Surgery">Surgery</option>
                               <option value="Pediatrics">Pediatrics</option>
                               <option value="Orthopedics">Orthopedics</option>
                               <option value="Dermatology">Dermatology</option>
                               <option value="Psychiatry">Psychiatry</option>
                               <option value="General Medicine">General Medicine</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Sub-Specialization</label>
                            <select name="subSpecialization" required value={instructorData.subSpecialization} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                               <option value="">Select Sub-Specialization</option>
                               <option value="Interventional">Interventional</option>
                               <option value="Non-Interventional">Non-Interventional</option>
                               <option value="Pediatric">Pediatric</option>
                               <option value="Adult">Adult</option>
                               <option value="Surgical">Surgical</option>
                               <option value="Clinical">Clinical</option>
                               <option value="Preventive">Preventive</option>
                               <option value="Diagnostic">Diagnostic</option>
                            </select>
                         </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Highest Qualification</label>
                            <select name="qualification" required value={instructorData.qualification} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                               <option value="">Select Qualification</option>
                               <option value="MBBS">MBBS</option>
                               <option value="MD">MD</option>
                               <option value="MS">MS</option>
                               <option value="DM">DM</option>
                               <option value="MCh">MCh</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">College/University</label>
                            <input type="text" name="college" required value={instructorData.college} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="AIIMS, JIPMER, etc." />
                         </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Year of Graduation</label>
                            <input type="number" name="graduationYear" required value={instructorData.graduationYear} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="e.g. 2010" />
                         </div>
                         <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Years of Experience</label>
                            <input type="number" name="experience" required value={instructorData.experience} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="Total Years" />
                         </div>
                       </div>
                    </motion.div>
                  )}

                  {/* STEP 4: CURRENT POSITION */}
                  {instructorStep === 4 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Current Designation</label>
                          <input type="text" name="designation" required value={instructorData.designation} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="Senior Consultant, Professor, etc." />
                       </div>
                       <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Current Hospital/Institute</label>
                          <input type="text" name="hospital" required value={instructorData.hospital} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="Apollo, Fortis, etc." />
                       </div>
                       <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Teaching Experience</label>
                          <input type="text" name="teachingExperience" required value={instructorData.teachingExperience} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="e.g. 8 years" />
                       </div>
                    </motion.div>
                  )}

                  {/* STEP 5: DOCUMENTS */}
                  {instructorStep === 5 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                       <div className="p-6 bg-primary-50 rounded-2xl border border-primary-100 flex items-start gap-4 mb-4">
                          <BookOpen className="w-6 h-6 text-primary-600 mt-1 shrink-0" />
                          <div>
                             <h4 className="font-black text-primary-900 text-sm">Almost Finished!</h4>
                             <p className="text-xs text-primary-700 font-medium">Please provide your medical registration details and documents.</p>
                          </div>
                       </div>
                       
                       <div className="space-y-5">
                          {/* 1) State Medical Council */}
                          <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">1. State Medical Council</label>
                             <select name="stateMedicalCouncil" required value={instructorData.stateMedicalCouncil} onChange={handleInstructorChange} className="w-full px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900">
                                <option value="">Select State Council</option>
                                <option value="Andhra Pradesh Medical Council">Andhra Pradesh Medical Council</option>
                                <option value="Delhi Medical Council">Delhi Medical Council</option>
                                <option value="Gujarat Medical Council">Gujarat Medical Council</option>
                                <option value="Karnataka Medical Council">Karnataka Medical Council</option>
                                <option value="Maharashtra Medical Council">Maharashtra Medical Council</option>
                                <option value="Tamil Nadu Medical Council">Tamil Nadu Medical Council</option>
                                <option value="Other">Other</option>
                             </select>
                          </div>

                          {/* 2) Medical Certificate Upload */}
                          <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">2. Medical Certificate Upload</label>
                             <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex items-center justify-between ${uploadedDocs.medicalCert ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-300 bg-gray-50/50'}`}>
                                <span className={`text-xs font-bold ${uploadedDocs.medicalCert ? 'text-green-600' : 'text-gray-500'}`}>
                                  {uploadedDocs.medicalCert ? 'Certificate Uploaded Successfully' : 'PDF, JPG, PNG supported'}
                                </span>
                                <input type="file" onChange={(e) => handleFileUpload('medicalCert', e)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <button type="button" className={`px-4 py-2 bg-white border rounded-xl text-xs font-black transition-colors z-10 ${uploadedDocs.medicalCert ? 'border-green-200 text-green-700' : 'border-gray-200 text-primary-600'}`}>
                                  {uploadedDocs.medicalCert ? 'Change' : 'Browse'}
                                </button>
                             </div>
                          </div>

                          {/* 3) State Medical Council Number & Validation */}
                          <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">3. State Medical Council Number</label>
                             <div className="flex gap-3">
                                <input type="text" name="medicalCouncilNumber" value={instructorData.medicalCouncilNumber} onChange={handleInstructorChange} className="flex-1 px-4 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all font-bold text-gray-900" placeholder="Enter Registration Number" />
                                <button type="button" onClick={handleValidateCouncil} className="px-6 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all whitespace-nowrap min-w-[120px]">
                                   {isCouncilValidating ? 'Validating...' : isCouncilValid === true ? 'Verified ✓' : isCouncilValid === false ? 'Invalid ✗' : 'Validate'}
                                </button>
                             </div>
                             {isCouncilValid === true && <p className="text-xs text-green-600 font-bold mt-2 px-1">Number validated successfully.</p>}
                             {isCouncilValid === false && <p className="text-xs text-red-500 font-bold mt-2 px-1">Could not validate number. Please check and try again.</p>}
                          </div>

                          {/* 4) Aadhar Card Upload */}
                          <div>
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">4. Aadhar Card</label>
                             <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex items-center justify-between ${uploadedDocs.aadharCard ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-300 bg-gray-50/50'}`}>
                                <span className={`text-xs font-bold ${uploadedDocs.aadharCard ? 'text-green-600' : 'text-gray-500'}`}>
                                  {uploadedDocs.aadharCard ? 'Aadhar Uploaded Successfully' : 'PDF, JPG, PNG supported'}
                                </span>
                                <input type="file" onChange={(e) => handleFileUpload('aadharCard', e)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <button type="button" className={`px-4 py-2 bg-white border rounded-xl text-xs font-black transition-colors z-10 ${uploadedDocs.aadharCard ? 'border-green-200 text-green-700' : 'border-gray-200 text-primary-600'}`}>
                                  {uploadedDocs.aadharCard ? 'Change' : 'Browse'}
                                </button>
                             </div>
                          </div>

                       </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons for Instructor */}
                  <div className="flex gap-4 pt-4">
                    {instructorStep > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setInstructorStep(prev => prev - 1)}
                        className="flex-1 py-4 border-2 border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-900 rounded-2xl font-black text-sm transition-all"
                      >
                        Back
                      </button>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        if (instructorStep < totalInstructorSteps) {
                          setInstructorStep(prev => prev + 1);
                        } else {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }
                      }}
                      className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-3"
                    >
                      {instructorStep === totalInstructorSteps ? (isSubmitting ? 'Finalizing...' : 'Complete Registration') : 'Next Step'} 
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {role === 'student' && (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-3"
              >
                {isSubmitting ? 'Creating Profile...' : 'Complete Registration'} <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </form>

          <p className="mt-10 text-center text-sm text-gray-600 font-bold">
            Already registered?{' '}
            <Link href="/login" className="font-black text-primary-600 hover:text-primary-500 transition-colors">
              Sign in to your account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

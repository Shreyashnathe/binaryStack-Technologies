import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  getMyProfile, 
  updateMyProfile, 
  changePassword, 
  getStudentEnrollments, 
  getDashboardStats, 
  getAdminSessions 
} from '../api/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  phoneNumber: '',
  city: '',
  educationLevel: '',
  targetRole: '',
  dateOfBirth: '',
  bio: '',
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfilePage() {
  const { user, syncUserProfile } = useAuth();
  
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  
  // Tab control state (Default is Overview)
  const [activeTab, setActiveTab] = useState('overview');
  
  // Local avatar photo upload preview
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  // Statistics states
  const [studentEnrollmentsCount, setStudentEnrollmentsCount] = useState(0);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSessionsCount, setAdminSessionsCount] = useState(0);

  // Security password change states
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [securityErrors, setSecurityErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 15);
  const maxDob = maxDobDate.toISOString().split('T')[0];

  // Profile strength definition
  const completionFields = user?.role === 'ADMIN' ? [
    form.name,
    form.phoneNumber,
    form.city,
    form.bio,
  ] : [
    form.name,
    form.phoneNumber,
    form.city,
    form.educationLevel,
    form.targetRole,
    form.dateOfBirth,
    form.bio,
  ];

  const completedCount = completionFields.filter((value) => Boolean(value && String(value).trim().length > 0)).length;
  const profileCompletion = Math.round((completedCount / completionFields.length) * 100);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const getMissingFields = () => {
    const missing = [];
    if (!form.name || !form.name.trim()) missing.push('Name');
    if (!form.phoneNumber || !form.phoneNumber.trim()) missing.push('Phone Number');
    if (!form.city || !form.city.trim()) missing.push('City');
    if (user?.role === 'STUDENT') {
      if (!form.dateOfBirth) missing.push('Date of Birth');
      if (!form.educationLevel) missing.push('Education Level');
      if (!form.targetRole || !form.targetRole.trim()) missing.push('Target Coding Role');
    }
    return missing;
  };
  
  const missingFields = getMissingFields();

  const validateField = (name, value) => {
    let err = '';
    const valStr = value ? String(value).trim() : '';
    if (name === 'name') {
      if (valStr.length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (!/^[a-zA-Z0-9 .'-]+$/.test(valStr)) {
        err = 'Name must not contain special characters';
      }
    } else if (name === 'phoneNumber') {
      const normalized = valStr.replace(/\D/g, '');
      let digits = normalized;
      if (normalized.length === 12 && normalized.startsWith('91')) {
        digits = normalized.substring(2);
      } else if (normalized.length === 11 && normalized.startsWith('0')) {
        digits = normalized.substring(1);
      }
      if (!valStr) {
        err = 'Phone number is required';
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        err = 'Phone number must be a valid 10-digit Indian number starting with 6-9';
      }
    } else if (name === 'city') {
      if (!valStr) {
        err = 'City is required';
      }
    } else if (name === 'educationLevel') {
      if (user?.role === 'STUDENT' && !valStr) {
        err = 'Education level is required';
      }
    } else if (name === 'targetRole') {
      if (user?.role === 'STUDENT' && !valStr) {
        err = 'Target coding role is required';
      }
    } else if (name === 'dateOfBirth') {
      if (user?.role === 'STUDENT') {
        if (!valStr) {
          err = 'Date of birth is required';
        } else {
          const dob = new Date(valStr);
          const today = new Date();
          let finalAge = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            finalAge--;
          }
          if (finalAge < 15) {
            err = 'Student must be at least 15 years old';
          }
        }
      }
    }
    return err;
  };

  const getPasswordStrength = (val) => {
    if (!val) return '';
    let criteriaCount = 0;
    if (val.length >= 8) criteriaCount++;
    if (/[A-Z]/.test(val)) criteriaCount++;
    if (/\d/.test(val)) criteriaCount++;
    if (/[@$!%*?&]/.test(val)) criteriaCount++;

    if (criteriaCount === 4) return 'Strong';
    if (val.length >= 6 && criteriaCount >= 2) return 'Medium';
    return 'Weak';
  };

  // On mount: fetch profile, load avatar from localStorage, and load stats depending on role
  useEffect(() => {
    if (!user) return;

    const storedAvatar = localStorage.getItem(`avatar_${user.userId}`);
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }

    getMyProfile()
      .then((res) => {
        const profile = res.data;
        setForm({
          name: profile.name || '',
          phoneNumber: profile.phoneNumber || '',
          city: profile.city || '',
          educationLevel: profile.educationLevel || '',
          targetRole: profile.targetRole || '',
          dateOfBirth: profile.dateOfBirth || '',
          bio: profile.bio || '',
        });
        setCreatedAt(profile.createdAt || '');
        syncUserProfile(profile);
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
        showToast('Failed to load profile details.');
      })
      .finally(() => setLoading(false));

    // Role specific stats fetching
    if (user.role === 'STUDENT') {
      getStudentEnrollments(user.userId)
        .then((res) => {
          setStudentEnrollmentsCount(res.data?.length || 0);
        })
        .catch(console.error);
    } else if (user.role === 'ADMIN') {
      Promise.all([getDashboardStats(), getAdminSessions()])
        .then(([statsRes, sessionsRes]) => {
          setAdminStats(statsRes.data);
          setAdminSessionsCount(sessionsRes.data?.length || 0);
        })
        .catch(console.error);
    }
  }, [user, syncUserProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  // Avatar click and file reader load
  const triggerAvatarInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Photo must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result);
        localStorage.setItem(`avatar_${user?.userId}`, reader.result);
        showToast('Profile photo updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Section Save profiles
  const handleSaveInfo = async (e, section) => {
    e.preventDefault();
    setErrors({});
    
    // Always validate required profile-wide fields
    const currentErrors = {};
    const personalKeys = ['name', 'phoneNumber', 'city'];
    if (user?.role === 'STUDENT') {
      personalKeys.push('dateOfBirth');
    }

    personalKeys.forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) currentErrors[key] = err;
    });

    // Also validate academic details if in the academic section
    if (user?.role === 'STUDENT' && section === 'academic') {
      if (!form.educationLevel) {
        currentErrors.educationLevel = 'Education level is required';
      }
      if (!form.targetRole || !form.targetRole.trim()) {
        currentErrors.targetRole = 'Target coding role is required';
      }
    }

    const hasPersonalErrors = personalKeys.some(k => currentErrors[k]);
    const hasAcademicErrors = user?.role === 'STUDENT' && ['educationLevel', 'targetRole'].some(k => currentErrors[k]);

    if (hasPersonalErrors || (section === 'academic' && hasAcademicErrors)) {
      setErrors(currentErrors);
      if (section === 'academic' && hasPersonalErrors) {
        setActiveTab('personal');
        showToast('Please complete your Personal Info details first.');
      } else {
        showToast('Validation failed. Please fill in all required fields.');
      }
      return;
    }

    let cleanPhone = form.phoneNumber;
    if (form.phoneNumber) {
      const digits = form.phoneNumber.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        cleanPhone = digits.substring(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        cleanPhone = digits.substring(1);
      } else {
        cleanPhone = digits;
      }
    }

    setSaving(true);
    const payload = {
      name: form.name,
      phoneNumber: cleanPhone,
      city: form.city,
      educationLevel: form.educationLevel || null,
      targetRole: form.targetRole || null,
      dateOfBirth: form.dateOfBirth || null,
      bio: form.bio || null,
    };

    try {
      const res = await updateMyProfile(payload);
      syncUserProfile(res.data);
      showToast('Profile information saved.');
    } catch (err) {
      if (err.response?.data?.data && typeof err.response.data.data === 'object') {
        setErrors(err.response.data.data);
      }
      showToast(err.response?.data?.message || 'Could not save profile details.');
    } finally {
      setSaving(false);
    }
  };

  // Security password handler
  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'newPassword' || name === 'confirmNewPassword') {
        const matchErr = updated.confirmNewPassword && updated.confirmNewPassword !== updated.newPassword
          ? 'New passwords do not match'
          : '';
        setSecurityErrors((prevErr) => ({ ...prevErr, confirmNewPassword: matchErr }));
      }
      return updated;
    });

    if (name === 'newPassword') {
      setPasswordStrength(getPasswordStrength(value));
    }
    if (securityErrors[name]) {
      setSecurityErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    setSecurityErrors({});

    if (securityForm.newPassword.length < 8) {
      setSecurityErrors((prev) => ({ ...prev, newPassword: 'New password must be at least 8 characters' }));
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmNewPassword) {
      setSecurityErrors((prev) => ({ ...prev, confirmNewPassword: 'New passwords do not match' }));
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      showToast('Password changed successfully.');
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordStrength('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password. Make sure current is correct.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Layout>
      
      {/* Toast Feedback Alerts */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in text-xs font-bold flex items-center gap-3">
          <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
          {toast}
        </div>
      )}

      {/* Main Profile container */}
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        
        {/* Missing details Warning Banner */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 flex gap-4 text-left animate-fade-in shadow-sm">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0 text-lg font-bold">!</div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900">Complete Your Profile Details</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your profile is not fully complete. Please provide your: 
                <span className="font-bold bg-amber-100/60 px-1.5 py-0.5 rounded text-amber-900 ml-1.5">{missingFields.join(', ')}</span>.
              </p>
              <button 
                onClick={() => {
                  const targetTab = (missingFields.includes('Name') || missingFields.includes('Phone Number') || missingFields.includes('City') || missingFields.includes('Date of Birth')) 
                    ? 'personal' 
                    : 'academic';
                  setActiveTab(targetTab);
                }} 
                className="text-xs font-bold text-primary-700 hover:text-primary-800 underline block pt-1.5 transition-colors"
              >
                Configure missing details now →
              </button>
            </div>
          </div>
        )}

        {/* Profile Header and Hero Banner */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
          {/* Cover gradient banner */}
          <div className="relative w-full h-36 sm:h-48 bg-gradient-to-r from-primary-600 via-violet-700 to-indigo-800">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>

          {/* User Meta Row (Flex Container with Profile Overlapping picture) */}
          <div className="px-6 pb-6 pt-4 text-left relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            
            {/* Avatar block with absolute overlap position relative to row */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 -mt-16 md:-mt-20 z-10">
              
              {/* Picture wrapper */}
              <div 
                onClick={triggerAvatarInput}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white bg-slate-100 shadow-xl overflow-hidden cursor-pointer group flex items-center justify-center relative hover:scale-[1.02] active:scale-95 transition-all"
                title="Click to update photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-slate-700">{getInitials(form.name || user?.name)}</span>
                )}
                
                {/* Camera Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold">
                  <svg className="w-6 h-6 mb-1 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span>Update Photo</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />

              {/* Title & Badge */}
              <div className="space-y-1.5 text-center md:text-left pb-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{form.name || user?.name}</h1>
                  <span className={user?.role === 'ADMIN' ? 'badge-admin font-bold' : 'badge-student font-bold'}>
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Student Partner'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold flex items-center justify-center md:justify-start gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user?.email}
                  <span className="text-[10px] text-slate-400 font-bold ml-1.5">• Joined {formatDate(createdAt)}</span>
                </p>
              </div>

            </div>

            {/* Profile completion strength progress card */}
            <div className="w-full md:w-60 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left space-y-2 z-10 self-stretch md:self-end">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                <span>Setup Progress</span>
                <span className="text-primary-700">{profileCompletion}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full transition-all duration-500" 
                  style={{ width: `${profileCompletion}%` }} 
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-normal">
                {missingFields.length === 0 ? '✓ Your profile is fully configured' : `${missingFields.length} profile parameter(s) missing`}
              </p>
            </div>

          </div>
        </section>

        {/* Tab Selection Menu */}
        <nav className="flex justify-center md:justify-start border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === 'overview' 
                ? 'border-primary-600 text-primary-700' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Overview
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3.5 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === 'personal' 
                ? 'border-primary-600 text-primary-700' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Info
          </button>
          
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setActiveTab('academic')}
              className={`py-3.5 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === 'academic' 
                  ? 'border-primary-600 text-primary-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Academic Info
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3.5 px-5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
              activeTab === 'security' 
                ? 'border-primary-600 text-primary-700' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Security
          </button>
        </nav>

        {/* Tab Panels */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 animate-pulse font-semibold">
            Loading profile information...
          </div>
        ) : (
          <div className="w-full">
            
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="animate-slide-in space-y-6 text-left">
                
                {/* Stats cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  
                  {user?.role === 'STUDENT' ? (
                    <>
                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Enrolled Courses</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{studentEnrollmentsCount}</p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Interactive Sessions</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">12</p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Credentials Earned</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">
                            {profileCompletion >= 80 ? 1 : 0}
                          </p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.88a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.88a1 1 0 00-1.175 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.88c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Reviews Contributed</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">2</p>
                        </div>
                      </article>
                    </>
                  ) : (
                    <>
                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Active Cohort</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{adminStats?.totalStudents ?? 0} Students</p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-purple-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Active Courses</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{adminStats?.totalCourses ?? 0}</p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 4h6m-6 4h6m1 2.25l-4-4-4 4V5a2 2 0 012-2h4a2 2 0 012 2v13.25z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Estimated Gross Revenue</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">
                            ₹{(adminStats?.totalEnrollments ?? 0) * 5999}
                          </p>
                        </div>
                      </article>

                      <article className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="mt-4">
                          <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Active Mentoring Sessions</p>
                          <p className="text-2xl font-black text-slate-900 mt-1">{adminSessionsCount}</p>
                        </div>
                      </article>
                    </>
                  )}

                </div>

                {/* Quick Profile Summary Card & Professional bio */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Summary Box */}
                  <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                    <h3 className="text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3 uppercase tracking-wider text-slate-400">Quick Profile</h3>
                    
                    <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</span>
                        <span>{form.phoneNumber || <span className="text-slate-400 italic">Not set</span>}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">City location</span>
                        <span>{form.city || <span className="text-slate-400 italic">Not set</span>}</span>
                      </div>
                      
                      {user?.role === 'STUDENT' && (
                        <>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Education Level</span>
                            <span>{form.educationLevel || <span className="text-slate-400 italic">Not set</span>}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Target Job Role</span>
                            <span>{form.targetRole || <span className="text-slate-400 italic">Not set</span>}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Date of Birth</span>
                            <span>{formatDate(form.dateOfBirth)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bio statement */}
                  <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                    <h3 className="text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3 uppercase tracking-wider text-slate-400">Professional Bio</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {form.bio || 'Provide a professional bio summary in the Personal Info tab to present yourself to peers and system instructors.'}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* Tab 2: Personal Info */}
            {activeTab === 'personal' && (
              <div className="animate-slide-in">
                <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-left shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Personal Configurations</h2>
                    <p className="text-slate-500 text-xs mt-1">Manage basic personal and identification configurations. All marked fields are mandatory.</p>
                  </div>

                  <form onSubmit={(e) => handleSaveInfo(e, 'personal')} className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label">Full Name *</label>
                        <input
                          name="name"
                          required
                          className={`input-field ${errors.name ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                          value={form.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="label">Email Address (Verified)</label>
                        <div className="relative">
                          <input
                            className="input-field bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-semibold"
                            value={user?.email || ''}
                            disabled
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label">Phone Number *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                          <input
                            name="phoneNumber"
                            required
                            type="tel"
                            maxLength={16}
                            placeholder="9876543210"
                            className={`input-field pl-12 ${errors.phoneNumber ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                            value={form.phoneNumber}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                        {errors.phoneNumber && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.phoneNumber}</p>}
                      </div>

                      <div>
                        <label className="label">City *</label>
                        <input
                          name="city"
                          required
                          placeholder="e.g. Pune"
                          className={`input-field ${errors.city ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                          value={form.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.city}</p>}
                      </div>
                    </div>

                    {user?.role === 'STUDENT' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="label">Date of Birth *</label>
                          <input
                            name="dateOfBirth"
                            type="date"
                            max={maxDob}
                            className={`input-field ${errors.dateOfBirth ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                            value={form.dateOfBirth || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          {errors.dateOfBirth && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.dateOfBirth}</p>}
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Coaching accounts are only available to learners age 15 or older.</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="label m-0">Short Statement / Bio</label>
                        <span className="text-[10px] font-bold text-slate-400">{form.bio?.length || 0}/400 chars</span>
                      </div>
                      <textarea
                        name="bio"
                        rows={4}
                        maxLength={400}
                        className={`input-field resize-none ${errors.bio ? 'border-red-500' : 'hover:border-slate-400'}`}
                        placeholder="Tell cohort instructors about your background, career interests, and learning objectives..."
                        value={form.bio || ''}
                        onChange={handleChange}
                      />
                      {errors.bio && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.bio}</p>}
                    </div>

                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="btn-primary w-full sm:w-auto py-3 px-6 text-xs font-bold active:scale-[0.98] transition-transform shadow-md"
                    >
                      {saving ? 'Saving changes...' : 'Save Personal Details'}
                    </button>

                  </form>
                </section>
              </div>
            )}

            {/* Tab 3: Academic Info (Student only) */}
            {activeTab === 'academic' && user?.role === 'STUDENT' && (
              <div className="animate-slide-in">
                <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-left shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Academic & Target Path</h2>
                    <p className="text-slate-500 text-xs mt-1">Configure your education credentials and career objectives. This helps customize your AI prompt recommendations.</p>
                  </div>

                  <form onSubmit={(e) => handleSaveInfo(e, 'academic')} className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label">Education Level *</label>
                        <select
                          name="educationLevel"
                          required
                          className={`input-field bg-white ${errors.educationLevel ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                          value={form.educationLevel || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <option value="">Select Level</option>
                          <option value="High School / Secondary">High School / Secondary</option>
                          <option value="Undergraduate (B.Tech, BCA, BSc)">Undergraduate (B.Tech, BCA, BSc)</option>
                          <option value="Postgraduate (M.Tech, MCA, MSc)">Postgraduate (M.Tech, MCA, MSc)</option>
                          <option value="Working Professional / Other">Working Professional / Other</option>
                        </select>
                        {errors.educationLevel && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.educationLevel}</p>}
                      </div>

                      <div>
                        <label className="label">Target Coding Role *</label>
                        <input
                          name="targetRole"
                          required
                          placeholder="e.g. Backend Developer"
                          className={`input-field ${errors.targetRole ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                          value={form.targetRole || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {errors.targetRole && <p className="text-red-500 text-[10px] font-bold mt-1.5">{errors.targetRole}</p>}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="btn-primary w-full sm:w-auto py-3 px-6 text-xs font-bold active:scale-[0.98] transition-transform shadow-md"
                    >
                      {saving ? 'Saving changes...' : 'Save Academic Details'}
                    </button>

                  </form>
                </section>
              </div>
            )}

            {/* Tab 4: Security */}
            {activeTab === 'security' && (
              <div className="animate-slide-in space-y-6">
                
                {/* Social Login Notice */}
                <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-3xl p-5 text-left flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M21.35 11.1H12v2.7h5.3c-.22 1.22-.91 2.26-1.95 2.96v2.46h3.14c1.84-1.7 2.9-4.2 2.9-7.22c0-.62-.06-1.22-.14-1.9M12 23c2.97 0 5.46-.98 7.28-2.66l-3.14-2.46c-.87.58-2 .92-3.14.92c-2.86 0-5.29-1.93-6.16-4.53H3.6v2.84C5.4 20.53 9.1 23 12 23m-6.16-9.73A7.1 7.1 0 015.4 12c0-.72.12-1.43.34-2.1V7.06H2.18A11.9 11.9 0 001 12c0 1.9.44 3.7 1.18 5.28l3.66-2.84v-.17m6.16-7.89c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.9 0-6.6 2.47-8.4 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-extrabold text-slate-800">Signing in with Google</h3>
                    <p className="text-slate-500 leading-relaxed">
                      If you registered using your Google Account, a random secure password was generated automatically. You can continue using Google Sign-In at any time.
                    </p>
                    <p className="text-slate-500 leading-relaxed pt-1">
                      If you want to configure a direct email/password login, you can trigger the **Forgot Password** link on the login screen to set a password for the first time.
                    </p>
                  </div>
                </div>

                {/* Password update form */}
                <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-left shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-6">
                    <h2 className="text-lg font-extrabold text-slate-900">Credentials & Key Authentication</h2>
                    <p className="text-slate-500 text-xs mt-1">Change your portal password securely.</p>
                  </div>

                  <form onSubmit={handleSaveSecurity} className="space-y-5">
                    
                    <div>
                      <label className="label">Current Password</label>
                      <div className="relative">
                        <input
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          className="input-field pr-10 hover:border-slate-400"
                          placeholder="••••••••"
                          value={securityForm.currentPassword}
                          onChange={handleSecurityChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showCurrentPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                          <input
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            className={`input-field pr-10 ${securityErrors.newPassword ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                            placeholder="••••••••"
                            value={securityForm.newPassword}
                            onChange={handleSecurityChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNewPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {securityErrors.newPassword && (
                          <p className="text-red-500 text-[10px] font-bold mt-1.5">{securityErrors.newPassword}</p>
                        )}

                        {/* Password strength indicators */}
                        {securityForm.newPassword && (
                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-slate-400">Strength:</span>
                              <span className={
                                passwordStrength === 'Strong' ? 'text-emerald-600 font-extrabold' :
                                passwordStrength === 'Medium' ? 'text-amber-500 font-extrabold' : 'text-red-500 font-extrabold'
                              }>{passwordStrength}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full flex gap-0.5">
                              <div className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength === 'Weak' ? 'w-1/3 bg-red-500' :
                                passwordStrength === 'Medium' ? 'w-2/3 bg-amber-500' :
                                passwordStrength === 'Strong' ? 'w-full bg-emerald-500' : 'w-0'
                              }`} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="label">Confirm New Password</label>
                        <div className="relative">
                          <input
                            name="confirmNewPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            className={`input-field pr-10 ${securityErrors.confirmNewPassword ? 'border-red-500 ring-2 ring-red-500/10' : 'hover:border-slate-400'}`}
                            placeholder="••••••••"
                            value={securityForm.confirmNewPassword}
                            onChange={handleSecurityChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {securityErrors.confirmNewPassword && (
                          <p className="text-red-500 text-[10px] font-bold mt-1.5">{securityErrors.confirmNewPassword}</p>
                        )}
                        {securityForm.confirmNewPassword && !securityErrors.confirmNewPassword && securityForm.newPassword === securityForm.confirmNewPassword && (
                          <p className="text-emerald-600 text-[10px] font-bold mt-1.5">✓ Passwords match</p>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="btn-primary w-full sm:w-auto py-3 px-6 text-xs font-bold active:scale-[0.98] transition-transform shadow-md"
                    >
                      {saving ? 'Updating password...' : 'Update Password'}
                    </button>

                  </form>
                </section>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}

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

  const validateField = (name, value) => {
    let err = '';
    if (name === 'name') {
      if (value.trim().length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
        err = 'Name must not contain special characters';
      }
    } else if (name === 'phoneNumber') {
      if (!/^[6-9]\d{9}$/.test(value)) {
        err = 'Phone number must be a valid 10-digit Indian number';
      }
    } else if (name === 'dateOfBirth') {
      if (value) {
        const dob = new Date(value);
        const today = new Date();
        const finalAge = today.getFullYear() - dob.getFullYear() - (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
        if (finalAge < 15) {
          err = 'You must be at least 15 years old';
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

    // Load local storage avatar if it exists
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
        showToast('Failed to load profile.');
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
    
    // Determine which fields belong to this save event
    let fieldsToValidate = [];
    if (section === 'personal') {
      fieldsToValidate = ['name', 'phoneNumber', 'dateOfBirth'];
    }

    const currentErrors = {};
    fieldsToValidate.forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) currentErrors[key] = err;
    });

    if (Object.keys(currentErrors).some((k) => currentErrors[k])) {
      setErrors(currentErrors);
      showToast('Validation errors. Please fix form issues.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      phoneNumber: form.phoneNumber,
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
      if (name === 'password' || name === 'confirmNewPassword') {
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
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-primary-600 rounded-full animate-ping" />
          {toast}
        </div>
      )}

      {/* Profile Cover Banner */}
      <div className="relative w-full h-40 md:h-52 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800 rounded-3xl shadow-lg mb-12">
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        {/* Avatar Circle centered overlapping */}
        <div 
          onClick={triggerAvatarInput}
          className="absolute left-1/2 -translate-x-1/2 bottom-[-45px] w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden cursor-pointer group flex items-center justify-center transition-transform active:scale-95"
          title="Click to change photo"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl md:text-3xl font-black text-slate-700">{getInitials(form.name || user?.name)}</span>
          )}
          
          {/* Camera Hover Overlay */}
          <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[10px] font-bold">
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Change
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Name and Meta Header */}
      <div className="text-center space-y-2 mb-8 mt-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{form.name || user?.name}</h1>
        <div className="flex justify-center items-center gap-2">
          <span className={user?.role === 'ADMIN' ? 'badge-admin' : 'badge-student'}>
            {user?.role}
          </span>
          <span className="text-xs text-slate-500 font-semibold">• Joined {formatDate(createdAt)}</span>
        </div>

        {/* Profile completion strength progress bar */}
        <div className="max-w-md mx-auto pt-3 px-4">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
            <span>Profile Completion</span>
            <span>{profileCompletion}% ({completionFields.length - completedCount} fields left)</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-300" 
              style={{ width: `${profileCompletion}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex justify-center border-b border-slate-200 mb-8 overflow-x-auto whitespace-nowrap">
        <div className="flex gap-4 px-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'overview' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'personal' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Personal Info
          </button>
          
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setActiveTab('academic')}
              className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'academic' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Academic Info
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'security' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Security
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 animate-pulse font-medium">Loading profile...</div>
      ) : (
        <div className="max-w-4xl mx-auto">
          
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="animate-slide-in space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                
                {user?.role === 'STUDENT' ? (
                  <>
                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">EN</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Courses Enrolled</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{studentEnrollmentsCount}</p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">SE</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Sessions Attended</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">12</p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">CE</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Certificates Earned</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {profileCompletion >= 80 ? 1 : 0}
                        </p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black text-xs">RE</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Reviews Given</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">2</p>
                      </div>
                    </article>
                  </>
                ) : (
                  <>
                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">ST</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Total Students</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{adminStats?.totalStudents ?? 0}</p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">CR</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Total Courses</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{adminStats?.totalCourses ?? 0}</p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">RV</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Total Revenue</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          INR {(adminStats?.totalEnrollments ?? 0) * 5999}
                        </p>
                      </div>
                    </article>

                    <article className="card bg-white p-5 flex flex-col justify-between hover:border-primary-200 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black text-xs">SE</div>
                      <div className="mt-4 text-left">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Active Sessions</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{adminSessionsCount}</p>
                      </div>
                    </article>
                  </>
                )}

              </div>

              {/* Bio summary block */}
              <div className="card bg-white text-left p-6 space-y-3">
                <h3 className="text-slate-900 font-bold text-base">Professional Statement</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {form.bio || 'Provide a professional bio summary in the Personal Info tab.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Personal Info */}
          {activeTab === 'personal' && (
            <div className="animate-slide-in">
              <section className="card bg-white text-left p-6 md:p-8">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                  <p className="text-slate-500 text-xs mt-1">Manage basic personal and identification configurations.</p>
                </div>

                <form onSubmit={(e) => handleSaveInfo(e, 'personal')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        name="name"
                        required
                        className={`input-field ${errors.name ? 'border-red-500' : 'hover:border-slate-400'}`}
                        value={form.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="label">Email address (Verified)</label>
                      <input
                        className="input-field bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-medium"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone Number</label>
                      <input
                        name="phoneNumber"
                        required
                        className={`input-field ${errors.phoneNumber ? 'border-red-500' : 'hover:border-slate-400'}`}
                        value={form.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {errors.phoneNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.phoneNumber}</p>}
                    </div>

                    <div>
                      <label className="label">City</label>
                      <input
                        name="city"
                        required
                        className="input-field hover:border-slate-400"
                        value={form.city}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {user?.role === 'STUDENT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Date of Birth</label>
                        <input
                          name="dateOfBirth"
                          type="date"
                          max={maxDob}
                          className={`input-field ${errors.dateOfBirth ? 'border-red-500' : 'hover:border-slate-400'}`}
                          value={form.dateOfBirth || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {errors.dateOfBirth && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.dateOfBirth}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="label m-0">Bio Statement</label>
                      <span className="text-[10px] font-semibold text-slate-400">{form.bio?.length || 0}/300 chars</span>
                    </div>
                    <textarea
                      name="bio"
                      rows={4}
                      className="input-field resize-none hover:border-slate-400"
                      placeholder="Share details regarding current skills and target programming competencies."
                      value={form.bio || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary py-3 px-6 font-bold text-sm active:scale-[0.98] transition-transform shadow-md"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>

                </form>
              </section>
            </div>
          )}

          {/* Tab 3: Academic Info (Student only) */}
          {activeTab === 'academic' && user?.role === 'STUDENT' && (
            <div className="animate-slide-in">
              <section className="card bg-white text-left p-6 md:p-8">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Academic & Target Path</h2>
                  <p className="text-slate-500 text-xs mt-1">Configure your target roles to assist cohort mentors.</p>
                </div>

                <form onSubmit={(e) => handleSaveInfo(e, 'academic')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Education Level</label>
                      <select
                        name="educationLevel"
                        required
                        className="input-field hover:border-slate-400 bg-white"
                        value={form.educationLevel || ''}
                        onChange={handleChange}
                      >
                        <option value="">Select Level</option>
                        <option value="High School / Secondary">High School / Secondary</option>
                        <option value="Undergraduate (B.Tech, BCA, BSc)">Undergraduate (B.Tech, BCA, BSc)</option>
                        <option value="Postgraduate (M.Tech, MCA, MSc)">Postgraduate (M.Tech, MCA, MSc)</option>
                        <option value="Working Professional / Other">Working Professional / Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Target Coding Role</label>
                      <input
                        name="targetRole"
                        required
                        className="input-field hover:border-slate-400"
                        placeholder="e.g. Backend Developer"
                        value={form.targetRole || ''}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary py-3 px-6 font-bold text-sm active:scale-[0.98] transition-transform shadow-md"
                  >
                    {saving ? 'Saving...' : 'Save Academic Details'}
                  </button>

                </form>
              </section>
            </div>
          )}

          {/* Tab 4: Security */}
          {activeTab === 'security' && (
            <div className="animate-slide-in">
              <section className="card bg-white text-left p-6 md:p-8">
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Security & Credentials</h2>
                  <p className="text-slate-500 text-xs mt-1">Update portal passwords securely.</p>
                </div>

                <form onSubmit={handleSaveSecurity} className="space-y-4">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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

                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        className={`input-field pr-10 ${securityErrors.newPassword ? 'border-red-500' : 'hover:border-slate-400'}`}
                        placeholder="••••••••"
                        value={securityForm.newPassword}
                        onChange={handleSecurityChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
                      <p className="text-red-500 text-[10px] font-bold mt-1">{securityErrors.newPassword}</p>
                    )}

                    {/* Password strength progress bar */}
                    {securityForm.newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">Complexity:</span>
                          <span className={
                            passwordStrength === 'Strong' ? 'text-emerald-600' :
                            passwordStrength === 'Medium' ? 'text-amber-500' : 'text-red-500'
                          }>{passwordStrength}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full flex gap-1">
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
                        className={`input-field pr-10 ${securityErrors.confirmNewPassword ? 'border-red-500' : 'hover:border-slate-400'}`}
                        placeholder="••••••••"
                        value={securityForm.confirmNewPassword}
                        onChange={handleSecurityChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
                      <p className="text-red-500 text-[10px] font-bold mt-1">{securityErrors.confirmNewPassword}</p>
                    )}
                    {securityForm.confirmNewPassword && !securityErrors.confirmNewPassword && securityForm.newPassword === securityForm.confirmNewPassword && (
                      <p className="text-emerald-600 text-[10px] font-bold mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary py-3 px-6 font-bold text-sm active:scale-[0.98] transition-transform shadow-md"
                  >
                    {saving ? 'Changing...' : 'Update Password'}
                  </button>

                </form>
              </section>
            </div>
          )}

        </div>
      )}

    </Layout>
  );
}

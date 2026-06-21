import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { 
  getMyProfile, 
  updateMyProfile, 
  changePassword 
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
  
  // Tab control state (Default is Personal Info)
  const [activeTab, setActiveTab] = useState('personal');

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
    setTimeout(() => setToast(''), 4000);
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

  // Fixed useEffect dependency array to prevent infinite re-fetching loop
  useEffect(() => {
    if (!user) return;

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]); // Safe dependency to prevent continuous execution

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
      showToast('Profile information saved successfully.');
    } catch (err) {
      if (err.response?.data?.data && typeof err.response.data.data === 'object') {
        setErrors(err.response.data.data);
      }
      showToast(err.response?.data?.message || 'Could not save profile details.');
    } finally {
      setSaving(false);
    }
  };

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
        currentPassword: securityForm.currentPassword || '',
        newPassword: securityForm.newPassword,
      });
      showToast('Password changed successfully.');
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordStrength('');
      // Sync passwordSet field in user auth context
      syncUserProfile({ ...user, passwordSet: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password. Make sure current is correct.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      {/* Toast Feedback Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>{toast}</span>
        </div>
      )}



      <div className="space-y-8 px-1">

        {/* Beautiful Glassmorphic Profile Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden text-left shadow-xl">
          {/* Decorative background glow elements */}
          <div className="absolute top-[-40%] right-[-10%] w-[350px] h-[350px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-40%] left-[-10%] w-[350px] h-[350px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={user?.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 px-3 py-1 rounded-full text-xs font-bold' : 'bg-primary-500/10 text-primary-400 border border-primary-500/25 px-3 py-1 rounded-full text-xs font-bold'}>
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Student Partner'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Verified Account</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
                {form.name || user?.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user?.email}
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Joined {formatDate(createdAt)}
                </span>
              </div>
            </div>

            {/* Config progress block */}
            <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-md p-5 rounded-2xl w-full md:w-64 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Setup Progress</span>
                <span className="text-primary-400 font-extrabold">{profileCompletion}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${profileCompletion}%` }} 
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                {missingFields.length === 0 
                  ? '✓ All profile parameters are fully configured' 
                  : `${missingFields.length} recommended parameter(s) missing`}
              </p>
            </div>
          </div>
        </section>

        {/* Sidebar + Panel content grid styled exactly like other sections */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar */}
          <nav className="flex lg:flex-col overflow-x-auto whitespace-nowrap lg:whitespace-normal border-b lg:border-b-0 lg:border-r border-slate-200 pb-3 lg:pb-0 lg:pr-6 gap-2">
            {[
              { id: 'personal', label: 'Personal Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              ...(user?.role === 'STUDENT' ? [{ id: 'academic', label: 'Academic Info', icon: 'M12 14l9-5-9-5-9 5 9 5z' }] : []),
              { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`sidebar-link ${activeTab === tab.id ? 'active' : ''} text-left w-full`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab Pages */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-slate-600 animate-pulse py-12 text-center font-medium">Loading profile details...</div>
            ) : (
              <>


            {/* 2. Personal Info panel wrapped in standard card class */}
            {activeTab === 'personal' && (
              <section className="card text-left animate-fade-in">
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">Personal Details</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Update personal metadata to maintain complete configurations.</p>
                </div>

                <form onSubmit={(e) => handleSaveInfo(e, 'personal')} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Full Name *</label>
                      <input
                        name="name"
                        required
                        type="text"
                        placeholder="e.g. John Doe"
                        className={`input-field ${errors.name ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        value={form.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {errors.name && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="label">Email Address (Verified)</label>
                      <div className="relative">
                        <input
                          type="email"
                          disabled
                          className="input-field bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-medium"
                          value={user?.email || ''}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone Number *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">+91</span>
                        <input
                          name="phoneNumber"
                          required
                          type="tel"
                          maxLength={16}
                          placeholder="9876543210"
                          className={`input-field pl-12 ${errors.phoneNumber ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                          value={form.phoneNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      {errors.phoneNumber && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.phoneNumber}</p>}
                    </div>

                    <div>
                      <label className="label">City *</label>
                      <input
                        name="city"
                        required
                        type="text"
                        placeholder="e.g. Pune"
                        className={`input-field ${errors.city ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        value={form.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {errors.city && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.city}</p>}
                    </div>
                  </div>

                  {user?.role === 'STUDENT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Date of Birth *</label>
                        <input
                          name="dateOfBirth"
                          type="date"
                          max={maxDob}
                          className={`input-field ${errors.dateOfBirth ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                          value={form.dateOfBirth || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        {errors.dateOfBirth && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.dateOfBirth}</p>}
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Student accounts are limited to users age 15 or older.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="label m-0">Short Biography</label>
                      <span className="text-[10px] font-medium text-slate-400">{(form.bio || '').length}/400 chars</span>
                    </div>
                    <textarea
                      name="bio"
                      rows={4}
                      maxLength={400}
                      placeholder="Briefly state your learning objectives, tech interests, or details for mentors."
                      className={`input-field resize-none ${errors.bio ? 'border-red-500' : ''}`}
                      value={form.bio || ''}
                      onChange={handleChange}
                    />
                    {errors.bio && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.bio}</p>}
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Personal Details'}
                  </button>

                </form>
              </section>
            )}

            {/* 3. Academic Info panel wrapped in standard card class */}
            {activeTab === 'academic' && user?.role === 'STUDENT' && (
              <section className="card text-left animate-fade-in">
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">Academic Target</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Manage educational level and career target directions.</p>
                </div>

                <form onSubmit={(e) => handleSaveInfo(e, 'academic')} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Education Level *</label>
                      <select
                        name="educationLevel"
                        required
                        className={`input-field bg-white ${errors.educationLevel ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        value={form.educationLevel || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <option value="">Select Option</option>
                        <option value="High School / Secondary">High School / Secondary</option>
                        <option value="Undergraduate (B.Tech, BCA, BSc)">Undergraduate (B.Tech, BCA, BSc)</option>
                        <option value="Postgraduate (M.Tech, MCA, MSc)">Postgraduate (M.Tech, MCA, MSc)</option>
                        <option value="Working Professional / Other">Working Professional / Other</option>
                      </select>
                      {errors.educationLevel && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.educationLevel}</p>}
                    </div>

                    <div>
                      <label className="label">Target Coding Role *</label>
                      <input
                        name="targetRole"
                        required
                        type="text"
                        placeholder="e.g. Frontend Developer"
                        className={`input-field ${errors.targetRole ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        value={form.targetRole || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      {errors.targetRole && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.targetRole}</p>}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Academic Details'}
                  </button>

                </form>
              </section>
            )}

            {/* 4. Security configuration page wrapped in standard card class */}
            {activeTab === 'security' && (
              <div className="space-y-6 text-left animate-fade-in">
                
                {/* Social Login Notice */}
                <div className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-5 flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H3.75v-2.25A13.5 13.5 0 0015.75 5.25z" />
                    </svg>
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-semibold text-slate-800">Google OAuth Sign-in Active</h3>
                    <p className="text-slate-600 leading-relaxed">
                      If you registered using Google Account, a strong secure password was generated automatically. You can continue using Google Sign-in.
                    </p>
                    <p className="text-slate-600 leading-relaxed pt-1">
                      To configure direct password authentication, click **Forgot Password** on the login page screen to trigger reset emails.
                    </p>
                  </div>
                </div>

                {/* Password update form */}
                <section className="card">
                  <div className="border-b border-slate-200 pb-3 mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Modify portal credentials to set a new key.</p>
                  </div>

                  <form onSubmit={handleSaveSecurity} className="space-y-4">
                    
                    {!user?.passwordSet && (
                      <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-4 mb-2 text-xs leading-relaxed">
                        <span className="font-semibold text-slate-800">First-time Password Configuration:</span> Since you registered via Google, you do not have a password set yet. You can set one now without entering a current password.
                      </div>
                    )}

                    {user?.passwordSet !== false && (
                      <div>
                        <label className="label">Current Password</label>
                        <div className="relative">
                          <input
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            className="input-field pr-10"
                            value={securityForm.currentPassword}
                            onChange={handleSecurityChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showCurrentPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                          <input
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            className={`input-field pr-10 ${securityErrors.newPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                            value={securityForm.newPassword}
                            onChange={handleSecurityChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNewPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {securityErrors.newPassword && (
                          <p className="text-red-500 text-[10px] font-semibold mt-1">{securityErrors.newPassword}</p>
                        )}

                        {/* Password strength indicators */}
                        {securityForm.newPassword && (
                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                              <span className="text-slate-400">Strength:</span>
                              <span className={
                                passwordStrength === 'Strong' ? 'text-emerald-600 font-bold' :
                                passwordStrength === 'Medium' ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'
                              }>{passwordStrength}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full flex overflow-hidden">
                              <div className={`h-full transition-all duration-300 ${
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
                            placeholder="••••••••"
                            className={`input-field pr-10 ${securityErrors.confirmNewPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                            value={securityForm.confirmNewPassword}
                            onChange={handleSecurityChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        {securityErrors.confirmNewPassword && (
                          <p className="text-red-500 text-[10px] font-semibold mt-1">{securityErrors.confirmNewPassword}</p>
                        )}
                        {securityForm.confirmNewPassword && !securityErrors.confirmNewPassword && securityForm.newPassword === securityForm.confirmNewPassword && (
                          <p className="text-emerald-600 text-[10px] font-semibold mt-1">✓ Passwords match</p>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={saving} 
                      className="btn-primary"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>

                  </form>
                </section>
              </div>
            )}
              </>
            )}

          </div>
        </div>

      </div>
    </Layout>
  );
}

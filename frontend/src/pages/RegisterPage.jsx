import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../api/api';

export default function RegisterPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    city: '',
    educationLevel: '',
    targetRole: '',
    dateOfBirth: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Password eye toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // DOB validation configuration
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 15);
  const maxDob = maxDobDate.toISOString().split('T')[0];

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

  const validateField = (name, value) => {
    let err = '';
    if (name === 'name') {
      if (value.trim().length < 2) {
        err = 'Name must be at least 2 characters';
      } else if (!/^[a-zA-Z0-9 .'-]+$/.test(value)) {
        err = 'Name must not contain special characters';
      }
    } else if (name === 'phoneNumber') {
      if (!/^[6-9]\d{9}$/.test(value)) {
        err = 'Phone number must be a valid 10-digit Indian number';
      }
    } else if (name === 'password') {
      if (value.length < 8) {
        err = 'Password must be at least 8 characters';
      } else if (!/(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
        err = 'Password must contain an uppercase letter, a number, and a special character';
      }
    } else if (name === 'confirmPassword') {
      if (value !== form.password) {
        err = 'Passwords do not match';
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Bio character counter protection
    if (name === 'bio' && value.length > 300) return;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-validate match if confirm password or password changes
      if (name === 'confirmPassword' || name === 'password') {
        const confirmErr = updated.confirmPassword && updated.confirmPassword !== updated.password 
          ? 'Passwords do not match' 
          : '';
        setErrors((prevErr) => ({ ...prevErr, confirmPassword: confirmErr }));
      }

      return updated;
    });

    if (name === 'password') {
      setStrength(getPasswordStrength(value));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleGoogleSignUp = () => {
    setError('');
    setGoogleLoading(true);
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  // Submit complete 3-step registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-submit validation check
    const currentErrors = {};
    Object.keys(form).forEach((key) => {
      if (key !== 'confirmPassword') {
        const err = validateField(key, form[key]);
        if (err) currentErrors[key] = err;
      }
    });
    
    if (form.confirmPassword !== form.password) {
      currentErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(currentErrors).some((k) => currentErrors[k])) {
      setErrors(currentErrors);
      // Go back to the step containing errors
      if (currentErrors.name || currentErrors.email || currentErrors.password || currentErrors.confirmPassword) {
        setCurrentStep(1);
      } else if (currentErrors.dateOfBirth || currentErrors.phoneNumber || currentErrors.city) {
        setCurrentStep(2);
      }
      return;
    }

    if (form.email.trim().toLowerCase() === 'owner123@gmail.com') {
      setError('Admin cannot be registered via this form.');
      return;
    }

    try {
      await apiRegister({
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        city: form.city,
        educationLevel: form.educationLevel,
        targetRole: form.targetRole,
        dateOfBirth: form.dateOfBirth || null,
        bio: form.bio || null,
      });

      // Automatically log in user after signup
      const user = await login(form.email, form.password);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  // Validation logic to enable step transitions
  const isStep1Invalid = 
    !form.name || 
    !form.email || 
    !form.password || 
    !form.confirmPassword ||
    errors.name || 
    errors.password || 
    errors.confirmPassword;

  const isStep2Invalid = 
    !form.dateOfBirth || 
    !form.phoneNumber || 
    !form.city ||
    errors.dateOfBirth || 
    errors.phoneNumber;

  const isStep3Invalid = 
    !form.educationLevel || 
    !form.targetRole;

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Blur validate fields on step 1
      const nameErr = validateField('name', form.name);
      const emailErr = validateField('email', form.email);
      const passErr = validateField('password', form.password);
      const confErr = validateField('confirmPassword', form.confirmPassword);
      if (nameErr || emailErr || passErr || confErr) {
        setErrors({ name: nameErr, email: emailErr, password: passErr, confirmPassword: confErr });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const dobErr = validateField('dateOfBirth', form.dateOfBirth);
      const phoneErr = validateField('phoneNumber', form.phoneNumber);
      if (dobErr || phoneErr) {
        setErrors((prev) => ({ ...prev, dateOfBirth: dobErr, phoneNumber: phoneErr }));
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Background glow decoration */}
      <div className="absolute top-[-20%] right-[-15%] w-[60%] h-[60%] bg-primary-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-15%] w-[60%] h-[60%] bg-indigo-200/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden min-h-[650px] relative z-10">
        
        {/* Left Column: Branded Gradient Panel */}
        <section className="lg:col-span-5 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-primary-700 rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                B
              </div>
              <span className="text-lg font-bold tracking-tight">BinaryStack</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black leading-tight tracking-tight">
                Kickstart your engineering journey.
              </h1>
              <p className="text-primary-100 text-sm leading-relaxed">
                Provide your details to configure your customized student roadmap. Connect with specialized mentors and build production-standard applications.
              </p>
            </div>

            {/* Step Guides on Left Side */}
            <div className="space-y-4 pt-4 text-xs font-semibold text-primary-100 hidden lg:block">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentStep >= 1 ? 'bg-white text-primary-700 border-white' : 'border-white/40 text-white/60'
                }`}>1</span>
                <span>Account Credentials</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentStep >= 2 ? 'bg-white text-primary-700 border-white' : 'border-white/40 text-white/60'
                }`}>2</span>
                <span>Personal Verification</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  currentStep >= 3 ? 'bg-white text-primary-700 border-white' : 'border-white/40 text-white/60'
                }`}>3</span>
                <span>Academic & Career Goals</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-primary-200">
            © 2026 BinaryStack Technologies. All rights reserved.
          </div>
        </section>

        {/* Right Column: Form Panel */}
        <section className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-white text-left">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Mobile Logo Header */}
            <div className="flex items-center justify-between lg:hidden mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                  B
                </div>
                <span className="font-extrabold text-slate-900 text-sm">BinaryStack</span>
              </div>
            </div>

            {/* Step Progress Bar Header */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                <span>Step {currentStep} of 3</span>
                <span>
                  {currentStep === 1 ? 'Credentials' : currentStep === 2 ? 'Personal Details' : 'Academic Profile'}
                </span>
              </div>
              {/* Colored Line Segment Progress */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
                <div className={`h-full bg-primary-600 transition-all duration-300 ${
                  currentStep === 1 ? 'w-1/3' : currentStep === 2 ? 'w-2/3' : 'w-full'
                }`} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl font-semibold animate-fade-in flex items-center gap-2">
                <span className="w-4 h-4 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-[10px] font-bold">!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Step 1: Account */}
              {currentStep === 1 && (
                <div key="step-1" className="space-y-4 animate-slide-in">
                  <div>
                    <label className="label" htmlFor="reg-name">Full Name</label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      required
                      className={`input-field ${errors.name ? 'border-red-500' : 'hover:border-slate-400'}`}
                      placeholder="John Doe"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="reg-email">Email address</label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      className="input-field hover:border-slate-400"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="reg-password">Password</label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className={`input-field pr-10 ${errors.password ? 'border-red-500' : 'hover:border-slate-400'}`}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
                      >
                        {showPassword ? (
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
                    {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.password}</p>}
                    
                    {/* Live Strength progress color bar */}
                    {form.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={
                            strength === 'Strong' ? 'text-emerald-600' :
                            strength === 'Medium' ? 'text-amber-500' : 'text-red-500'
                          }>{strength}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full flex gap-1">
                          <div className={`h-full rounded-full transition-all duration-300 ${
                            strength === 'Weak' ? 'w-1/3 bg-red-500' :
                            strength === 'Medium' ? 'w-2/3 bg-amber-500' :
                            strength === 'Strong' ? 'w-full bg-emerald-500' : 'w-0'
                          }`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="reg-confirmPassword">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="reg-confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : 'hover:border-slate-400'}`}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
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
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-[10px] font-bold mt-1">{errors.confirmPassword}</p>
                    )}
                    {form.confirmPassword && !errors.confirmPassword && form.password === form.confirmPassword && (
                      <p className="text-emerald-600 text-[10px] font-bold mt-1">✓ Passwords match</p>
                    )}
                  </div>

                  <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-x-0 h-[1px] bg-slate-200" />
                    <span className="relative z-10 px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      OR
                    </span>
                  </div>

                  {/* Sign up with Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading || googleLoading}
                    className="w-full inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-5 rounded-xl border border-slate-300 shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 text-sm focus:outline-none"
                  >
                    {googleLoading ? (
                      <span className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Setting up...' : 'Quick Sign Up with Google'}</span>
                  </button>
                </div>
              )}

              {/* Step 2: Personal */}
              {currentStep === 2 && (
                <div key="step-2" className="space-y-4 animate-slide-in">
                  <div>
                    <label className="label" htmlFor="reg-dob">Date of Birth</label>
                    <input
                      id="reg-dob"
                      name="dateOfBirth"
                      type="date"
                      max={maxDob}
                      required
                      className={`input-field ${errors.dateOfBirth ? 'border-red-500' : 'hover:border-slate-400'}`}
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.dateOfBirth ? (
                      <p className="text-red-500 text-[10px] font-bold mt-1">{errors.dateOfBirth}</p>
                    ) : (
                      <p className="text-slate-400 text-[10px] font-semibold mt-1">Must be at least 15 years old to register.</p>
                    )}
                  </div>

                  <div>
                    <label className="label" htmlFor="reg-phone">Phone Number</label>
                    <input
                      id="reg-phone"
                      name="phoneNumber"
                      type="tel"
                      required
                      className={`input-field ${errors.phoneNumber ? 'border-red-500' : 'hover:border-slate-400'}`}
                      placeholder="9876543210"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label className="label" htmlFor="reg-city">City</label>
                    <input
                      id="reg-city"
                      name="city"
                      type="text"
                      required
                      className="input-field hover:border-slate-400"
                      placeholder="Pune"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Academic */}
              {currentStep === 3 && (
                <div key="step-3" className="space-y-4 animate-slide-in">
                  <div>
                    <label className="label" htmlFor="reg-education">Education Level</label>
                    <select
                      id="reg-education"
                      name="educationLevel"
                      required
                      className="input-field hover:border-slate-400 bg-white"
                      value={form.educationLevel}
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
                    <label className="label" htmlFor="reg-target-role">Target Role</label>
                    <input
                      id="reg-target-role"
                      name="targetRole"
                      type="text"
                      required
                      className="input-field hover:border-slate-400"
                      placeholder="Backend Developer"
                      value={form.targetRole}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="label m-0" htmlFor="reg-bio">Short Bio (Optional)</label>
                      <span className="text-[10px] font-bold text-slate-400">{form.bio.length}/300 chars</span>
                    </div>
                    <textarea
                      id="reg-bio"
                      name="bio"
                      rows={4}
                      className="input-field resize-none hover:border-slate-400"
                      placeholder="Briefly describe your programming skills and targets..."
                      value={form.bio}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn-secondary flex-1 py-3 font-bold text-slate-700 active:scale-[0.98] transition-transform text-sm"
                  >
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={currentStep === 1 ? isStep1Invalid : isStep2Invalid}
                    className="btn-primary flex-1 py-3 font-bold active:scale-[0.98] transition-transform text-sm"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    id="reg-submit"
                    type="submit"
                    disabled={loading || isStep3Invalid}
                    className="btn-primary flex-1 py-3 font-bold active:scale-[0.98] transition-transform text-sm"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                )}
              </div>

            </form>

            <p className="text-center text-xs font-semibold text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Sign in
              </Link>
            </p>

          </div>

        </section>

      </div>
    </div>
  );
}

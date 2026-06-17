import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    city: '',
    educationLevel: '',
    targetRole: '',
    dateOfBirth: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState('');
  const [error, setError]   = useState('');

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
      } else if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
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
    setForm({ ...form, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-submit validation check
    const currentErrors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) currentErrors[key] = err;
    });

    if (Object.keys(currentErrors).some((k) => currentErrors[k])) {
      setErrors(currentErrors);
      return;
    }

    if (form.email.trim().toLowerCase() === 'owner123@gmail.com') {
      setError('Admin cannot be registered via this form.');
      return;
    }
    try {
      await register({
        ...form,
        dateOfBirth: form.dateOfBirth || null,
        bio: form.bio || null,
      });
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const isFormInvalid =
    Object.values(errors).some((err) => err) ||
    !form.name ||
    !form.email ||
    !form.password ||
    !form.phoneNumber ||
    !form.city ||
    !form.educationLevel ||
    !form.targetRole;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card relative overflow-hidden">
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-primary-200/60 blur-3xl" />
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-2xl text-white font-bold shadow-sm mb-5">
              B
            </div>
            <h1 className="page-title">Create Your Student Profile</h1>
            <p className="page-subtitle leading-relaxed max-w-md">
              Add your academic and career details so mentors can guide your learning plan with better precision.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3">
              <article className="showcase-block bg-slate-50 border-slate-200">
                <span className="showcase-kicker">Personalized Path</span>
                <p className="showcase-caption">Your education level and target role shape course suggestions and coaching plan.</p>
              </article>
              <article className="showcase-block bg-slate-50 border-slate-200">
                <span className="showcase-kicker">Mentor Ready</span>
                <p className="showcase-caption">Detailed profile helps mentors guide your progress with practical milestones.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-2xl font-bold text-slate-900">Create Student Account</h2>
          <p className="text-slate-600 text-sm mt-1">Complete the required details to begin your coaching journey</p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <article className="showcase-block bg-slate-50 border-slate-200 p-4">
              <span className="showcase-kicker">Section 1</span>
              <h3 className="text-slate-900 font-semibold mt-2">Personal Information</h3>
              <p className="text-xs text-slate-600 mt-1">Used for profile setup and mentor communication.</p>
            </article>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input id="reg-name" name="name" type="text" required className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} placeholder="John Doe" value={form.name} onChange={handleChange} onBlur={handleBlur} />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input id="reg-phone" name="phoneNumber" type="text" required className={`input-field ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} placeholder="9876543210" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email address</label>
                <input id="reg-email" name="email" type="email" required className="input-field" placeholder="you@example.com" value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label className="label">City</label>
                <input id="reg-city" name="city" type="text" required className="input-field" placeholder="Pune" value={form.city} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Education Level</label>
                <input id="reg-education" name="educationLevel" type="text" required className="input-field" placeholder="Final Year B.Tech" value={form.educationLevel} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Target Role</label>
                <input id="reg-target-role" name="targetRole" type="text" required className="input-field" placeholder="Backend Developer" value={form.targetRole} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Date of Birth</label>
                <input id="reg-dob" name="dateOfBirth" type="date" max={maxDob} className={`input-field ${errors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} value={form.dateOfBirth} onChange={handleChange} onBlur={handleBlur} />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <input id="reg-password" name="password" type="password" required className={`input-field ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`} placeholder="Min. 8 characters" value={form.password} onChange={handleChange} onBlur={handleBlur} />
                {errors.password && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                {form.password && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Strength:</span>
                    <span className={`text-[11px] font-bold ${
                      strength === 'Strong' ? 'text-emerald-600' :
                      strength === 'Medium' ? 'text-amber-500' : 'text-red-500'
                    }`}>{strength}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">Short Bio</label>
              <textarea id="reg-bio" name="bio" rows={3} className="input-field resize-none" placeholder="Tell us about your current skills and learning goals" value={form.bio} onChange={handleChange} />
            </div>

            <button id="reg-submit" type="submit" disabled={loading || isFormInvalid} className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 hover:text-primary-800 font-medium">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

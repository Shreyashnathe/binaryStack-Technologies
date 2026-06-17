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
  const [error, setError]   = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
                <input id="reg-name" name="name" type="text" required className="input-field" placeholder="John Doe" value={form.name} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input id="reg-phone" name="phoneNumber" type="text" required className="input-field" placeholder="9876543210" value={form.phoneNumber} onChange={handleChange} />
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
                <input id="reg-dob" name="dateOfBirth" type="date" className="input-field" value={form.dateOfBirth} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Password</label>
                <input id="reg-password" name="password" type="password" required minLength={6} className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="label">Short Bio</label>
              <textarea id="reg-bio" name="bio" rows={3} className="input-field resize-none" placeholder="Tell us about your current skills and learning goals" value={form.bio} onChange={handleChange} />
            </div>

            <button id="reg-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2">
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

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card relative overflow-hidden">
          <div className="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-primary-200/55 blur-3xl" />
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-2xl text-white font-bold shadow-sm mb-5">
              B
            </div>
            <h1 className="page-title">Welcome Back to BinaryStack</h1>
            <p className="page-subtitle leading-relaxed max-w-md">
              Continue with your dashboard to access schedules, course progress, announcements, and AI learning support.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3">
              <article className="showcase-block bg-slate-50 border-slate-200">
                <span className="showcase-kicker">Live Coaching</span>
                <p className="showcase-caption">Track mentor sessions, schedules, and execution tasks in one place.</p>
              </article>
              <article className="showcase-block bg-slate-50 border-slate-200">
                <span className="showcase-kicker">Learning Intelligence</span>
                <p className="showcase-caption">Use the integrated AI assistant for focused conceptual clarity and revision.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
          <p className="text-slate-600 text-sm mt-1">Use your registered credentials to access your workspace</p>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              Error: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="label">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-5">
            Do not have an account?{' '}
            <Link to="/register" className="text-primary-700 hover:text-primary-800 font-medium">
              Create one now
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

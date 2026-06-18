import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/api';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const mockEmail = 'googlelearner@gmail.com';
      const mockPassword = 'GoogleUser@123';
      
      // Try registering the mock user first in case they do not exist
      try {
        await register({
          name: 'Google Learner',
          email: mockEmail,
          password: mockPassword,
          phoneNumber: '9876543210',
          city: 'Pune',
          educationLevel: 'B.Tech Graduate',
          targetRole: 'Full Stack Developer',
          dateOfBirth: '2000-01-01',
          bio: 'Registered via Google Sign-In.',
        });
      } catch (regErr) {
        // If registration fails because the user already exists, ignore and proceed to login
        console.log('Google mock user already exists or registration skipped.', regErr);
      }

      const user = await login(mockEmail, mockPassword);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      console.error('Google login error', err);
      setError('Google Authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Background glow decoration */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-primary-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-indigo-200/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden min-h-[600px] relative z-10">
        
        {/* Left Column: Branded Gradient Panel */}
        <section className="lg:col-span-5 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background overlay grid pattern */}
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
                Master production-grade coding.
              </h1>
              <p className="text-primary-100 text-sm leading-relaxed">
                Log in to access your customized learning space, schedule review sessions, work with the AI coding assistant, and track your achievements.
              </p>
            </div>

            {/* Quick Benefits Checklist */}
            <div className="space-y-3 pt-4 text-xs font-semibold text-primary-100">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">✓</span>
                <span>Structured Batch Schedules</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">✓</span>
                <span>Contextual AI Coding Partner</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">✓</span>
                <span>Secure Checkout & Verified Credentials</span>
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

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-xs font-medium">Please enter your details to sign in to your portal</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl font-semibold animate-fade-in flex items-center gap-2">
                <span className="w-4 h-4 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-[10px] font-bold">!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input-field hover:border-slate-400 focus:border-primary-500 transition-colors"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label m-0" htmlFor="login-password">Password</label>
                  <span className="text-[11px] font-bold text-primary-600 hover:text-primary-800 transition-colors cursor-pointer select-none">
                    Forgot Password?
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-10 hover:border-slate-400 focus:border-primary-500 transition-colors"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                  {/* Eye Toggle Icon */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none"
                    aria-label="Toggle password visibility"
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
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading || googleLoading}
                className="btn-primary w-full mt-2 font-bold py-3 active:scale-[0.99] transition-transform"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-x-0 h-[1px] bg-slate-200" />
              <span className="relative z-10 px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Continue with Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-5 rounded-xl border border-slate-300 shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {googleLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <p className="text-center text-xs font-semibold text-slate-500 mt-6">
              New to BinaryStack?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
                Create account now
              </Link>
            </p>

          </div>

        </section>

      </div>
    </div>
  );
}

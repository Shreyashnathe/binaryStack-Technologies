import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/api';

export default function OAuth2RedirectHandler() {
  const { loginWithToken, syncUserProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [tempUser, setTempUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loginWithToken(token)
        .then((user) => {
          if (user.passwordSet === false) {
            setTempUser(user);
          } else {
            navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
          }
        })
        .catch((err) => {
          console.error('Failed to log in with token', err);
          setError('Failed to load user profile. Please try logging in again.');
        });
    }
  }, [token, loginWithToken, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: '',
        newPassword: newPassword,
      });
      syncUserProfile({ ...tempUser, passwordSet: true });
      navigate(tempUser.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (tempUser) {
      navigate(tempUser.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    }
  };

  const displayError = error || (!token ? 'No authentication token found in URL.' : '');

  // Render Password Setup Form if tempUser is set and passwordSet is false
  if (tempUser && tempUser.passwordSet === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 text-left animate-fade-in">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-extrabold text-sm">
              B
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">BinaryStack</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Secure Your Account</h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              Since you registered with Google, you don't have a password configured yet. Set a password below to allow direct email/password login in the future.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl font-semibold animate-fade-in flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-[10px] font-bold">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input-field pr-10 hover:border-slate-400 focus:border-primary-500 transition-colors"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none text-xs font-semibold"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="input-field pr-10 hover:border-slate-400 focus:border-primary-500 transition-colors"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none text-xs font-semibold"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-2 font-bold py-3 active:scale-[0.99] transition-transform"
            >
              {submitting ? 'Setting Password...' : 'Set Password & Continue'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-700 font-semibold pt-1 transition-colors"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-6 text-center rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">!</div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Error</h2>
          <p className="text-slate-600 text-sm">{displayError}</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full py-2.5">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-600 font-semibold text-sm">Authenticating and loading profile...</p>
      </div>
    </div>
  );
}

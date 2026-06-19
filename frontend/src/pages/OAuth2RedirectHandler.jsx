import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuth2RedirectHandler() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      loginWithToken(token)
        .then((user) => {
          navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
        })
        .catch((err) => {
          console.error('Failed to log in with token', err);
          setError('Failed to load user profile. Please try logging in again.');
        });
    }
  }, [token, loginWithToken, navigate]);

  const displayError = error || (!token ? 'No authentication token found in URL.' : '');

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

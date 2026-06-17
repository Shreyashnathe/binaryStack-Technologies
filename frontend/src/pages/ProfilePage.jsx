import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getMyProfile, updateMyProfile } from '../api/api';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 15);
  const maxDob = maxDobDate.toISOString().split('T')[0];

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

  const completionFields = [
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

  useEffect(() => {
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
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [syncUserProfile]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Pre-submit validation
    const currentErrors = {};
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key]);
      if (err) currentErrors[key] = err;
    });

    if (Object.keys(currentErrors).some((k) => currentErrors[k])) {
      setErrors(currentErrors);
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
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const isFormInvalid =
    Object.values(errors).some((err) => err) ||
    !form.name ||
    !form.phoneNumber ||
    !form.city;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account details, career preferences, and learning profile information</p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading profile...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="card xl:col-span-2">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                Error: {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <article className="showcase-block bg-slate-50 border-slate-200 p-4">
                <span className="showcase-kicker">Section 1</span>
                <h3 className="text-slate-900 font-semibold mt-2">Basic Contact Information</h3>
                <p className="text-xs text-slate-600 mt-1">Keep this information updated for communication and verification.</p>
              </article>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    name="name"
                    className={`input-field ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    className="input-field bg-slate-100 animate-none opacity-80"
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
                    className={`input-field ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={form.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    name="city"
                    className="input-field"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input
                    name="dateOfBirth"
                    type="date"
                    max={maxDob}
                    className={`input-field ${errors.dateOfBirth ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    value={form.dateOfBirth || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.dateOfBirth}</p>}
                </div>
              </div>

              <article className="showcase-block bg-slate-50 border-slate-200 p-4">
                <span className="showcase-kicker">Section 2</span>
                <h3 className="text-slate-900 font-semibold mt-2">Academic and Career Preferences</h3>
                <p className="text-xs text-slate-600 mt-1">Used to tailor course recommendations and mentorship guidance.</p>
              </article>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Education Level</label>
                  <input
                    name="educationLevel"
                    className="input-field"
                    value={form.educationLevel}
                    onChange={handleChange}
                    placeholder="e.g. Final Year B.Tech"
                  />
                </div>
                <div>
                  <label className="label">Target Role</label>
                  <input
                    name="targetRole"
                    className="input-field"
                    value={form.targetRole}
                    onChange={handleChange}
                    placeholder="e.g. Java Backend Developer"
                  />
                </div>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea
                  name="bio"
                  rows={4}
                  className="input-field resize-none"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Share your goals, current skill level, and focus areas"
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <article className="showcase-block">
              <span className="showcase-kicker">Account</span>
              <h2 className="text-slate-900 font-semibold text-xl mt-3">{user?.name}</h2>
              <p className="showcase-caption">{user?.email}</p>
              <p className="showcase-caption mt-1">Role: {user?.role}</p>
            </article>

            <article className="showcase-block">
              <span className="showcase-kicker">Profile Strength</span>
              <p className="showcase-value text-2xl">{profileCompletion}%</p>
              <div className="w-full h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="showcase-caption">Complete profile details help mentors provide more relevant guidance.</p>
            </article>

            <article className="showcase-block">
              <span className="showcase-kicker">Member Since</span>
              <p className="showcase-value text-2xl">{formatDate(createdAt)}</p>
              <p className="showcase-caption">Your account timeline and profile information support long-term progression tracking.</p>
            </article>
          </aside>
        </div>
      )}
    </Layout>
  );
}

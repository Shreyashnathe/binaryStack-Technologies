import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getStudentEnrollments, getEnrollmentReceipt } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast]             = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    if (!user) return;
    getStudentEnrollments(user.userId)
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDownloadReceipt = async (enrollmentId) => {
    setDownloadingId(enrollmentId);
    try {
      const response = await getEnrollmentReceipt(enrollmentId);
      
      // Create a blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Build dummy link to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BinaryStack_Receipt_${enrollmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Receipt downloaded successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to download receipt: ' + (err.response?.data?.message || 'Error occurred'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Layout>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-600 mt-1">You are enrolled in {enrollments.length} course{enrollments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading...</div>
      ) : enrollments.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600 mb-5">You have not enrolled in any courses yet.</p>
          <a href="/student/courses" className="btn-primary inline-block text-sm">Browse Courses</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {enrollments.map((e) => (
            <div key={e.id} className="card hover:border-primary-600/40 transition-all duration-200 animate-fade-in flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xs font-bold tracking-wide flex-shrink-0">
                  CR
                </div>
                <div className="flex-1">
                  <h3 className="text-slate-900 font-semibold text-lg leading-snug">{e.courseTitle}</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Enrolled on {new Date(e.enrolledAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <p className="text-slate-500 text-xs mt-1 font-medium">
                    {e.expiryDate ? (
                      <>
                        Expires on {new Date(e.expiryDate).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </>
                    ) : (
                      'Lifetime Access'
                    )}
                  </p>
                  <div className="mt-3">
                    {e.expiryDate && new Date(e.expiryDate) < new Date() ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        Expired
                      </span>
                    ) : (
                      <span className="badge-student">Active</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center">
                <span className="text-xs text-slate-400">Enrollment ID: #{e.id}</span>
                <button
                  onClick={() => handleDownloadReceipt(e.id)}
                  disabled={downloadingId === e.id}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all duration-200"
                >
                  {downloadingId === e.id ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download Receipt
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getStudentEnrollments, getEnrollmentReceipt, getCourseReviews, createCourseReview, deleteReview } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';

export default function StudentEnrollments() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast]             = useState('');

  // Review management states
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [courseReviews, setCourseReviews] = useState({});
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const loadReviews = async (courseId) => {
    try {
      const res = await getCourseReviews(courseId);
      setCourseReviews((prev) => ({
        ...prev,
        [courseId]: res.data,
      }));
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const openReviewsModal = (courseId) => {
    setActiveCourseId(courseId);
    setNewRating(5);
    setNewComment('');
    loadReviews(courseId);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setActiveCourseId(null);
    }
  };

  const activeEnrollment = enrollments.find((e) => e.courseId === activeCourseId);
  const activeReviews = activeCourseId ? (courseReviews[activeCourseId] || []) : [];
  const myReview = activeCourseId && user ? activeReviews.find((r) => r.studentId === user.userId) : null;


  const handleSubmitReview = async (courseId) => {
    if (newRating < 1 || newRating > 5) {
      showToast('Please select a rating between 1 and 5 stars.');
      return;
    }
    setSubmittingReview(true);
    try {
      await createCourseReview(courseId, { rating: newRating, comment: newComment });
      showToast('Review submitted successfully!');
      setNewComment('');
      setNewRating(5);
      loadReviews(courseId);
    } catch (err) {
      console.error(err);
      showToast('Failed to submit review: ' + (err.response?.data?.message || 'Error occurred'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId, courseId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await deleteReview(reviewId);
      showToast('Review deleted.');
      loadReviews(courseId);
    } catch (err) {
      console.error(err);
      showToast('Failed to delete review: ' + (err.response?.data?.message || 'Error occurred'));
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((e) => {
              return (
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
                  
                  <div className="border-t border-slate-100 mt-5 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Enrollment ID: #{e.id}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openReviewsModal(e.courseId)}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 px-3 text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm"
                        >
                          Reviews & Feedback
                        </button>
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reviews Modal Popup */}
          {activeCourseId && activeEnrollment && (
            <div 
              onClick={handleBackdropClick} 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-fade-in text-left">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                  <div className="pr-4">
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Course Feedback</span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">{activeEnrollment.courseTitle}</h3>
                  </div>
                  <button
                    onClick={() => setActiveCourseId(null)}
                    className="text-slate-400 hover:text-slate-650 p-1.5 hover:bg-slate-100 rounded-xl transition-all flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {/* Reviews List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                      Reviews & Feedback
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {activeReviews.length}
                      </span>
                    </h4>
                    {activeReviews.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center">
                        <p className="text-xs text-slate-500 italic">No reviews yet for this course. Be the first to leave one!</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {activeReviews.map((rev) => (
                          <div key={rev.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs relative">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-slate-800">{rev.studentName}</span>
                              <div className="flex items-center gap-2">
                                <StarRating rating={rev.rating} size={12} />
                                {rev.studentId === user?.userId && (
                                  <button
                                    onClick={() => handleDeleteReview(rev.id, activeCourseId)}
                                    className="text-red-500 hover:text-red-700 font-bold transition-colors ml-1 p-0.5 hover:bg-red-50 rounded"
                                    title="Delete review"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-xs">{rev.comment || <span className="italic text-slate-400 text-[11px]">No comment left</span>}</p>
                            <span className="text-[9px] text-slate-400 block mt-1.5">
                              {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leave Review / Existing Review Form */}
                  <div className="border-t border-slate-100 pt-5">
                    {!myReview ? (
                      <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-4.5 space-y-3.5">
                        <h5 className="text-xs font-bold text-primary-800">Leave Your Review</h5>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 font-semibold">Your Rating:</span>
                          <StarRating rating={newRating} interactive={true} onChange={setNewRating} size={20} />
                        </div>
                        <div>
                          <textarea
                            className="input-field w-full p-3 text-xs bg-white resize-none"
                            rows="2"
                            placeholder="Write your feedback about this course (mentor, material, pace)..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSubmitReview(activeCourseId)}
                            disabled={submittingReview}
                            className="btn-primary py-1.5 px-4.5 text-xs font-bold shadow-sm"
                          >
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center justify-between">
                        <div>
                          <span className="font-semibold block text-emerald-900 mb-0.5">Your Review Submitted</span>
                          <span>You have already submitted feedback for this course.</span>
                        </div>
                        <StarRating rating={myReview.rating} size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}


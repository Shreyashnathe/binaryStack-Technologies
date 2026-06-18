import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import CourseCard from '../../components/CourseCard';
import {
  getCourses,
  enroll,
  getStudentEnrollments,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayCheckout = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = RAZORPAY_SCRIPT_URL;
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function StudentCourses() {
  const { user } = useAuth();
  const { isInCart, addToCart } = useCart();
  const [courses, setCourses]         = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!user) return;
    Promise.all([getCourses(), getStudentEnrollments(user.userId)])
      .then(([cRes, eRes]) => {
        setCourses(cRes.data);
        setEnrolledIds(new Set(eRes.data.map((e) => e.courseId)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const getCourseCategory = (course) => {
    const title = (course.title || '').toLowerCase();
    if (title.includes('java') && !title.includes('spring')) {
      return 'Java';
    } else if (title.includes('spring') || title.includes('boot')) {
      return 'Spring Boot';
    } else if (title.includes('react') || title.includes('frontend') || title.includes('html') || title.includes('css') || title.includes('javascript') || title.includes('js')) {
      return 'Frontend';
    } else if (title.includes('database') || title.includes('sql') || title.includes('mysql')) {
      return 'Database';
    }
    return 'Other';
  };

  const categories = ['All', 'Java', 'Spring Boot', 'Frontend', 'Database', 'Other'];

  const getCategoryCount = (cat) => {
    if (cat === 'All') return courses.length;
    return courses.filter((c) => getCourseCategory(c) === cat).length;
  };

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || getCourseCategory(c) === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openEnrollModal = (course) => {
    setSelectedCourse(course);
  };

  const closeEnrollModal = () => {
    if (submitting) return;
    setSelectedCourse(null);
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    const course = selectedCourse;
    const coursePrice = Number(course.price) || 0;

    if (coursePrice <= 0) {
      setSubmitting(true);
      try {
        await enroll(user.userId, course.id);
        setEnrolledIds((prev) => new Set([...prev, course.id]));
        showToast('Enrollment completed successfully.');
        setSelectedCourse(null);
      } catch (err) {
        showToast('Error: ' + (err.response?.data?.message || 'Enrollment failed'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayCheckout();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout.');
      }

      const orderRes = await createRazorpayOrder(user.userId, course.id);
      const order = orderRes.data;

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BinaryStack Technologies',
        description: `Enrollment - ${order.courseTitle || course.title}`,
        order_id: order.orderId,
        prefill: {
          name: order.studentName || user?.name || '',
          email: order.studentEmail || user?.email || '',
          contact: order.studentContact || '',
        },
        theme: {
          color: '#2a57bf',
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            showToast('Payment cancelled.');
          },
        },
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              studentId: user.userId,
              courseId: course.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setEnrolledIds((prev) => new Set([...prev, course.id]));
            setSelectedCourse(null);
            showToast('Payment successful. Enrollment completed.');
          } catch (err) {
            showToast('Error: ' + (err.response?.data?.message || 'Payment verification failed'));
          } finally {
            setSubmitting(false);
          }
        },
      });

      checkout.on('payment.failed', (event) => {
        const reason = event?.error?.description || event?.error?.reason || 'Payment failed';
        showToast(`Payment failed: ${reason}`);
        setSubmitting(false);
      });

      checkout.open();
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message || 'Unable to start payment'));
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Browse Courses</h1>
        <p className="text-slate-600 mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
      </div>

      {/* Filter panel */}
      {courses.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="input-field pl-11 pr-10 py-2.5 w-full"
                placeholder="Search courses by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Capsules */}
          <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-700 text-white border-primary-700 shadow-md shadow-primary-700/10'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {cat}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-primary-800 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No courses are available yet. Please check back later.</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="card text-center py-16 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-slate-900 font-medium">No courses found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or selecting a different category.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="btn-secondary mt-4 py-1.5 px-4 text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEnroll={openEnrollModal}
              enrolled={enrolledIds.has(c.id)}
              inCart={isInCart(c.id)}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}

      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">Confirm Enrollment</h2>
              <span className="badge-student">{Number(selectedCourse.price) === 0 ? 'Free' : `INR ${selectedCourse.price}`}</span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900">{selectedCourse.title}</h3>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              {selectedCourse.description || 'No detailed description available for this course.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <div className="showcase-block bg-slate-50 border-slate-200 p-4">
                <span className="showcase-kicker">Course ID</span>
                <p className="text-slate-900 font-semibold mt-2">#{selectedCourse.id}</p>
              </div>
              <div className="showcase-block bg-slate-50 border-slate-200 p-4">
                <span className="showcase-kicker">Status</span>
                <p className="text-slate-900 font-semibold mt-2">Open for Enrollment</p>
              </div>
            </div>

            {Number(selectedCourse.price) > 0 && (
              <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700">
                Demo payment will open in Razorpay sandbox checkout.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeEnrollModal} className="btn-secondary flex-1" disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={handleEnroll} className="btn-primary flex-1" disabled={submitting}>
                {submitting
                  ? Number(selectedCourse.price) > 0
                    ? 'Processing Payment...'
                    : 'Enrolling...'
                  : Number(selectedCourse.price) > 0
                    ? 'Pay & Enroll'
                    : 'Enroll in Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

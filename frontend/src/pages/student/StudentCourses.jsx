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

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No courses are available yet. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
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

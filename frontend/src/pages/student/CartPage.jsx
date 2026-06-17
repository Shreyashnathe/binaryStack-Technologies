import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { checkoutCart, verifyCartPayment } from '../../api/api';

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

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [successData, setSuccessData] = useState(null); // stores newly enrolled courses list after successful payment

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayCheckout();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout.');
      }

      // 1. Call checkout API to create a combined order
      const res = await checkoutCart(user.userId);
      const order = res.data?.data;

      if (!order) {
        throw new Error('Failed to retrieve order details from server.');
      }

      // 2. Open Razorpay checkout modal
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BinaryStack Technologies',
        description: order.courseTitle || 'Cart Checkout',
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
            showToast('Checkout cancelled.');
          },
        },
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            const verifyRes = await verifyCartPayment({
              studentId: user.userId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // 4. On success, store the list of enrolled courses to show receipt, and clear cart
            const enrolledCourses = verifyRes.data?.data || [];
            setSuccessData({
              courses: cartItems,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            });
            clearCart();
            showToast('Payment successful. Enrollment complete!');
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
      showToast('Error: ' + (err.response?.data?.message || err.message || 'Unable to checkout'));
      setSubmitting(false);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeFromCart(id);
      showToast('Course removed from cart.');
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || 'Unable to remove course'));
    }
  };

  if (successData) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
            ✓
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Enrollment Successful!</h1>
          <p className="text-slate-600 mt-2">Thank you for your payment. You have been successfully enrolled in the following courses:</p>

          <div className="card bg-white border border-slate-200 mt-8 p-6 text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Enrolled Courses</h3>
            <div className="divide-y divide-slate-100">
              {successData.courses.map((course) => (
                <div key={course.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{course.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{course.description}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">INR {course.price}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 mt-4 pt-4 text-xs text-slate-500 space-y-1">
              <p><span className="font-semibold text-slate-700">Payment ID:</span> {successData.paymentId}</p>
              <p><span className="font-semibold text-slate-700">Order ID:</span> {successData.orderId}</p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Link to="/student/enrollments" className="btn-primary">
              Go to My Courses
            </Link>
            <Link to="/student/dashboard" className="btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="page-title">Shopping Cart</h1>
        <p className="page-subtitle">You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="card text-center py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="currentColor"
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <p className="text-slate-500 font-medium">Your cart is empty.</p>
          <Link to="/student/courses" className="btn-primary mt-6">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="card bg-white border border-slate-200 flex flex-col sm:flex-row justify-between gap-4 p-5 hover:border-slate-300 transition-colors duration-150">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{item.description}</p>
                </div>
                <div className="flex sm:flex-col justify-between items-end sm:min-w-[120px] gap-2">
                  <span className="text-lg font-extrabold text-slate-900">INR {item.price}</span>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/50 py-1.5 px-3 rounded-lg transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="card bg-white border border-slate-200 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Summary</h2>
            <div className="space-y-3 border-b border-slate-100 pb-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Items ({cartItems.length})</span>
                <span className="font-semibold text-slate-800">INR {totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Taxes</span>
                <span className="font-semibold text-slate-800">Included</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-base font-bold text-slate-900">Total Price</span>
              <span className="text-2xl font-extrabold text-primary-600">INR {totalAmount}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="btn-primary w-full py-3 mt-2 text-base font-semibold"
            >
              {submitting ? 'Processing Order...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

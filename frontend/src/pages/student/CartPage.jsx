import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  checkoutCart, 
  verifyCartPayment, 
  getCourses, 
  getStudentEnrollments,
  getEnrollmentReceipt
} from '../../api/api';

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
  const { cartItems, removeFromCart, clearCart, addToCart } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [successData, setSuccessData] = useState(null); // receipt modal state
  const [downloadingId, setDownloadingId] = useState(null);
  
  // Suggestion recommendations states
  const [suggestedCourses, setSuggestedCourses] = useState([]);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // in percentage
  const [couponFeedback, setCouponFeedback] = useState({ type: '', msg: '' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDownloadReceipt = async (enrollmentId) => {
    setDownloadingId(enrollmentId);
    try {
      const response = await getEnrollmentReceipt(enrollmentId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BinaryStack_Receipt_${enrollmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Receipt downloaded successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to download receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Math totals
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const discountAmount = Math.round((subtotal * couponDiscount) / 100);
  const finalTotal = subtotal - discountAmount;

  // Load recommendations on mount / cart change
  useEffect(() => {
    if (!user) return;

    // Fetch enrolled courses and all courses to find non-enrolled, non-cart suggestions
    Promise.all([
      getStudentEnrollments(user.userId),
      getCourses()
    ])
      .then(([enrollRes, coursesRes]) => {
        const enrolled = enrollRes.data || [];
        const eIds = enrolled.map((e) => e.courseId);

        const all = coursesRes.data || [];
        const cartIds = cartItems.map((item) => item.id);
        
        // Filter out courses that are already in cart or already enrolled
        const filtered = all.filter((c) => !eIds.includes(c.id) && !cartIds.includes(c.id));
        setSuggestedCourses(filtered.slice(0, 3));
      })
      .catch((err) => console.error('Failed to load recommended courses:', err));
  }, [user, cartItems]);

  // Handle coupon validation
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponFeedback({ type: '', msg: '' });
    
    if (!couponCode.trim()) return;
    const cleanCode = couponCode.trim().toUpperCase();

    if (cleanCode === 'SAVE10') {
      setAppliedCoupon(cleanCode);
      setCouponDiscount(10);
      setCouponFeedback({ type: 'success', msg: '10% discount applied successfully!' });
    } else if (cleanCode === 'BINARYSTACK20') {
      setAppliedCoupon(cleanCode);
      setCouponDiscount(20);
      setCouponFeedback({ type: 'success', msg: '20% discount applied successfully!' });
    } else if (cleanCode === 'WELCOME50') {
      setAppliedCoupon(cleanCode);
      setCouponDiscount(50);
      setCouponFeedback({ type: 'success', msg: '50% welcome discount applied!' });
    } else {
      setAppliedCoupon('');
      setCouponDiscount(0);
      setCouponFeedback({ type: 'error', msg: 'Invalid coupon code.' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponCode('');
    setCouponFeedback({ type: '', msg: '' });
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    try {
      const scriptLoaded = await loadRazorpayCheckout();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout.');
      }

      // 1. Call checkout API to create a combined order with verified coupon discount
      const res = await checkoutCart(user.userId, appliedCoupon);
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
            // 3. Verify payment on backend, passing the validated coupon
            const verifyRes = await verifyCartPayment({
              studentId: user.userId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              coupon: appliedCoupon || null,
            });

            const enrollments = verifyRes.data?.data || [];

            // 4. On success, store receipt fields and clear cart
            setSuccessData({
              courses: cartItems,
              enrollments: enrollments,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              discount: discountAmount,
              finalPaid: finalTotal,
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

  const handleAddSuggested = async (course) => {
    try {
      // Direct call to cart context addToCart helper
      await addToCart(course);
      showToast(`${course.title} added to cart.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add course.');
    }
  };

  // Receipt Modal / Success View
  if (successData) {
    return (
      <Layout>
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-ping" />
            {toast}
          </div>
        )}

        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
            ✓
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight animate-fade-in">Enrollment Successful!</h1>
          <p className="text-slate-600 mt-2">Thank you for your payment. You are now enrolled in these programs:</p>

          <div className="card bg-white border border-slate-200 mt-8 p-6 text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Receipt</h3>
            
            <div className="divide-y divide-slate-100 mb-4">
              {(successData.enrollments || []).length > 0 ? (
                successData.enrollments.map((enrollment) => {
                  const course = successData.courses.find((c) => c.id === enrollment.courseId) || {};
                  return (
                    <div key={enrollment.id} className="py-3 flex justify-between items-center text-left">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-semibold text-slate-800 text-sm">{enrollment.courseTitle}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{course.description || ''}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-slate-900">INR {course.price || 0}</span>
                        <button
                          onClick={() => handleDownloadReceipt(enrollment.id)}
                          disabled={downloadingId === enrollment.id}
                          className="btn-secondary py-1.5 px-2.5 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-50 border border-slate-200 text-slate-700 transition-all duration-200"
                        >
                          {downloadingId === enrollment.id ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-slate-700" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              ...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              Receipt
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                successData.courses.map((course) => (
                  <div key={course.id} className="py-3 flex justify-between items-center text-left">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-slate-800 text-sm">{course.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{course.description || ''}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900">INR {course.price}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
              {successData.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied</span>
                  <span>- INR {successData.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900">
                <span>Final Paid</span>
                <span>INR {successData.finalPaid}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 mt-4 pt-4 text-[10px] text-slate-400 space-y-1">
              <p><span className="font-semibold text-slate-500">Payment ID:</span> {successData.paymentId}</p>
              <p><span className="font-semibold text-slate-500">Order ID:</span> {successData.orderId}</p>
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
      {/* Toast Alert Notifications */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-ping" />
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="page-title">Shopping Cart</h1>
        <p className="page-subtitle">You have {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="card bg-white text-center py-16 max-w-xl mx-auto">
          {/* Empty Cart Illustration */}
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Looks like you have not added any courses to your shopping cart yet.</p>
          <Link to="/student/courses" className="btn-primary mt-6 px-8 py-3">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item, index) => {
                const gradients = [
                  'from-blue-500 to-indigo-600',
                  'from-purple-500 to-pink-500',
                  'from-cyan-500 to-blue-500',
                  'from-emerald-500 to-teal-500'
                ];
                const bgGrad = gradients[index % gradients.length];
                
                // Read Feature 6 optional fields, fallback safely if null
                const displayHours = item.totalHours ? `${item.totalHours} hours` : '32 hours';
                const displayDuration = item.durationDays ? `${item.durationDays} days access` : 'Lifetime Access';

                return (
                  <div 
                    key={item.id} 
                    className="card bg-white border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-5 p-5 hover:border-primary-400 hover:shadow-lg transition-all duration-200 relative group overflow-hidden text-left"
                  >
                    {/* Item Thumbnail / Gradient Cover Accent */}
                    <div className={`w-full sm:w-28 h-20 bg-gradient-to-br ${bgGrad} rounded-xl shrink-0 flex items-center justify-center text-white/20 font-black text-4xl select-none`}>
                      {item.title.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-primary-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      {/* Duration details metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-primary-700">
                          {displayHours}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-indigo-700">
                          {displayDuration}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-end sm:min-w-[120px] gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <span className="text-lg font-black text-slate-900">INR {item.price}</span>
                      
                      {/* Remove Button with Trash SVG */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold focus:outline-none"
                        title="Remove course"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="sm:hidden lg:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Sticky Order Summary Panel */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              
              <div className="card bg-white border border-slate-200 p-6 shadow-md text-left">
                <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Order Summary</h2>
                
                {/* Itemized list */}
                <div className="space-y-3 border-b border-slate-100 pb-4 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="font-bold text-slate-800">INR {subtotal}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold animate-fade-in">
                      <span>Discount ({couponDiscount}% off)</span>
                      <span>- INR {discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax & Charges</span>
                    <span className="text-slate-400">Included</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4">
                  <span className="text-sm font-bold text-slate-900">Total Price</span>
                  <span className="text-2xl font-black text-primary-600">INR {finalTotal}</span>
                </div>

                {/* Coupon Input code block */}
                <div className="border-t border-slate-100 pt-4 mb-4">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1.5">Apply Promo Code</label>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-700 animate-fade-in font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">{appliedCoupon}</span>
                        <span>Coupon Applied</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleRemoveCoupon} 
                        className="text-red-500 hover:text-red-700 font-bold"
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. SAVE10, WELCOME50"
                        className="input-field text-xs py-2 px-3 hover:border-slate-400 transition-colors uppercase"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-primary-600 text-white font-bold text-xs py-2 px-4 rounded-xl active:scale-[0.98] transition-all"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {couponFeedback.msg && !appliedCoupon && (
                    <p className={`text-[10px] font-bold mt-1.5 ${
                      couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {couponFeedback.msg}
                    </p>
                  )}
                  {couponFeedback.msg && appliedCoupon && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1.5">
                      {couponFeedback.msg}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 mt-2 text-sm font-bold shadow-lg shadow-primary-600/15"
                >
                  {submitting ? 'Processing Order...' : 'Proceed to Checkout'}
                </button>

                {/* Security badges */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-center gap-4 text-slate-400 text-[10px] font-semibold">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Razorpay Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span>SSL Encrypted</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Recommendations / You might also like section */}
          {suggestedCourses.length > 0 && (
            <div className="border-t border-slate-200 pt-8 text-left animate-fade-in">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">You might also like</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestedCourses.map((course) => (
                  <article 
                    key={course.id} 
                    className="card bg-white border border-slate-200/80 hover:border-primary-400 p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-extrabold text-primary-700 bg-primary-50 px-2 py-0.5 rounded uppercase">Recommended</span>
                      </div>
                      
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors line-clamp-1">{course.title}</h3>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">INR {course.price}</span>
                      
                      <button
                        onClick={() => handleAddSuggested(course)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-primary-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors active:scale-95 focus:outline-none"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add to Cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

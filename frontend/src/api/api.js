import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear auth and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const register = (data) => API.post('/auth/register', data);
export const login    = (data) => API.post('/auth/login', data);
export const getMyProfile = () => API.get('/auth/me');
export const updateMyProfile = (data) => API.put('/auth/me', data);

// ---- Courses ----
export const getCourses      = ()         => API.get('/courses');
export const getCourseById   = (id)       => API.get(`/courses/${id}`);
export const createCourse    = (data)     => API.post('/courses', data);
export const updateCourse    = (id, data) => API.put(`/courses/${id}`, data);
export const deleteCourse    = (id)       => API.delete(`/courses/${id}`);

// ---- Cart (v1) ----
export const addToCart = (studentId, courseId) => API.post(`/v1/cart/add?studentId=${studentId}&courseId=${courseId}`);
export const getCart = (studentId) => API.get(`/v1/cart?studentId=${studentId}`);
export const removeFromCart = (studentId, courseId) => API.delete(`/v1/cart/remove?studentId=${studentId}&courseId=${courseId}`);
export const checkoutCart = (studentId) => API.post(`/v1/cart/checkout?studentId=${studentId}`);
export const verifyCartPayment = (payload) => API.post('/v1/cart/verify', payload);

// ---- Enrollments ----
export const enroll                  = (studentId, courseId) => API.post(`/enrollments?studentId=${studentId}&courseId=${courseId}`);
export const getStudentEnrollments   = (studentId)           => API.get(`/enrollments/student/${studentId}`);
export const getAllEnrollments        = ()                    => API.get('/enrollments/all');

// ---- Payments (Razorpay demo) ----
export const createRazorpayOrder = (studentId, courseId) =>
  API.post('/payments/razorpay/order', { studentId, courseId });
export const verifyRazorpayPayment = (payload) =>
  API.post('/payments/razorpay/verify', payload);

// ---- Dashboard ----
export const getDashboardStats = () => API.get('/dashboard/stats');

// ---- AI ----
export const askAi = (query) => API.post('/ai/ask', { query });

// ---- Announcements ----
export const getAnnouncements = () => API.get('/announcements');
export const getAdminAnnouncements = () => API.get('/announcements/admin');
export const createAnnouncement = (data) => API.post('/announcements', data);
export const updateAnnouncement = (id, data) => API.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/announcements/${id}`);

// ---- Class Sessions ----
export const getUpcomingSessions = () => API.get('/sessions/upcoming');
export const getAdminSessions = () => API.get('/sessions/admin');
export const createSession = (data) => API.post('/sessions', data);
export const updateSession = (id, data) => API.put(`/sessions/${id}`, data);
export const deleteSession = (id) => API.delete(`/sessions/${id}`);

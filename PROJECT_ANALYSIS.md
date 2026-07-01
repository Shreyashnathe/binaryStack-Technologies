# BinaryStack Coaching Portal - Project Analysis

## 1. Project Overview

This project is a full-stack coaching management platform with:
- Backend: Spring Boot (Java 17), Spring Security (JWT), JPA/Hibernate, MySQL.
- Frontend: React + Vite + TailwindCSS + Axios.
- Roles: ADMIN and STUDENT.
- Integrations: OpenRouter AI, Razorpay (demo sandbox payment for paid enrollments).

---

## 2. Features Added

### 2.1 Authentication and Role-Based Access
- JWT-based login and registration.
- Admin registration is blocked via API and UI checks.
- Role-protected routes and API endpoints:
  - ADMIN: course management, admin enrollments, dashboard stats, announcements and sessions management.
  - STUDENT: enrollments, profile, AI chat, schedule, announcements.
- Auto logout/redirect on API 401 in frontend interceptor.

### 2.2 Extended Student Profile System
- Registration captures detailed student data:
  - name, email, password, phone number, city, education level, target role, date of birth, bio.
- Profile page allows update of these fields.
- Profile completion meter and member-since details are displayed.
- Profile updates are synced into frontend auth context/local storage.

### 2.3 Course Management
- Full course CRUD for admins.
- Public course listing for all users.
- Course deletion is FK-safe:
  - dependent enrollments are deleted before course deletion.

### 2.4 Enrollment Management
- Students can enroll in courses.
- Duplicate enrollment prevention in backend.
- Student enrollment views and admin all-enrollments view.
- Enrollment confirmation modal shows course details before final action.

### 2.5 Razorpay Demo Payment Gateway (Paid Enrollment Flow)
- Added Razorpay order creation and payment verification APIs.
- Paid courses now use Razorpay checkout before enrollment finalization.
- Free courses bypass payment and enroll directly.
- Backend verifies:
  - order details (amount/currency/receipt mapping),
  - Razorpay signature (HMAC SHA256),
  - then performs enrollment.
- Razorpay credential hardening:
  - app-scoped keys used to avoid stale global env collisions,
  - credential normalization (trim/quote removal),
  - explicit 401 error diagnostics.

### 2.6 Announcements Module
- Admin can create, update, delete announcements.
- Audience targeting: ALL, STUDENT, ADMIN.
- Active/inactive toggles.
- Students/admins see only relevant active announcements.

### 2.7 Class Sessions Module
- Admin can create, update, delete sessions.
- Validation: end time must be after start time.
- Session metadata includes mentor, mode (ONLINE/OFFLINE/HYBRID), link/location.
- Students see upcoming active sessions only.

### 2.8 Dashboard and Analytics
- Admin dashboard stats:
  - total students,
  - total courses,
  - total enrollments.
- Frontend shows progress/coverage style metrics for both roles.

### 2.9 AI Assistant Integration
- OpenRouter-based AI Q/A endpoint.
- Model fallback support when primary model is unavailable.
- Graceful error responses for 401/402/404 and generic failures.
- Student AI chat UI with suggestions and conversation feed.

### 2.10 Data Seeding
- Admin account seed from properties.
- Dummy course seed (8 courses) if course table is empty.

### 2.11 Professional UI/UX Revamp
- Unified modern design system (cards, badges, buttons, forms, tables).
- Improved Landing, Login, Register, Profile, Dashboard, Courses, Announcements, Sessions pages.
- Sidebar role-aware navigation.
- Better flow messaging (loading/toast/error/success states).

---

## 3. Core Functional Flows

## 3.1 Authentication Flow
1. User registers or logs in.
2. Backend validates credentials and role rules.
3. JWT is returned and stored in frontend local storage.
4. Axios interceptor attaches JWT to API requests.
5. ProtectedRoute and backend security rules enforce access control.

## 3.2 Student Enrollment Flow (Free Course)
1. Student opens Courses page.
2. Student selects a free course and confirms in modal.
3. Frontend calls POST /api/enrollments.
4. Backend validates student/course existence and duplicate enrollment.
5. Enrollment record is created.
6. UI updates enrolled state and shows success toast.

## 3.3 Student Enrollment Flow (Paid Course with Razorpay)
1. Student selects a paid course and clicks Pay & Enroll.
2. Frontend requests Razorpay order from backend.
3. Backend creates order via Razorpay API and returns order details.
4. Frontend opens Razorpay checkout popup.
5. On successful payment callback, frontend sends orderId/paymentId/signature to backend verify API.
6. Backend fetches order details, validates amount/currency/receipt, validates signature.
7. If valid, backend creates enrollment and returns success.
8. Frontend updates enrolled state and shows success message.

## 3.4 Admin Course Lifecycle Flow
1. Admin creates/updates/deletes courses via admin panel.
2. Delete operation removes dependent enrollments first (FK-safe).
3. Updated course list is reflected in student and admin views.

## 3.5 Announcement Publishing Flow
1. Admin creates or updates announcement with audience + active flag.
2. Backend stores announcement metadata.
3. Students/admin fetch relevant announcement lists by role.
4. Only active announcements for matching audiences are shown.

## 3.6 Session Scheduling Flow
1. Admin creates/updates session with start/end, mentor, mode, link/location.
2. Backend validates timing constraints.
3. Students fetch only upcoming active sessions.
4. Admin fetches complete session list for management.

## 3.7 AI Assistant Flow
1. Student sends prompt from AI Chat page.
2. Backend sends request to OpenRouter.
3. If primary model fails with 404, fallback models are tried.
4. Response is normalized and returned to frontend.
5. UI appends AI response into conversation thread.

---

## 4. API Surface (High-Level)

- Auth: /api/auth/register, /api/auth/login, /api/auth/me
- Courses: /api/courses (public list + admin CRUD)
- Enrollments: /api/enrollments, /api/enrollments/student/{id}, /api/enrollments/all
- Payments: /api/payments/razorpay/order, /api/payments/razorpay/verify
- Dashboard: /api/dashboard/stats
- Announcements: /api/announcements, /api/announcements/admin
- Sessions: /api/sessions/upcoming, /api/sessions/admin, /api/sessions CRUD
- AI: /api/ai/ask

---

## 5. Current Product Capabilities Snapshot

The platform now supports:
- Full coaching operations (courses, sessions, announcements).
- Student lifecycle (onboarding, profile enrichment, enrollments, AI support).
- Admin observability via dashboard and enrollments.
- Paid enrollment demo path through Razorpay sandbox.
- Production-leaning role security and API error handling.
- Cohesive professional UI across all major pages.

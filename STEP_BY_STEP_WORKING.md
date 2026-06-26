# BinaryStack Coaching Portal — Step-by-Step Functional Workflows

This document outlines the step-by-step logical flow of the entire application, tracing actions from the React user interface, through the Spring Boot API layer, to final database commits.

---

## 1. Authentication & Onboarding Flows

### Flow 1.1: Local Email & Password Registration
When a student registers directly on the portal without using Google:

1.  **Frontend Input**: The student navigates to `/register` (`RegisterPage.jsx`) and fills out:
    *   Name, Email, Password, Phone Number, City, Date of Birth.
    *   Education Level (e.g., Undergraduate, Graduate).
    *   Target Career Role (e.g., Backend Developer, Full Stack Engineer).
    *   Short Professional Bio.
2.  **Frontend Validation**:
    *   Ensures password is at least 8 characters.
    *   Ensures email format is valid.
    *   Checks if passwords match.
3.  **Backend Dispatch**: The frontend calls `POST /api/auth/register` with the JSON payload.
4.  **Backend Validation & Execution**:
    *   The `AuthController.register()` endpoint receives the request body mapping to a `RegisterRequest` DTO.
    *   **Age Check**: The custom annotation `@MinAge` triggers `MinAgeValidator.java` to ensure the student's date of birth indicates they are at least 15 years old.
    *   **Duplicate Check**: The database is queried: `userRepository.existsByEmail(email)`. If true, it throws a `BadRequestException` ("Email is already in use").
    *   **Password Hashing**: The raw password is sent to `passwordEncoder.encode()`, generating a secure BCrypt hash.
    *   **Save**: A new `User` entity is created, setting the role to `Role.STUDENT` and `passwordSet = true`.
    *   **JWT Generation**: A stateless token is generated using the user's details via `JwtUtil.generateToken()`.
5.  **Frontend Response**: The server returns an `AuthResponse` containing the user details and JWT. The frontend saves both in `localStorage`, updates the React `AuthContext` state, and navigates the user to `/student/dashboard`.

---

### Flow 1.2: Google OAuth2 Sign-In & Onboarding
When a student elects to use Google single sign-on:

1.  **Frontend Action**: The student clicks "Continue with Google" on `/login` or `/register`.
2.  **API Redirection**: The browser is redirected directly to:
    ```
    GET http://localhost:8080/oauth2/authorization/google
    ```
3.  **Security Handshake**: Spring Security redirects the client browser to Google's consent screen.
4.  **Google Callback**: Google redirects back to the backend endpoint `/login/oauth2/code/google` with an authorization code.
5.  **Identity Verification**: Spring Boot calls Google's user-info API, retrieving:
    *   `email` (e.g., `user@gmail.com`)
    *   `name` (e.g., `John Doe`)
6.  **Database Synchronization (`Oauth2AuthenticationSuccessHandler.java`)**:
    *   The backend searches for a user with the matching email.
    *   **Existing User**: It logs the sign-in and generates a JWT.
    *   **New User**: It automatically creates a student record in the database:
        *   `role` = `Role.STUDENT`
        *   `password` = `encode(UUID.randomUUID().toString())` (a random hash to satisfy database constraints).
        *   `password_set` = `false` (flagging that this user needs to configure a local password).
7.  **Client Redirect**: The backend redirects the user to the frontend:
    ```
    GET http://localhost:3000/oauth2/redirect?token=<JWT_TOKEN>
    ```
8.  **First-Time Password Modal**:
    *   `OAuth2RedirectHandler.jsx` reads the JWT from the URL and calls the backend profile endpoint `apiGetProfile()` to check user details.
    *   If `passwordSet` is `false`, the frontend displays a secure modal prompting the student to set a local password.
    *   Submitting the form calls `POST /api/auth/change-password` with the new password, which updates `passwordSet = true` in the DB.
    *   If the user skips this step, they can still access their dashboard but will only be able to log in using Google OAuth until a password is set.

---

## 2. Admin Management Flows

Administrators configure the coaching environment using CRUD endpoints.

```
 [Admin Dashboard]              [Controller / Service]              [JPA / Database]
         |                                |                                 |
         |-- 1. Create Course ----------->|                                 |
         |   (POST /api/courses)          |-- 2. Save new Course ----------->|
         |                                |                                 |
         |-- 3. Schedule Class Session -->|                                 |
         |   (POST /api/sessions)         |-- 4. Check times & Save ------->|
         |                                |                                 |
         |-- 5. Delete Course ----------->|                                 |
         |   (DELETE /api/courses/{id})   |-- 6. Delete linked enrollments ->|
         |                                |-- 7. Delete Course record ------>|
```

### Flow 2.1: Course Creation & Safety Deletion
1.  **Creation**: Admin inputs course title, description, price, total hours, and duration on `/admin/courses`.
    *   Submitting the form calls `POST /api/courses`.
    *   The backend validates that the price is non-negative and saves the course.
2.  **Safety Deletion**: If an Admin deletes a course:
    *   The frontend calls `DELETE /api/courses/{id}`.
    *   **Foreign Key Safety**: Before deleting the course from the `courses` table, the backend `CourseService.deleteCourse()` programmatically deletes all student enrollments associated with that course id. This prevents database reference errors due to foreign key constraints on the `enrollments` table.

---

### Flow 2.2: Class Scheduling & Session Management
1.  **Scheduling**: Admin navigates to `/admin/sessions` and fills out the session form:
    *   Title, Description, Mentor Name, Start Time, End Time, Mode (`ONLINE`/`OFFLINE`/`HYBRID`), and Meeting Link or Physical Location.
2.  **Timing Validation**:
    *   Submitting the form calls `POST /api/sessions`.
    *   The backend validates that the session's end time is after its start time. If invalid, it returns an HTTP `400 Bad Request` error.
3.  **Audience Visibility**: Saved sessions are flagged as active. Students can view scheduled sessions under `/student/schedule`, where expired sessions are automatically filtered out.

---

### Flow 2.3: Target Announcements
1.  **Creation**: Admin navigates to `/admin/announcements` to publish an alert.
    *   Audience filter options: `ALL` (everyone), `STUDENT` (students only), or `ADMIN` (admins only).
2.  **Query Visibility**:
    *   Students fetch announcements via `GET /api/announcements`. The backend queries:
        `SELECT * FROM announcements WHERE active = true AND audience IN ('ALL', 'STUDENT')`
    *   Admins fetch announcements via `GET /api/announcements/admin` to see all notices, including draft or inactive ones.

---

## 3. Course Enrollment & Payment Gateway Flows

The coaching portal handles two types of enrollment: free checkouts and paid checkouts (using the Razorpay Sandbox API).

### Flow 3.1: Free Course Direct Enrollment
1.  **Selection**: A student clicks "Enroll" on a course priced at `0.00` on the `/student/courses` page.
2.  **Backend Request**: The frontend skips the payment gateway and calls:
    ```
    POST /api/enrollments
    { "studentId": 10, "courseId": 2 }
    ```
3.  **Backend Verification**:
    *   Verifies the course price is `0.00`.
    *   Checks if the enrollment already exists. If it does, the server returns an HTTP `400 Bad Request` error.
4.  **Creation**: The backend saves a new record to the `enrollments` table and returns a status of `200 OK`. The course is then listed on the student's enrollments page.

---

### Flow 3.2: Paid Course Checkout (Razorpay Integration)
When a student selects a course with a price greater than `0.00`:

```
 [Student UI]                     [Coaching Backend]                   [Razorpay API]
      |                                   |                                   |
      |-- 1. Click Pay & Enroll --------->|                                   |
      |                                   |-- 2. Convert Price to Paise ------>|
      |                                   |-- 3. POST /orders ---------------->|
      |                                   |<-- 4. Returns Order ID -----------|
      |<-- 5. Send order details ---------|                                   |
      |                                   |                                   |
      |-- 6. Open checkout popup modal ---|                                   |
      |-- 7. Process Sandbox Payment -----|                                   |
      |<-- 8. Returns Payment Callback ---|                                   |
      |                                   |                                   |
      |-- 9. POST /verify payment ------->|                                   |
      |                                   |-- 10. Fetch order details ------->|
      |                                   |-- 11. Cryptographic HMAC Check ---|
      |                                   |-- 12. Create DB Enrollment -------|
      |<-- 13. Redirect to dashboard -----|                                   |
```

1.  **Initiating Payment**:
    *   The student clicks "Pay & Enroll".
    *   The frontend sends a request to `POST /api/payments/razorpay/order` with the student ID and course ID.
2.  **Order Generation**:
    *   The backend fetches the course price (e.g., `INR 499.00`) and converts it to paise: `499 * 100 = 49900`.
    *   It creates a unique receipt ID: `enroll_<student_id>_<course_id>_<timestamp>`.
    *   Using Basic Auth (incorporating the Razorpay Key ID and Secret), the backend calls Razorpay's `/orders` endpoint.
    *   Razorpay responds with an Order ID (e.g., `order_NzY5ODk0`). The backend sends this ID back to the React client.
3.  **Opening checkout modal**:
    *   The frontend loads the Razorpay SDK script and opens the checkout modal.
    *   The student enters test payment details.
4.  **Verification**:
    *   Upon successful payment, the modal returns three references to the frontend:
        *   `razorpay_order_id`
        *   `razorpay_payment_id`
        *   `razorpay_signature`
    *   The frontend sends these values to the backend verification endpoint: `/api/payments/razorpay/verify`.
5.  **Cryptographic Handshake & Enrollment**:
    *   The backend verifies the signature by generating an HMAC-SHA256 signature using the `orderId` and `paymentId` and comparing it to the signature returned by Razorpay.
    *   Once verified, it creates a database entry in the `enrollments` table, confirming the user is enrolled.

---

### Flow 3.3: Shopping Cart & Multi-Course Checkout
To enroll in multiple courses at once, students use the Shopping Cart:

1.  **Cart Updates**:
    *   Clicking "Add to Cart" sends a request to `POST /api/cart/add` with the student ID and course ID.
    *   The backend adds a record to the `cart_items` table (enforcing unique constraints so a course cannot be added twice).
2.  **Checking Out**:
    *   On the `/cart` page, the student clicks "Checkout".
    *   The frontend requests a cart checkout order from the backend.
    *   The backend queries the student's cart, sums the prices of all courses in the cart, and calls Razorpay to generate a single consolidated order for the total amount.
3.  **Payment Verification**:
    *   The student pays the total amount via the Razorpay popup.
    *   The frontend sends the payment signature and details to the backend verification endpoint `/api/cart/verify`.
4.  **Transaction Processing**:
    *   The backend verifies the payment signature against the total amount.
    *   Upon verification, it enrolls the student in all the courses from their cart, deletes those items from the `cart_items` table, and returns a success response.

---

## 4. Personalized AI Mentorship Flow

Students can consult a personalized AI assistant directly from their dashboards.

```
 [Student AI Page]               [Coaching Backend]               [OpenRouter AI]
         |                               |                               |
         |-- 1. Ask question ----------->|                               |
         |   (POST /api/ai/ask)          |-- 2. Fetch User Profile ------>|
         |                               |-- 3. Construct System Prompt ->|
         |                               |-- 4. Call GPT-5 (Primary) ---->|
         |                               |      (Fallback on 404 error)  |
         |                               |-- 5. Call GPT-4 (Fallback) --->|
         |                               |<-- 6. Returns AI response -----|
         |<-- 7. Display response -------|                               |
```

1.  **Question Submission**: The student submits a question via the chat interface (`AiChatPage.jsx`).
2.  **Context Injection**:
    *   The request goes to `POST /api/ai/ask`.
    *   The backend AI service checks the authentication context to find the logged-in user.
    *   It fetches the student's profile information (career goals, education level) and active course enrollments from the database.
    *   The service builds a customized system prompt, inserting this metadata before the student's question to personalize the query.
3.  **Sending the API Request**:
    *   The backend calls the OpenRouter chat completions endpoint, sending the prompt to the configured primary model (e.g., `openai/gpt-5.2`).
4.  **Fallback Logic**:
    *   If the primary model is unavailable (returns a `404` error), the backend automatically retries the request using alternative models (e.g., `openai/gpt-4o-mini`, `mistral-7b`) from the fallback list.
    *   If the request fails due to insufficient balance (`402` error) or authentication issues (`401` error), the backend returns a user-friendly error message rather than a generic server error.
5.  **Displaying the Response**: The backend returns the text response to the React frontend, which appends the message to the chat interface.

---

## 5. Course Review Flow

Students can rate and review courses they have completed.

1.  **Review Submission**: The student goes to their enrollments page, clicks "Write Review", selects a rating (1 to 5 stars), and writes a comment.
    *   The frontend sends a request to `POST /api/reviews`.
2.  **Verification**:
    *   The backend `ReviewService` validates that the user is enrolled in the course before accepting the review.
    *   It check the database to confirm the user hasn't already reviewed this course.
3.  **Database Commit**:
    *   The backend saves the review to the `reviews` table.
    *   The database updates the course's average rating, which is displayed on public course listings.

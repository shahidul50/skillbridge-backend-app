# 📖 SkillBridge API Documentation

This document provides a detailed overview of the available API endpoints in the SkillBridge Backend application, including request methods, input parameters, and example responses.

---

## 🔐 Authentication (Better Auth)
All authentication routes are prefixed with `/api/auth`. These are managed by `Better Auth`.

### 1. User Registration
- **URL**: `/api/auth/sign-up`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "STUDENT" // or "TUTOR"
  }
  ```
- **Response**: `200 OK` with session cookie and user data.

---

## 👤 Profile Management

### 1. Get Current User Profile
- **URL**: `/api/v1/profile/me`
- **Method**: `GET`
- **Headers**: Requires Authentication Cookie
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "avatar": "url-to-avatar"
    }
  }
  ```

### 2. Update User Profile
- **URL**: `/api/v1/profile/me`
- **Method**: `PUT`
- **Body**: `multipart/form-data`
  - `name`: String
  - `avatar`: File (optional)
- **Success Response**: `200 OK`

---

## 📚 Categories

### 1. Get All Categories
- **URL**: `/api/v1/categories`
- **Method**: `GET`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "uuid", "name": "Mathematics", "image": "img-url", "slug": "mathematics" }
    ]
  }
  ```

---

## 👨‍🏫 Tutors

### 1. Search Tutors (Public)
- **URL**: `/api/v1/tutors`
- **Method**: `GET`
- **Query Params**: `page`, `limit`, `searchTerm`, `category`, `minPrice`, `maxPrice`
- **Success Response**: Paginated list of tutors.

### 2. Get Tutor Details
- **URL**: `/api/v1/tutors/:profileId`
- **Method**: `GET`
- **Success Response**: Detailed profile including categories and reviews.

---

## 📅 Bookings

### 1. Create a Booking (Student Only)
- **URL**: `/api/v1/bookings`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "tutorProfileId": "tutor-uuid",
    "date": "2024-05-20",
    "startTime": "10:00",
    "endTime": "11:00",
    "paymentMethod": "BKASH",
    "transactionId": "TRX123456"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": { "id": "booking-uuid", "status": "PENDING" }
  }
  ```

---

## ⭐ Reviews

### 1. Create a Review
- **URL**: `/api/v1/reviews`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "bookingId": "booking-uuid",
    "rating": 5,
    "comment": "Excellent tutor!"
  }
  ```
- **Response**: `201 Created`

---

## 🛡️ Admin Endpoints (Admin Only)

### 1. Get Dashboard Stats
- **URL**: `/api/v1/admin/dashboard-stats`
- **Method**: `GET`

### 2. Manage Users
- **URL**: `/api/v1/admin/users`
- **Method**: `GET`
- **Action**: `PATCH /api/v1/admin/users/toggle-status/:id` to block/unblock.

---

## 💳 Payments

### 1. Verify Payment (Admin Only)
- **URL**: `/api/v1/payments/admin/verify/:id`
- **Method**: `PATCH`
- **Action**: Confirms student's transaction.

> [!TIP]
> For all protected routes, ensure you are sending the session cookie received during sign-in.

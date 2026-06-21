# 🚀 SkillBridge Backend App

Welcome to the **SkillBridge Backend**, a robust and scalable server-side application designed to power the SkillBridge platform. This platform seamlessly connects passionate students with expert tutors, facilitating a rich learning experience through scheduled sessions, secure payments, and interactive feedback.

---

## 🌟 Key Features

- **🔐 Secure Authentication**: Powered by `Better Auth` for seamless session management and user security.
- **🎓 Tutor & Student Profiles**: Dedicated profiles with detailed information, skills, and specialties.
- **📅 Booking System**: Robust scheduling system for managing learning sessions.
- **💳 Payment Integration**: Secure handling of transactions and payment statuses.
- **⭐ Review & Rating**: Peer-to-peer feedback system for transparency and quality assurance.
- **📁 Multimedia Support**: Efficient file and image uploads using `Cloudinary`.
- **📧 Automated Emails**: Integrated `Nodemailer` for notifications and account verifications.
- **🛡️ Admin Oversight**: Full administrative control panel for platform management.

---

## 🛠️ Technology Stack

| Category         | Technology          |
| :--------------- | :------------------ |
| **Runtime**      | Node.js             |
| **Language**     | TypeScript          |
| **Framework**    | Express.js          |
| **Database/ORM** | PostgreSQL & Prisma |
| **Auth**         | Better Auth         |
| **Validation**   | Zod                 |
| **Storage**      | Cloudinary          |
| **Deployment**   | Vercel              |

---

## 🏗️ Project Architecture

The project follows a modular architecture for better maintainability and scalability:

- **`src/modules`**: Contains business logic separated by domains (Auth, Booking, Tutor, etc.).
- **`src/middleware`**: Global and custom middlewares (Error handling, Auth, etc.).
- **`src/lib`**: Initialization of core libraries (Prisma, Auth, Cloudinary).
- **`prisma/schema`**: Modularized database schemas.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL Database
- npm or pnpm

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/shahidul50/skillbridge-backend-app.git
   cd skillbridge-backend-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL=your_postgresql_url
   BETTER_AUTH_SECRET=your_secret
   BETTER_AUTH_URL=http://localhost:5000
   PORT=5000
   APP_URL=http://localhost:3000
   EMAIL_USER=your_gmail
   EMAIL_PASS=your_app_password
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run Database Migrations:**

   ```bash
   npx prisma migrate dev
   ```

5. **Seed Admin Account (Optional):**

   ```bash
   npm run seed:admin
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server with hot-reload.
- `npm run build`: Compiles the TypeScript code and prepares for production.
- `npm run seed:admin`: Seeds the database with an initial admin user.
- `npx prisma generate`: Generates the Prisma client.

---

## 🛣️ API Endpoints Preview

For a comprehensive list of all endpoints, inputs, outputs, and examples, please refer to the [Detailed API Documentation](API.md).

| Method  | Endpoint                                | Description                    |
| :------ | :-------------------------------------- | :----------------------------- |
| `POST`  | `/api/auth/sign-up`                     | User Registration              |
| `GET`   | `/api/v1/profile/me`                    | Get Current User Profile       |
| `GET`   | `/api/v1/tutors`                        | List all tutors (Public)       |
| `POST`  | `/api/v1/bookings`                      | Create a new booking (Student) |
| `PATCH` | `/api/v1/admin/users/toggle-status/:id` | Block/Unblock User (Admin)     |

---

Developed with ❤️ by **Shahidul Islam**

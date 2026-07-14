var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// src/utils/emailSender.ts
import nodemailer from "nodemailer";

// src/lib/config.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
var config = {
  port: process.env.PORT ? Number(process.env.PORT) : 5e3,
  db_url: process.env.DATABASE_URL,
  better_auth_url: process.env.BETTER_AUTH_URL,
  app_url: process.env.APP_URL,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  seeding_acc_email: process.env.ADMIN_SEEDING_ACCOUNT_EMAIL,
  seeding_acc_name: process.env.ADMIN_SEEDING_ACCOUNT_NAME,
  seeding_acc_pass: process.env.ADMIN_SEEDING_ACCOUNT_PASSWORD
};
var config_default = config;

// src/utils/emailSender.ts
var sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config_default.email_user,
      pass: config_default.email_pass
    }
  });
  const mailOptions = {
    from: options.from || `"SkillBridge App" <${config_default.email_user}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };
  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// src/lib/auth.ts
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path2 from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config2 = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": '//user related schema\nenum Role {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nmodel User {\n  id            String    @id\n  name          String\n  email         String\n  emailVerified Boolean   @default(false)\n  image         String?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n\n  role        Role    @default(STUDENT)\n  phoneNumber String?\n  isActive    Boolean @default(true)\n\n  tutorProfile TutorProfile?\n  bookings     Booking[]\n  payments     Payment[]\n  reviews      Review[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Category {\n  id              String          @id @default(uuid())\n  name            String          @unique\n  image           String\n  createdAt       DateTime        @default(now())\n  tutorCategories TutorCategory[]\n\n  @@map("categories")\n}\n\nmodel ContactMessage {\n  id        String             @id @default(uuid())\n  fullName  String\n  email     String\n  role      ContactMessageRole // Student, Tutor\n  subject   String\n  message   String\n  isRead    Boolean            @default(false)\n  createdAt DateTime           @default(now())\n\n  @@map("contact_messages")\n}\n\nenum ContactMessageRole {\n  STUDENT\n  TUTOR\n}\n\n//student related schema\n\nenum BookingStatus {\n  PENDING\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel Booking {\n  id                 String           @id @default(uuid())\n  studentId          String //betterAuth user reference\n  user               User             @relation(fields: [studentId], references: [id], onDelete: Cascade)\n  tutorProfileId     String\n  availabilitySlotId String           @unique\n  price              Float\n  status             BookingStatus    @default(PENDING)\n  createdAt          DateTime         @default(now())\n  updatedAt          DateTime         @updatedAt\n  tutorProfile       TutorProfile     @relation(fields: [tutorProfileId], references: [id])\n  availabilitySlot   AvailabilitySlot @relation(fields: [availabilitySlotId], references: [id])\n  payment            Payment?\n  review             Review?\n  meetingLink        String?\n\n  @@index([studentId])\n  @@index([tutorProfileId])\n  @@index([status])\n  @@map("bookings")\n}\n\nenum PaymentStatus {\n  PENDING\n  SUCCESS\n  FAILED\n}\n\nenum PaymentMethod {\n  BKASH\n  NAGAD\n  ROKET\n  CREDITCARD\n  DEBITCARD\n}\n\nmodel Payment {\n  id            String        @id @default(uuid())\n  bookingId     String        @unique\n  studentId     String //betterAuth user reference\n  user          User          @relation(fields: [studentId], references: [id], onDelete: Cascade)\n  paymentMethod PaymentMethod // Bkash, Nagad, etc.\n  transactionId String        @unique\n  amount        Float\n  status        PaymentStatus @default(PENDING)\n  submittedAt   DateTime      @default(now())\n  verifiedAt    DateTime?\n\n  booking Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  @@index([studentId])\n  @@index([status])\n  @@index([transactionId])\n  @@map("payments")\n}\n\nenum PaymentAccountType {\n  PERSONAL\n  MERCHANT\n}\n\nmodel PlatformPaymentAccount {\n  id            String             @id @default(uuid())\n  method        PaymentMethod\n  accountNumber String\n  accountType   PaymentAccountType @default(PERSONAL)\n  isActive      Boolean            @default(true)\n\n  @@map("platform_payment_accounts")\n}\n\n// --- Reviews ---\nmodel Review {\n  id             String   @id @default(uuid())\n  bookingId      String   @unique\n  studentId      String //betterAuth user reference\n  user           User     @relation(fields: [studentId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n  rating         Int // 1 to 5\n  comment        String?  @db.Text\n  isFeatured     Boolean  @default(false)\n  createdAt      DateTime @default(now())\n\n  booking      Booking      @relation(fields: [bookingId], references: [id])\n  tutorProfile TutorProfile @relation(fields: [tutorProfileId], references: [id])\n\n  @@map("reviews")\n}\n\n//tutor related schema\n\nmodel TutorProfile {\n  id                          String                       @id @default(uuid())\n  userId                      String                       @unique //betterAuth user reference\n  user                        User                         @relation(fields: [userId], references: [id], onDelete: Cascade)\n  title                       String                       @db.VarChar(150)\n  bio                         String                       @db.Text\n  hourlyRate                  Int\n  experience                  String                       @db.Text\n  rating                      Float                        @default(0.0)\n  totalReviews                Int                          @default(0)\n  isProfileNew                Boolean                      @default(true)\n  createdAt                   DateTime                     @default(now())\n  updatedAt                   DateTime                     @updatedAt\n  tutorCategories             TutorCategory[]\n  tutorWeeklyAvailabilities   TutorWeeklyAvailability[]\n  tutorAvailabilityExceptions TutorAvailabilityException[]\n  availabilitySlots           AvailabilitySlot[]\n  bookings                    Booking[]\n  reviews                     Review[]\n\n  @@index([hourlyRate])\n  @@index([rating])\n  @@index([userId])\n  @@map("tutor_profiles")\n}\n\nmodel TutorCategory {\n  id             String       @id @default(uuid())\n  tutorProfileId String\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  categoryId     String\n  category       Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n  createdAt      DateTime     @default(now())\n\n  @@index([tutorProfileId])\n  @@index([categoryId])\n  @@map("tutor_categories")\n}\n\nmodel TutorWeeklyAvailability {\n  id             String       @id @default(uuid())\n  tutorProfileId String\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  dayOfWeek      String // Monday, Tuesday, etc.\n  startTime      String // "09:00"\n  endTime        String // "10:00"\n  isActive       Boolean      @default(true)\n  createdAt      DateTime     @default(now())\n\n  @@map("weekly_availabilities")\n}\n\nmodel TutorAvailabilityException {\n  id             String       @id @default(uuid())\n  tutorProfileId String\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  date           DateTime // Specific date for the exception\n  reason         String?      @db.Text\n  createdAt      DateTime     @default(now())\n\n  @@map("availability_exceptions")\n}\n\nmodel AvailabilitySlot {\n  id             String       @id @default(uuid())\n  tutorProfileId String\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  date           DateTime\n  startTime      String\n  endTime        String\n  isBooked       Boolean      @default(true)\n  createdAt      DateTime     @default(now())\n  booking        Booking?\n\n  @@index([tutorProfileId, date])\n  @@index([isBooked])\n  @@map("availability_slots")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config2.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"enum","type":"Role"},{"name":"phoneNumber","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"tutorCategories","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"}],"dbName":"categories"},"ContactMessage":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"fullName","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"ContactMessageRole"},{"name":"subject","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"contact_messages"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"BookingToUser"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"availabilitySlotId","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"availabilitySlot","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToBooking"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"},{"name":"meetingLink","kind":"scalar","type":"String"}],"dbName":"bookings"},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"PaymentStatus"},{"name":"submittedAt","kind":"scalar","type":"DateTime"},{"name":"verifiedAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"}],"dbName":"payments"},"PlatformPaymentAccount":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"method","kind":"enum","type":"PaymentMethod"},{"name":"accountNumber","kind":"scalar","type":"String"},{"name":"accountType","kind":"enum","type":"PaymentAccountType"},{"name":"isActive","kind":"scalar","type":"Boolean"}],"dbName":"platform_payment_accounts"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"ReviewToTutorProfile"}],"dbName":"reviews"},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"title","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Int"},{"name":"experience","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"isProfileNew","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"tutorCategories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"tutorWeeklyAvailabilities","kind":"object","type":"TutorWeeklyAvailability","relationName":"TutorProfileToTutorWeeklyAvailability"},{"name":"tutorAvailabilityExceptions","kind":"object","type":"TutorAvailabilityException","relationName":"TutorAvailabilityExceptionToTutorProfile"},{"name":"availabilitySlots","kind":"object","type":"AvailabilitySlot","relationName":"AvailabilitySlotToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToTutorProfile"}],"dbName":"tutor_profiles"},"TutorCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"tutor_categories"},"TutorWeeklyAvailability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToTutorWeeklyAvailability"},{"name":"dayOfWeek","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"weekly_availabilities"},"TutorAvailabilityException":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorAvailabilityExceptionToTutorProfile"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"reason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"availability_exceptions"},"AvailabilitySlot":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"AvailabilitySlotToTutorProfile"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"startTime","kind":"scalar","type":"String"},{"name":"endTime","kind":"scalar","type":"String"},{"name":"isBooked","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"AvailabilitySlotToBooking"}],"dbName":"availability_slots"}},"enums":{},"types":{}}');
config2.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","tutorProfile","tutorCategories","_count","category","tutorWeeklyAvailabilities","tutorAvailabilityExceptions","availabilitySlot","booking","payment","review","availabilitySlots","bookings","reviews","payments","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","ContactMessage.findUnique","ContactMessage.findUniqueOrThrow","ContactMessage.findFirst","ContactMessage.findFirstOrThrow","ContactMessage.findMany","ContactMessage.createOne","ContactMessage.createMany","ContactMessage.createManyAndReturn","ContactMessage.updateOne","ContactMessage.updateMany","ContactMessage.updateManyAndReturn","ContactMessage.upsertOne","ContactMessage.deleteOne","ContactMessage.deleteMany","ContactMessage.groupBy","ContactMessage.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","_avg","_sum","Booking.groupBy","Booking.aggregate","Payment.findUnique","Payment.findUniqueOrThrow","Payment.findFirst","Payment.findFirstOrThrow","Payment.findMany","Payment.createOne","Payment.createMany","Payment.createManyAndReturn","Payment.updateOne","Payment.updateMany","Payment.updateManyAndReturn","Payment.upsertOne","Payment.deleteOne","Payment.deleteMany","Payment.groupBy","Payment.aggregate","PlatformPaymentAccount.findUnique","PlatformPaymentAccount.findUniqueOrThrow","PlatformPaymentAccount.findFirst","PlatformPaymentAccount.findFirstOrThrow","PlatformPaymentAccount.findMany","PlatformPaymentAccount.createOne","PlatformPaymentAccount.createMany","PlatformPaymentAccount.createManyAndReturn","PlatformPaymentAccount.updateOne","PlatformPaymentAccount.updateMany","PlatformPaymentAccount.updateManyAndReturn","PlatformPaymentAccount.upsertOne","PlatformPaymentAccount.deleteOne","PlatformPaymentAccount.deleteMany","PlatformPaymentAccount.groupBy","PlatformPaymentAccount.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","TutorProfile.findUnique","TutorProfile.findUniqueOrThrow","TutorProfile.findFirst","TutorProfile.findFirstOrThrow","TutorProfile.findMany","TutorProfile.createOne","TutorProfile.createMany","TutorProfile.createManyAndReturn","TutorProfile.updateOne","TutorProfile.updateMany","TutorProfile.updateManyAndReturn","TutorProfile.upsertOne","TutorProfile.deleteOne","TutorProfile.deleteMany","TutorProfile.groupBy","TutorProfile.aggregate","TutorCategory.findUnique","TutorCategory.findUniqueOrThrow","TutorCategory.findFirst","TutorCategory.findFirstOrThrow","TutorCategory.findMany","TutorCategory.createOne","TutorCategory.createMany","TutorCategory.createManyAndReturn","TutorCategory.updateOne","TutorCategory.updateMany","TutorCategory.updateManyAndReturn","TutorCategory.upsertOne","TutorCategory.deleteOne","TutorCategory.deleteMany","TutorCategory.groupBy","TutorCategory.aggregate","TutorWeeklyAvailability.findUnique","TutorWeeklyAvailability.findUniqueOrThrow","TutorWeeklyAvailability.findFirst","TutorWeeklyAvailability.findFirstOrThrow","TutorWeeklyAvailability.findMany","TutorWeeklyAvailability.createOne","TutorWeeklyAvailability.createMany","TutorWeeklyAvailability.createManyAndReturn","TutorWeeklyAvailability.updateOne","TutorWeeklyAvailability.updateMany","TutorWeeklyAvailability.updateManyAndReturn","TutorWeeklyAvailability.upsertOne","TutorWeeklyAvailability.deleteOne","TutorWeeklyAvailability.deleteMany","TutorWeeklyAvailability.groupBy","TutorWeeklyAvailability.aggregate","TutorAvailabilityException.findUnique","TutorAvailabilityException.findUniqueOrThrow","TutorAvailabilityException.findFirst","TutorAvailabilityException.findFirstOrThrow","TutorAvailabilityException.findMany","TutorAvailabilityException.createOne","TutorAvailabilityException.createMany","TutorAvailabilityException.createManyAndReturn","TutorAvailabilityException.updateOne","TutorAvailabilityException.updateMany","TutorAvailabilityException.updateManyAndReturn","TutorAvailabilityException.upsertOne","TutorAvailabilityException.deleteOne","TutorAvailabilityException.deleteMany","TutorAvailabilityException.groupBy","TutorAvailabilityException.aggregate","AvailabilitySlot.findUnique","AvailabilitySlot.findUniqueOrThrow","AvailabilitySlot.findFirst","AvailabilitySlot.findFirstOrThrow","AvailabilitySlot.findMany","AvailabilitySlot.createOne","AvailabilitySlot.createMany","AvailabilitySlot.createManyAndReturn","AvailabilitySlot.updateOne","AvailabilitySlot.updateMany","AvailabilitySlot.updateManyAndReturn","AvailabilitySlot.upsertOne","AvailabilitySlot.deleteOne","AvailabilitySlot.deleteMany","AvailabilitySlot.groupBy","AvailabilitySlot.aggregate","AND","OR","NOT","id","tutorProfileId","date","startTime","endTime","isBooked","createdAt","equals","not","in","notIn","lt","lte","gt","gte","contains","startsWith","endsWith","reason","dayOfWeek","isActive","categoryId","userId","title","bio","hourlyRate","experience","rating","totalReviews","isProfileNew","updatedAt","every","some","none","bookingId","studentId","comment","isFeatured","PaymentMethod","method","accountNumber","PaymentAccountType","accountType","paymentMethod","transactionId","amount","PaymentStatus","status","submittedAt","verifiedAt","availabilitySlotId","price","BookingStatus","meetingLink","fullName","email","ContactMessageRole","role","subject","message","isRead","name","image","identifier","value","expiresAt","accountId","providerId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","emailVerified","Role","phoneNumber","is","isNot","connectOrCreate","upsert","disconnect","delete","connect","createMany","set","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "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-AgAA5wO-AiK_AkAAsQMAIcACQADoAwAhAQAAACEAIA4DAACyAwAgBgAA6wMAIA0AAOkDACCMAgAA6gMAMI0CAAAjABCOAgAA6gMAMI8CAQCtAwAhkAIBAK0DACGVAkAAsQMAIaoCAgCuAwAhsQIBAK0DACGyAgEArQMAIbMCAQDgAwAhtAIgALADACEBAAAAIwAgBgMAAJgFACAGAACgBgAgDAAAowYAIA4AAKQGACAPAAClBgAgxAIAAKcEACARAwAAsgMAIAYAAOsDACAMAADuAwAgDgAA7wMAIA8AAPADACCMAgAA7AMAMI0CAAAfABCOAgAA7AMAMI8CAQAAAAGQAgEArQMAIZUCQACxAwAhrQJAALEDACGyAgEArQMAIb4CAADtA8QCIsECAQAAAAHCAggArwMAIcQCAQDgAwAhAwAAAB8AIAEAACUAMAIAACYAIAQDAACYBQAgBgAAoAYAIA0AAKIGACCzAgAApwQAIA4DAACyAwAgBgAA6wMAIA0AAOkDACCMAgAA6gMAMI0CAAAjABCOAgAA6gMAMI8CAQAAAAGQAgEArQMAIZUCQACxAwAhqgICAK4DACGxAgEAAAABsgIBAK0DACGzAgEA4AMAIbQCIACwAwAhAwAAACMAIAEAACgAMAIAACkAIAEAAAANACABAAAAEwAgAQAAABcAIAEAAAAbACABAAAAHwAgAQAAACMAIAMAAAAfACABAAAlADACAAAmACADAwAAmAUAIA0AAKIGACDAAgAApwQAIA4DAACyAwAgDQAA6QMAIIwCAADmAwAwjQIAACEAEI4CAADmAwAwjwIBAAAAAbECAQAAAAGyAgEArQMAIboCAADCA7YCIrsCAQAAAAG8AggArwMAIb4CAADnA74CIr8CQACxAwAhwAJAAOgDACEDAAAAIQAgAQAAMgAwAgAAMwAgAwAAACMAIAEAACgAMAIAACkAIAEAAAADACABAAAABwAgAQAAAB8AIAEAAAAhACABAAAAIwAgAQAAAAEAIBMEAADiAwAgBQAA4wMAIAYAAOQDACARAAC3AwAgEgAAuAMAIBMAAOUDACCMAgAA3wMAMI0CAAA8ABCOAgAA3wMAMI8CAQCtAwAhlQJAALEDACGjAiAAsAMAIa0CQACxAwAhxgIBAK0DACHIAgAA4QPfAiLMAgEArQMAIc0CAQDgAwAh3QIgALADACHfAgEA4AMAIQgEAACeBgAgBQAAnwYAIAYAAKAGACARAACdBQAgEgAAngUAIBMAAKEGACDNAgAApwQAIN8CAACnBAAgAwAAADwAIAEAAD0AMAIAAAEAIAMAAAA8ACABAAA9ADACAAABACADAAAAPAAgAQAAPQAwAgAAAQAgEAQAAJgGACAFAACZBgAgBgAAmgYAIBEAAJsGACASAACdBgAgEwAAnAYAII8CAQAAAAGVAkAAAAABowIgAAAAAa0CQAAAAAHGAgEAAAAByAIAAADfAgLMAgEAAAABzQIBAAAAAd0CIAAAAAHfAgEAAAABARkAAEEAIAqPAgEAAAABlQJAAAAAAaMCIAAAAAGtAkAAAAABxgIBAAAAAcgCAAAA3wICzAIBAAAAAc0CAQAAAAHdAiAAAAAB3wIBAAAAAQEZAABDADABGQAAQwAwEAQAANcFACAFAADYBQAgBgAA2QUAIBEAANoFACASAADcBQAgEwAA2wUAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQIAAAABACAZAABGACAKjwIBAPwDACGVAkAA_QMAIaMCIAD-AwAhrQJAAP0DACHGAgEA_AMAIcgCAADWBd8CIswCAQD8AwAhzQIBAIgEACHdAiAA_gMAId8CAQCIBAAhAgAAADwAIBkAAEgAIAIAAAA8ACAZAABIACADAAAAAQAgIAAAQQAgIQAARgAgAQAAAAEAIAEAAAA8ACAFCAAA0wUAICYAANUFACAnAADUBQAgzQIAAKcEACDfAgAApwQAIA2MAgAA2wMAMI0CAABPABCOAgAA2wMAMI8CAQCVAwAhlQJAAJYDACGjAiAAlwMAIa0CQACWAwAhxgIBAJUDACHIAgAA3APfAiLMAgEAlQMAIc0CAQCgAwAh3QIgAJcDACHfAgEAoAMAIQMAAAA8ACABAABOADAlAABPACADAAAAPAAgAQAAPQAwAgAAAQAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAJAwAA0gUAII8CAQAAAAGVAkAAAAABpQIBAAAAAa0CQAAAAAHQAkAAAAAB2gIBAAAAAdsCAQAAAAHcAgEAAAABARkAAFcAIAiPAgEAAAABlQJAAAAAAaUCAQAAAAGtAkAAAAAB0AJAAAAAAdoCAQAAAAHbAgEAAAAB3AIBAAAAAQEZAABZADABGQAAWQAwCQMAANEFACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGtAkAA_QMAIdACQAD9AwAh2gIBAPwDACHbAgEAiAQAIdwCAQCIBAAhAgAAAAUAIBkAAFwAIAiPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGtAkAA_QMAIdACQAD9AwAh2gIBAPwDACHbAgEAiAQAIdwCAQCIBAAhAgAAAAMAIBkAAF4AIAIAAAADACAZAABeACADAAAABQAgIAAAVwAgIQAAXAAgAQAAAAUAIAEAAAADACAFCAAAzgUAICYAANAFACAnAADPBQAg2wIAAKcEACDcAgAApwQAIAuMAgAA2gMAMI0CAABlABCOAgAA2gMAMI8CAQCVAwAhlQJAAJYDACGlAgEAlQMAIa0CQACWAwAh0AJAAJYDACHaAgEAlQMAIdsCAQCgAwAh3AIBAKADACEDAAAAAwAgAQAAZAAwJQAAZQAgAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAAJACABAAAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgDgMAAM0FACCPAgEAAAABlQJAAAAAAaUCAQAAAAGtAkAAAAAB0QIBAAAAAdICAQAAAAHTAgEAAAAB1AIBAAAAAdUCAQAAAAHWAkAAAAAB1wJAAAAAAdgCAQAAAAHZAgEAAAABARkAAG0AIA2PAgEAAAABlQJAAAAAAaUCAQAAAAGtAkAAAAAB0QIBAAAAAdICAQAAAAHTAgEAAAAB1AIBAAAAAdUCAQAAAAHWAkAAAAAB1wJAAAAAAdgCAQAAAAHZAgEAAAABARkAAG8AMAEZAABvADAOAwAAzAUAII8CAQD8AwAhlQJAAP0DACGlAgEA_AMAIa0CQAD9AwAh0QIBAPwDACHSAgEA_AMAIdMCAQCIBAAh1AIBAIgEACHVAgEAiAQAIdYCQACeBAAh1wJAAJ4EACHYAgEAiAQAIdkCAQCIBAAhAgAAAAkAIBkAAHIAIA2PAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGtAkAA_QMAIdECAQD8AwAh0gIBAPwDACHTAgEAiAQAIdQCAQCIBAAh1QIBAIgEACHWAkAAngQAIdcCQACeBAAh2AIBAIgEACHZAgEAiAQAIQIAAAAHACAZAAB0ACACAAAABwAgGQAAdAAgAwAAAAkAICAAAG0AICEAAHIAIAEAAAAJACABAAAABwAgCggAAMkFACAmAADLBQAgJwAAygUAINMCAACnBAAg1AIAAKcEACDVAgAApwQAINYCAACnBAAg1wIAAKcEACDYAgAApwQAINkCAACnBAAgEIwCAADZAwAwjQIAAHsAEI4CAADZAwAwjwIBAJUDACGVAkAAlgMAIaUCAQCVAwAhrQJAAJYDACHRAgEAlQMAIdICAQCVAwAh0wIBAKADACHUAgEAoAMAIdUCAQCgAwAh1gJAAMYDACHXAkAAxgMAIdgCAQCgAwAh2QIBAKADACEDAAAABwAgAQAAegAwJQAAewAgAwAAAAcAIAEAAAgAMAIAAAkAIAmMAgAA2AMAMI0CAACBAQAQjgIAANgDADCPAgEAAAABlQJAALEDACGtAkAAsQMAIc4CAQCtAwAhzwIBAK0DACHQAkAAsQMAIQEAAAB-ACABAAAAfgAgCYwCAADYAwAwjQIAAIEBABCOAgAA2AMAMI8CAQCtAwAhlQJAALEDACGtAkAAsQMAIc4CAQCtAwAhzwIBAK0DACHQAkAAsQMAIQADAAAAgQEAIAEAAIIBADACAAB-ACADAAAAgQEAIAEAAIIBADACAAB-ACADAAAAgQEAIAEAAIIBADACAAB-ACAGjwIBAAAAAZUCQAAAAAGtAkAAAAABzgIBAAAAAc8CAQAAAAHQAkAAAAABARkAAIYBACAGjwIBAAAAAZUCQAAAAAGtAkAAAAABzgIBAAAAAc8CAQAAAAHQAkAAAAABARkAAIgBADABGQAAiAEAMAaPAgEA_AMAIZUCQAD9AwAhrQJAAP0DACHOAgEA_AMAIc8CAQD8AwAh0AJAAP0DACECAAAAfgAgGQAAiwEAIAaPAgEA_AMAIZUCQAD9AwAhrQJAAP0DACHOAgEA_AMAIc8CAQD8AwAh0AJAAP0DACECAAAAgQEAIBkAAI0BACACAAAAgQEAIBkAAI0BACADAAAAfgAgIAAAhgEAICEAAIsBACABAAAAfgAgAQAAAIEBACADCAAAxgUAICYAAMgFACAnAADHBQAgCYwCAADXAwAwjQIAAJQBABCOAgAA1wMAMI8CAQCVAwAhlQJAAJYDACGtAkAAlgMAIc4CAQCVAwAhzwIBAJUDACHQAkAAlgMAIQMAAACBAQAgAQAAkwEAMCUAAJQBACADAAAAgQEAIAEAAIIBADACAAB-ACAIBwAAswMAIIwCAADWAwAwjQIAAJoBABCOAgAA1gMAMI8CAQAAAAGVAkAAsQMAIcwCAQAAAAHNAgEArQMAIQEAAACXAQAgAQAAAJcBACAIBwAAswMAIIwCAADWAwAwjQIAAJoBABCOAgAA1gMAMI8CAQCtAwAhlQJAALEDACHMAgEArQMAIc0CAQCtAwAhAQcAAJkFACADAAAAmgEAIAEAAJsBADACAACXAQAgAwAAAJoBACABAACbAQAwAgAAlwEAIAMAAACaAQAgAQAAmwEAMAIAAJcBACAFBwAAxQUAII8CAQAAAAGVAkAAAAABzAIBAAAAAc0CAQAAAAEBGQAAnwEAIASPAgEAAAABlQJAAAAAAcwCAQAAAAHNAgEAAAABARkAAKEBADABGQAAoQEAMAUHAAC7BQAgjwIBAPwDACGVAkAA_QMAIcwCAQD8AwAhzQIBAPwDACECAAAAlwEAIBkAAKQBACAEjwIBAPwDACGVAkAA_QMAIcwCAQD8AwAhzQIBAPwDACECAAAAmgEAIBkAAKYBACACAAAAmgEAIBkAAKYBACADAAAAlwEAICAAAJ8BACAhAACkAQAgAQAAAJcBACABAAAAmgEAIAMIAAC4BQAgJgAAugUAICcAALkFACAHjAIAANUDADCNAgAArQEAEI4CAADVAwAwjwIBAJUDACGVAkAAlgMAIcwCAQCVAwAhzQIBAJUDACEDAAAAmgEAIAEAAKwBADAlAACtAQAgAwAAAJoBACABAACbAQAwAgAAlwEAIAuMAgAA0wMAMI0CAACzAQAQjgIAANMDADCPAgEAAAABlQJAALEDACHFAgEArQMAIcYCAQCtAwAhyAIAANQDyAIiyQIBAK0DACHKAgEArQMAIcsCIACwAwAhAQAAALABACABAAAAsAEAIAuMAgAA0wMAMI0CAACzAQAQjgIAANMDADCPAgEArQMAIZUCQACxAwAhxQIBAK0DACHGAgEArQMAIcgCAADUA8gCIskCAQCtAwAhygIBAK0DACHLAiAAsAMAIQADAAAAswEAIAEAALQBADACAACwAQAgAwAAALMBACABAAC0AQAwAgAAsAEAIAMAAACzAQAgAQAAtAEAMAIAALABACAIjwIBAAAAAZUCQAAAAAHFAgEAAAABxgIBAAAAAcgCAAAAyAICyQIBAAAAAcoCAQAAAAHLAiAAAAABARkAALgBACAIjwIBAAAAAZUCQAAAAAHFAgEAAAABxgIBAAAAAcgCAAAAyAICyQIBAAAAAcoCAQAAAAHLAiAAAAABARkAALoBADABGQAAugEAMAiPAgEA_AMAIZUCQAD9AwAhxQIBAPwDACHGAgEA_AMAIcgCAAC3BcgCIskCAQD8AwAhygIBAPwDACHLAiAA_gMAIQIAAACwAQAgGQAAvQEAIAiPAgEA_AMAIZUCQAD9AwAhxQIBAPwDACHGAgEA_AMAIcgCAAC3BcgCIskCAQD8AwAhygIBAPwDACHLAiAA_gMAIQIAAACzAQAgGQAAvwEAIAIAAACzAQAgGQAAvwEAIAMAAACwAQAgIAAAuAEAICEAAL0BACABAAAAsAEAIAEAAACzAQAgAwgAALQFACAmAAC2BQAgJwAAtQUAIAuMAgAAzwMAMI0CAADGAQAQjgIAAM8DADCPAgEAlQMAIZUCQACWAwAhxQIBAJUDACHGAgEAlQMAIcgCAADQA8gCIskCAQCVAwAhygIBAJUDACHLAiAAlwMAIQMAAACzAQAgAQAAxQEAMCUAAMYBACADAAAAswEAIAEAALQBADACAACwAQAgAQAAACYAIAEAAAAmACADAAAAHwAgAQAAJQAwAgAAJgAgAwAAAB8AIAEAACUAMAIAACYAIAMAAAAfACABAAAlADACAAAmACAOAwAAoQQAIAYAAKIEACAMAADgBAAgDgAAowQAIA8AAKQEACCPAgEAAAABkAIBAAAAAZUCQAAAAAGtAkAAAAABsgIBAAAAAb4CAAAAxAICwQIBAAAAAcICCAAAAAHEAgEAAAABARkAAM4BACAJjwIBAAAAAZACAQAAAAGVAkAAAAABrQJAAAAAAbICAQAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQEZAADQAQAwARkAANABADAOAwAAiQQAIAYAAIoEACAMAADeBAAgDgAAiwQAIA8AAIwEACCPAgEA_AMAIZACAQD8AwAhlQJAAP0DACGtAkAA_QMAIbICAQD8AwAhvgIAAIcExAIiwQIBAPwDACHCAggAhgQAIcQCAQCIBAAhAgAAACYAIBkAANMBACAJjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQIAAAAfACAZAADVAQAgAgAAAB8AIBkAANUBACADAAAAJgAgIAAAzgEAICEAANMBACABAAAAJgAgAQAAAB8AIAYIAACvBQAgJgAAsgUAICcAALEFACCIAQAAsAUAIIkBAACzBQAgxAIAAKcEACAMjAIAAMsDADCNAgAA3AEAEI4CAADLAwAwjwIBAJUDACGQAgEAlQMAIZUCQACWAwAhrQJAAJYDACGyAgEAlQMAIb4CAADMA8QCIsECAQCVAwAhwgIIAKgDACHEAgEAoAMAIQMAAAAfACABAADbAQAwJQAA3AEAIAMAAAAfACABAAAlADACAAAmACABAAAAMwAgAQAAADMAIAMAAAAhACABAAAyADACAAAzACADAAAAIQAgAQAAMgAwAgAAMwAgAwAAACEAIAEAADIAMAIAADMAIAsDAACgBAAgDQAArgUAII8CAQAAAAGxAgEAAAABsgIBAAAAAboCAAAAtgICuwIBAAAAAbwCCAAAAAG-AgAAAL4CAr8CQAAAAAHAAkAAAAABARkAAOQBACAJjwIBAAAAAbECAQAAAAGyAgEAAAABugIAAAC2AgK7AgEAAAABvAIIAAAAAb4CAAAAvgICvwJAAAAAAcACQAAAAAEBGQAA5gEAMAEZAADmAQAwCwMAAJ8EACANAACtBQAgjwIBAPwDACGxAgEA_AMAIbICAQD8AwAhugIAAJwEtgIiuwIBAPwDACG8AggAhgQAIb4CAACdBL4CIr8CQAD9AwAhwAJAAJ4EACECAAAAMwAgGQAA6QEAIAmPAgEA_AMAIbECAQD8AwAhsgIBAPwDACG6AgAAnAS2AiK7AgEA_AMAIbwCCACGBAAhvgIAAJ0EvgIivwJAAP0DACHAAkAAngQAIQIAAAAhACAZAADrAQAgAgAAACEAIBkAAOsBACADAAAAMwAgIAAA5AEAICEAAOkBACABAAAAMwAgAQAAACEAIAYIAACoBQAgJgAAqwUAICcAAKoFACCIAQAAqQUAIIkBAACsBQAgwAIAAKcEACAMjAIAAMQDADCNAgAA8gEAEI4CAADEAwAwjwIBAJUDACGxAgEAlQMAIbICAQCVAwAhugIAALsDtgIiuwIBAJUDACG8AggAqAMAIb4CAADFA74CIr8CQACWAwAhwAJAAMYDACEDAAAAIQAgAQAA8QEAMCUAAPIBACADAAAAIQAgAQAAMgAwAgAAMwAgCIwCAADBAwAwjQIAAPgBABCOAgAAwQMAMI8CAQAAAAGjAiAAsAMAIbYCAADCA7YCIrcCAQCtAwAhuQIAAMMDuQIiAQAAAPUBACABAAAA9QEAIAiMAgAAwQMAMI0CAAD4AQAQjgIAAMEDADCPAgEArQMAIaMCIACwAwAhtgIAAMIDtgIitwIBAK0DACG5AgAAwwO5AiIAAwAAAPgBACABAAD5AQAwAgAA9QEAIAMAAAD4AQAgAQAA-QEAMAIAAPUBACADAAAA-AEAIAEAAPkBADACAAD1AQAgBY8CAQAAAAGjAiAAAAABtgIAAAC2AgK3AgEAAAABuQIAAAC5AgIBGQAA_QEAIAWPAgEAAAABowIgAAAAAbYCAAAAtgICtwIBAAAAAbkCAAAAuQICARkAAP8BADABGQAA_wEAMAWPAgEA_AMAIaMCIAD-AwAhtgIAAJwEtgIitwIBAPwDACG5AgAApwW5AiICAAAA9QEAIBkAAIICACAFjwIBAPwDACGjAiAA_gMAIbYCAACcBLYCIrcCAQD8AwAhuQIAAKcFuQIiAgAAAPgBACAZAACEAgAgAgAAAPgBACAZAACEAgAgAwAAAPUBACAgAAD9AQAgIQAAggIAIAEAAAD1AQAgAQAAAPgBACADCAAApAUAICYAAKYFACAnAAClBQAgCIwCAAC6AwAwjQIAAIsCABCOAgAAugMAMI8CAQCVAwAhowIgAJcDACG2AgAAuwO2AiK3AgEAlQMAIbkCAAC8A7kCIgMAAAD4AQAgAQAAigIAMCUAAIsCACADAAAA-AEAIAEAAPkBADACAAD1AQAgAQAAACkAIAEAAAApACADAAAAIwAgAQAAKAAwAgAAKQAgAwAAACMAIAEAACgAMAIAACkAIAMAAAAjACABAAAoADACAAApACALAwAAlQQAIAYAAJYEACANAADSBAAgjwIBAAAAAZACAQAAAAGVAkAAAAABqgICAAAAAbECAQAAAAGyAgEAAAABswIBAAAAAbQCIAAAAAEBGQAAkwIAIAiPAgEAAAABkAIBAAAAAZUCQAAAAAGqAgIAAAABsQIBAAAAAbICAQAAAAGzAgEAAAABtAIgAAAAAQEZAACVAgAwARkAAJUCADALAwAAkwQAIAYAAJQEACANAADQBAAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhqgICAJIEACGxAgEA_AMAIbICAQD8AwAhswIBAIgEACG0AiAA_gMAIQIAAAApACAZAACYAgAgCI8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIaoCAgCSBAAhsQIBAPwDACGyAgEA_AMAIbMCAQCIBAAhtAIgAP4DACECAAAAIwAgGQAAmgIAIAIAAAAjACAZAACaAgAgAwAAACkAICAAAJMCACAhAACYAgAgAQAAACkAIAEAAAAjACAGCAAAnwUAICYAAKIFACAnAAChBQAgiAEAAKAFACCJAQAAowUAILMCAACnBAAgC4wCAAC5AwAwjQIAAKECABCOAgAAuQMAMI8CAQCVAwAhkAIBAJUDACGVAkAAlgMAIaoCAgCnAwAhsQIBAJUDACGyAgEAlQMAIbMCAQCgAwAhtAIgAJcDACEDAAAAIwAgAQAAoAIAMCUAAKECACADAAAAIwAgAQAAKAAwAgAAKQAgFQMAALIDACAHAACzAwAgCgAAtAMAIAsAALUDACAQAAC2AwAgEQAAtwMAIBIAALgDACCMAgAArAMAMI0CAAALABCOAgAArAMAMI8CAQAAAAGVAkAAsQMAIaUCAQAAAAGmAgEArQMAIacCAQCtAwAhqAICAK4DACGpAgEArQMAIaoCCACvAwAhqwICAK4DACGsAiAAsAMAIa0CQACxAwAhAQAAAKQCACABAAAApAIAIAcDAACYBQAgBwAAmQUAIAoAAJoFACALAACbBQAgEAAAnAUAIBEAAJ0FACASAACeBQAgAwAAAAsAIAEAAKcCADACAACkAgAgAwAAAAsAIAEAAKcCADACAACkAgAgAwAAAAsAIAEAAKcCADACAACkAgAgEgMAAJEFACAHAACSBQAgCgAAkwUAIAsAAJQFACAQAACVBQAgEQAAlgUAIBIAAJcFACCPAgEAAAABlQJAAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAagCAgAAAAGpAgEAAAABqgIIAAAAAasCAgAAAAGsAiAAAAABrQJAAAAAAQEZAACrAgAgC48CAQAAAAGVAkAAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABARkAAK0CADABGQAArQIAMBIDAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEAAAwgQAIBEAAMMEACASAADEBAAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIQIAAACkAgAgGQAAsAIAIAuPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhAgAAAAsAIBkAALICACACAAAACwAgGQAAsgIAIAMAAACkAgAgIAAAqwIAICEAALACACABAAAApAIAIAEAAAALACAFCAAAuQQAICYAALwEACAnAAC7BAAgiAEAALoEACCJAQAAvQQAIA6MAgAApgMAMI0CAAC5AgAQjgIAAKYDADCPAgEAlQMAIZUCQACWAwAhpQIBAJUDACGmAgEAlQMAIacCAQCVAwAhqAICAKcDACGpAgEAlQMAIaoCCACoAwAhqwICAKcDACGsAiAAlwMAIa0CQACWAwAhAwAAAAsAIAEAALgCADAlAAC5AgAgAwAAAAsAIAEAAKcCADACAACkAgAgAQAAAA8AIAEAAAAPACADAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAANACABAAAOADACAAAPACAGBgAAtwQAIAkAALgEACCPAgEAAAABkAIBAAAAAZUCQAAAAAGkAgEAAAABARkAAMECACAEjwIBAAAAAZACAQAAAAGVAkAAAAABpAIBAAAAAQEZAADDAgAwARkAAMMCADAGBgAAtQQAIAkAALYEACCPAgEA_AMAIZACAQD8AwAhlQJAAP0DACGkAgEA_AMAIQIAAAAPACAZAADGAgAgBI8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIaQCAQD8AwAhAgAAAA0AIBkAAMgCACACAAAADQAgGQAAyAIAIAMAAAAPACAgAADBAgAgIQAAxgIAIAEAAAAPACABAAAADQAgAwgAALIEACAmAAC0BAAgJwAAswQAIAeMAgAApQMAMI0CAADPAgAQjgIAAKUDADCPAgEAlQMAIZACAQCVAwAhlQJAAJYDACGkAgEAlQMAIQMAAAANACABAADOAgAwJQAAzwIAIAMAAAANACABAAAOADACAAAPACABAAAAFQAgAQAAABUAIAMAAAATACABAAAUADACAAAVACADAAAAEwAgAQAAFAAwAgAAFQAgAwAAABMAIAEAABQAMAIAABUAIAgGAACxBAAgjwIBAAAAAZACAQAAAAGSAgEAAAABkwIBAAAAAZUCQAAAAAGiAgEAAAABowIgAAAAAQEZAADXAgAgB48CAQAAAAGQAgEAAAABkgIBAAAAAZMCAQAAAAGVAkAAAAABogIBAAAAAaMCIAAAAAEBGQAA2QIAMAEZAADZAgAwCAYAALAEACCPAgEA_AMAIZACAQD8AwAhkgIBAPwDACGTAgEA_AMAIZUCQAD9AwAhogIBAPwDACGjAiAA_gMAIQIAAAAVACAZAADcAgAgB48CAQD8AwAhkAIBAPwDACGSAgEA_AMAIZMCAQD8AwAhlQJAAP0DACGiAgEA_AMAIaMCIAD-AwAhAgAAABMAIBkAAN4CACACAAAAEwAgGQAA3gIAIAMAAAAVACAgAADXAgAgIQAA3AIAIAEAAAAVACABAAAAEwAgAwgAAK0EACAmAACvBAAgJwAArgQAIAqMAgAApAMAMI0CAADlAgAQjgIAAKQDADCPAgEAlQMAIZACAQCVAwAhkgIBAJUDACGTAgEAlQMAIZUCQACWAwAhogIBAJUDACGjAiAAlwMAIQMAAAATACABAADkAgAwJQAA5QIAIAMAAAATACABAAAUADACAAAVACABAAAAGQAgAQAAABkAIAMAAAAXACABAAAYADACAAAZACADAAAAFwAgAQAAGAAwAgAAGQAgAwAAABcAIAEAABgAMAIAABkAIAYGAACsBAAgjwIBAAAAAZACAQAAAAGRAkAAAAABlQJAAAAAAaECAQAAAAEBGQAA7QIAIAWPAgEAAAABkAIBAAAAAZECQAAAAAGVAkAAAAABoQIBAAAAAQEZAADvAgAwARkAAO8CADAGBgAAqwQAII8CAQD8AwAhkAIBAPwDACGRAkAA_QMAIZUCQAD9AwAhoQIBAIgEACECAAAAGQAgGQAA8gIAIAWPAgEA_AMAIZACAQD8AwAhkQJAAP0DACGVAkAA_QMAIaECAQCIBAAhAgAAABcAIBkAAPQCACACAAAAFwAgGQAA9AIAIAMAAAAZACAgAADtAgAgIQAA8gIAIAEAAAAZACABAAAAFwAgBAgAAKgEACAmAACqBAAgJwAAqQQAIKECAACnBAAgCIwCAACfAwAwjQIAAPsCABCOAgAAnwMAMI8CAQCVAwAhkAIBAJUDACGRAkAAlgMAIZUCQACWAwAhoQIBAKADACEDAAAAFwAgAQAA-gIAMCUAAPsCACADAAAAFwAgAQAAGAAwAgAAGQAgAQAAAB0AIAEAAAAdACADAAAAGwAgAQAAHAAwAgAAHQAgAwAAABsAIAEAABwAMAIAAB0AIAMAAAAbACABAAAcADACAAAdACAJBgAApQQAIA0AAKYEACCPAgEAAAABkAIBAAAAAZECQAAAAAGSAgEAAAABkwIBAAAAAZQCIAAAAAGVAkAAAAABARkAAIMDACAHjwIBAAAAAZACAQAAAAGRAkAAAAABkgIBAAAAAZMCAQAAAAGUAiAAAAABlQJAAAAAAQEZAACFAwAwARkAAIUDADAJBgAA_wMAIA0AAIAEACCPAgEA_AMAIZACAQD8AwAhkQJAAP0DACGSAgEA_AMAIZMCAQD8AwAhlAIgAP4DACGVAkAA_QMAIQIAAAAdACAZAACIAwAgB48CAQD8AwAhkAIBAPwDACGRAkAA_QMAIZICAQD8AwAhkwIBAPwDACGUAiAA_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-AgKXAgAAyQO-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-AgAA5wO-AiK_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-AMAMI0CAAADABCOAgAA-AMAMI8CAQCtAwAhlQJAALEDACGlAgEArQMAIa0CQACxAwAh0AJAALEDACHaAgEArQMAIdsCAQDgAwAh3AIBAOADACEAAAAB6AIBAAAAAQHoAkAAAAABAegCIAAAAAEFIAAA5QYAICEAAIEHACDiAgAA5gYAIOMCAACABwAg5gIAAKQCACAHIAAAgQQAICEAAIQEACDiAgAAggQAIOMCAACDBAAg5AIAAB8AIOUCAAAfACDmAgAAJgAgDAMAAKEEACAGAACiBAAgDgAAowQAIA8AAKQEACCPAgEAAAABkAIBAAAAAZUCQAAAAAGtAkAAAAABsgIBAAAAAb4CAAAAxAICwgIIAAAAAcQCAQAAAAECAAAAJgAgIAAAgQQAIAMAAAAfACAgAACBBAAgIQAAhQQAIA4AAAAfACADAACJBAAgBgAAigQAIA4AAIsEACAPAACMBAAgGQAAhQQAII8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIa0CQAD9AwAhsgIBAPwDACG-AgAAhwTEAiLCAggAhgQAIcQCAQCIBAAhDAMAAIkEACAGAACKBAAgDgAAiwQAIA8AAIwEACCPAgEA_AMAIZACAQD8AwAhlQJAAP0DACGtAkAA_QMAIbICAQD8AwAhvgIAAIcExAIiwgIIAIYEACHEAgEAiAQAIQXoAggAAAAB6wIIAAAAAewCCAAAAAHtAggAAAAB7gIIAAAAAQHoAgAAAMQCAgHoAgEAAAABBSAAAOkGACAhAAD-BgAg4gIAAOoGACDjAgAA_QYAIOYCAAABACAFIAAA5wYAICEAAPsGACDiAgAA6AYAIOMCAAD6BgAg5gIAAKQCACAHIAAAlwQAICEAAJoEACDiAgAAmAQAIOMCAACZBAAg5AIAACEAIOUCAAAhACDmAgAAMwAgByAAAI0EACAhAACQBAAg4gIAAI4EACDjAgAAjwQAIOQCAAAjACDlAgAAIwAg5gIAACkAIAkDAACVBAAgBgAAlgQAII8CAQAAAAGQAgEAAAABlQJAAAAAAaoCAgAAAAGyAgEAAAABswIBAAAAAbQCIAAAAAECAAAAKQAgIAAAjQQAIAMAAAAjACAgAACNBAAgIQAAkQQAIAsAAAAjACADAACTBAAgBgAAlAQAIBkAAJEEACCPAgEA_AMAIZACAQD8AwAhlQJAAP0DACGqAgIAkgQAIbICAQD8AwAhswIBAIgEACG0AiAA_gMAIQkDAACTBAAgBgAAlAQAII8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIaoCAgCSBAAhsgIBAPwDACGzAgEAiAQAIbQCIAD-AwAhBegCAgAAAAHrAgIAAAAB7AICAAAAAe0CAgAAAAHuAgIAAAABBSAAAPIGACAhAAD4BgAg4gIAAPMGACDjAgAA9wYAIOYCAAABACAFIAAA8AYAICEAAPUGACDiAgAA8QYAIOMCAAD0BgAg5gIAAKQCACADIAAA8gYAIOICAADzBgAg5gIAAAEAIAMgAADwBgAg4gIAAPEGACDmAgAApAIAIAkDAACgBAAgjwIBAAAAAbICAQAAAAG6AgAAALYCArsCAQAAAAG8AggAAAABvgIAAAC-AgK_AkAAAAABwAJAAAAAAQIAAAAzACAgAACXBAAgAwAAACEAICAAAJcEACAhAACbBAAgCwAAACEAIAMAAJ8EACAZAACbBAAgjwIBAPwDACGyAgEA_AMAIboCAACcBLYCIrsCAQD8AwAhvAIIAIYEACG-AgAAnQS-AiK_AkAA_QMAIcACQACeBAAhCQMAAJ8EACCPAgEA_AMAIbICAQD8AwAhugIAAJwEtgIiuwIBAPwDACG8AggAhgQAIb4CAACdBL4CIr8CQAD9AwAhwAJAAJ4EACEB6AIAAAC2AgIB6AIAAAC-AgIB6AJAAAAAAQUgAADrBgAgIQAA7gYAIOICAADsBgAg4wIAAO0GACDmAgAAAQAgAyAAAOsGACDiAgAA7AYAIOYCAAABACADIAAA6QYAIOICAADqBgAg5gIAAAEAIAMgAADnBgAg4gIAAOgGACDmAgAApAIAIAMgAACXBAAg4gIAAJgEACDmAgAAMwAgAyAAAI0EACDiAgAAjgQAIOYCAAApACADIAAA5QYAIOICAADmBgAg5gIAAKQCACADIAAAgQQAIOICAACCBAAg5gIAACYAIAAAAAAFIAAA4AYAICEAAOMGACDiAgAA4QYAIOMCAADiBgAg5gIAAKQCACADIAAA4AYAIOICAADhBgAg5gIAAKQCACAAAAAFIAAA2wYAICEAAN4GACDiAgAA3AYAIOMCAADdBgAg5gIAAKQCACADIAAA2wYAIOICAADcBgAg5gIAAKQCACAAAAAFIAAA0wYAICEAANkGACDiAgAA1AYAIOMCAADYBgAg5gIAAKQCACAFIAAA0QYAICEAANYGACDiAgAA0gYAIOMCAADVBgAg5gIAAJcBACADIAAA0wYAIOICAADUBgAg5gIAAKQCACADIAAA0QYAIOICAADSBgAg5gIAAJcBACAAAAAAAAUgAAC8BgAgIQAAzwYAIOICAAC9BgAg4wIAAM4GACDmAgAAAQAgCyAAAIUFADAhAACKBQAw4gIAAIYFADDjAgAAhwUAMOQCAACJBQAw5QIAAIkFADDmAgAAiQUAMOcCAACIBQAg6AIAAIkFADDpAgAAiwUAMOoCAACMBQAwCyAAAPkEADAhAAD-BAAw4gIAAPoEADDjAgAA-wQAMOQCAAD9BAAw5QIAAP0EADDmAgAA_QQAMOcCAAD8BAAg6AIAAP0EADDpAgAA_wQAMOoCAACABQAwCyAAAO0EADAhAADyBAAw4gIAAO4EADDjAgAA7wQAMOQCAADxBAAw5QIAAPEEADDmAgAA8QQAMOcCAADwBAAg6AIAAPEEADDpAgAA8wQAMOoCAAD0BAAwCyAAAOEEADAhAADmBAAw4gIAAOIEADDjAgAA4wQAMOQCAADlBAAw5QIAAOUEADDmAgAA5QQAMOcCAADkBAAg6AIAAOUEADDpAgAA5wQAMOoCAADoBAAwCyAAANMEADAhAADYBAAw4gIAANQEADDjAgAA1QQAMOQCAADXBAAw5QIAANcEADDmAgAA1wQAMOcCAADWBAAg6AIAANcEADDpAgAA2QQAMOoCAADaBAAwCyAAAMUEADAhAADKBAAw4gIAAMYEADDjAgAAxwQAMOQCAADJBAAw5QIAAMkEADDmAgAAyQQAMOcCAADIBAAg6AIAAMkEADDpAgAAywQAMOoCAADMBAAwCQMAAJUEACANAADSBAAgjwIBAAAAAZUCQAAAAAGqAgIAAAABsQIBAAAAAbICAQAAAAGzAgEAAAABtAIgAAAAAQIAAAApACAgAADRBAAgAwAAACkAICAAANEEACAhAADPBAAgARkAAM0GADAOAwAAsgMAIAYAAOsDACANAADpAwAgjAIAAOoDADCNAgAAIwAQjgIAAOoDADCPAgEAAAABkAIBAK0DACGVAkAAsQMAIaoCAgCuAwAhsQIBAAAAAbICAQCtAwAhswIBAOADACG0AiAAsAMAIQIAAAApACAZAADPBAAgAgAAAM0EACAZAADOBAAgC4wCAADMBAAwjQIAAM0EABCOAgAAzAQAMI8CAQCtAwAhkAIBAK0DACGVAkAAsQMAIaoCAgCuAwAhsQIBAK0DACGyAgEArQMAIbMCAQDgAwAhtAIgALADACELjAIAAMwEADCNAgAAzQQAEI4CAADMBAAwjwIBAK0DACGQAgEArQMAIZUCQACxAwAhqgICAK4DACGxAgEArQMAIbICAQCtAwAhswIBAOADACG0AiAAsAMAIQePAgEA_AMAIZUCQAD9AwAhqgICAJIEACGxAgEA_AMAIbICAQD8AwAhswIBAIgEACG0AiAA_gMAIQkDAACTBAAgDQAA0AQAII8CAQD8AwAhlQJAAP0DACGqAgIAkgQAIbECAQD8AwAhsgIBAPwDACGzAgEAiAQAIbQCIAD-AwAhBSAAAMgGACAhAADLBgAg4gIAAMkGACDjAgAAygYAIOYCAAAmACAJAwAAlQQAIA0AANIEACCPAgEAAAABlQJAAAAAAaoCAgAAAAGxAgEAAAABsgIBAAAAAbMCAQAAAAG0AiAAAAABAyAAAMgGACDiAgAAyQYAIOYCAAAmACAMAwAAoQQAIAwAAOAEACAOAACjBAAgDwAApAQAII8CAQAAAAGVAkAAAAABrQJAAAAAAbICAQAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQIAAAAmACAgAADfBAAgAwAAACYAICAAAN8EACAhAADdBAAgARkAAMcGADARAwAAsgMAIAYAAOsDACAMAADuAwAgDgAA7wMAIA8AAPADACCMAgAA7AMAMI0CAAAfABCOAgAA7AMAMI8CAQAAAAGQAgEArQMAIZUCQACxAwAhrQJAALEDACGyAgEArQMAIb4CAADtA8QCIsECAQAAAAHCAggArwMAIcQCAQDgAwAhAgAAACYAIBkAAN0EACACAAAA2wQAIBkAANwEACAMjAIAANoEADCNAgAA2wQAEI4CAADaBAAwjwIBAK0DACGQAgEArQMAIZUCQACxAwAhrQJAALEDACGyAgEArQMAIb4CAADtA8QCIsECAQCtAwAhwgIIAK8DACHEAgEA4AMAIQyMAgAA2gQAMI0CAADbBAAQjgIAANoEADCPAgEArQMAIZACAQCtAwAhlQJAALEDACGtAkAAsQMAIbICAQCtAwAhvgIAAO0DxAIiwQIBAK0DACHCAggArwMAIcQCAQDgAwAhCI8CAQD8AwAhlQJAAP0DACGtAkAA_QMAIbICAQD8AwAhvgIAAIcExAIiwQIBAPwDACHCAggAhgQAIcQCAQCIBAAhDAMAAIkEACAMAADeBAAgDgAAiwQAIA8AAIwEACCPAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQUgAADCBgAgIQAAxQYAIOICAADDBgAg4wIAAMQGACDmAgAAHQAgDAMAAKEEACAMAADgBAAgDgAAowQAIA8AAKQEACCPAgEAAAABlQJAAAAAAa0CQAAAAAGyAgEAAAABvgIAAADEAgLBAgEAAAABwgIIAAAAAcQCAQAAAAEDIAAAwgYAIOICAADDBgAg5gIAAB0AIAcNAACmBAAgjwIBAAAAAZECQAAAAAGSAgEAAAABkwIBAAAAAZQCIAAAAAGVAkAAAAABAgAAAB0AICAAAOwEACADAAAAHQAgIAAA7AQAICEAAOsEACABGQAAwQYAMAwGAADrAwAgDQAA8gMAIIwCAADxAwAwjQIAABsAEI4CAADxAwAwjwIBAAAAAZACAQCtAwAhkQJAALEDACGSAgEArQMAIZMCAQCtAwAhlAIgALADACGVAkAAsQMAIQIAAAAdACAZAADrBAAgAgAAAOkEACAZAADqBAAgCowCAADoBAAwjQIAAOkEABCOAgAA6AQAMI8CAQCtAwAhkAIBAK0DACGRAkAAsQMAIZICAQCtAwAhkwIBAK0DACGUAiAAsAMAIZUCQACxAwAhCowCAADoBAAwjQIAAOkEABCOAgAA6AQAMI8CAQCtAwAhkAIBAK0DACGRAkAAsQMAIZICAQCtAwAhkwIBAK0DACGUAiAAsAMAIZUCQACxAwAhBo8CAQD8AwAhkQJAAP0DACGSAgEA_AMAIZMCAQD8AwAhlAIgAP4DACGVAkAA_QMAIQcNAACABAAgjwIBAPwDACGRAkAA_QMAIZICAQD8AwAhkwIBAPwDACGUAiAA_gMAIZUCQAD9AwAhBw0AAKYEACCPAgEAAAABkQJAAAAAAZICAQAAAAGTAgEAAAABlAIgAAAAAZUCQAAAAAEEjwIBAAAAAZECQAAAAAGVAkAAAAABoQIBAAAAAQIAAAAZACAgAAD4BAAgAwAAABkAICAAAPgEACAhAAD3BAAgARkAAMAGADAJBgAA6wMAIIwCAADzAwAwjQIAABcAEI4CAADzAwAwjwIBAAAAAZACAQCtAwAhkQJAALEDACGVAkAAsQMAIaECAQDgAwAhAgAAABkAIBkAAPcEACACAAAA9QQAIBkAAPYEACAIjAIAAPQEADCNAgAA9QQAEI4CAAD0BAAwjwIBAK0DACGQAgEArQMAIZECQACxAwAhlQJAALEDACGhAgEA4AMAIQiMAgAA9AQAMI0CAAD1BAAQjgIAAPQEADCPAgEArQMAIZACAQCtAwAhkQJAALEDACGVAkAAsQMAIaECAQDgAwAhBI8CAQD8AwAhkQJAAP0DACGVAkAA_QMAIaECAQCIBAAhBI8CAQD8AwAhkQJAAP0DACGVAkAA_QMAIaECAQCIBAAhBI8CAQAAAAGRAkAAAAABlQJAAAAAAaECAQAAAAEGjwIBAAAAAZICAQAAAAGTAgEAAAABlQJAAAAAAaICAQAAAAGjAiAAAAABAgAAABUAICAAAIQFACADAAAAFQAgIAAAhAUAICEAAIMFACABGQAAvwYAMAsGAADrAwAgjAIAAPQDADCNAgAAEwAQjgIAAPQDADCPAgEAAAABkAIBAK0DACGSAgEArQMAIZMCAQCtAwAhlQJAALEDACGiAgEArQMAIaMCIACwAwAhAgAAABUAIBkAAIMFACACAAAAgQUAIBkAAIIFACAKjAIAAIAFADCNAgAAgQUAEI4CAACABQAwjwIBAK0DACGQAgEArQMAIZICAQCtAwAhkwIBAK0DACGVAkAAsQMAIaICAQCtAwAhowIgALADACEKjAIAAIAFADCNAgAAgQUAEI4CAACABQAwjwIBAK0DACGQAgEArQMAIZICAQCtAwAhkwIBAK0DACGVAkAAsQMAIaICAQCtAwAhowIgALADACEGjwIBAPwDACGSAgEA_AMAIZMCAQD8AwAhlQJAAP0DACGiAgEA_AMAIaMCIAD-AwAhBo8CAQD8AwAhkgIBAPwDACGTAgEA_AMAIZUCQAD9AwAhogIBAPwDACGjAiAA_gMAIQaPAgEAAAABkgIBAAAAAZMCAQAAAAGVAkAAAAABogIBAAAAAaMCIAAAAAEECQAAuAQAII8CAQAAAAGVAkAAAAABpAIBAAAAAQIAAAAPACAgAACQBQAgAwAAAA8AICAAAJAFACAhAACPBQAgARkAAL4GADAJBgAA6wMAIAkAAPYDACCMAgAA9QMAMI0CAAANABCOAgAA9QMAMI8CAQAAAAGQAgEArQMAIZUCQACxAwAhpAIBAK0DACECAAAADwAgGQAAjwUAIAIAAACNBQAgGQAAjgUAIAeMAgAAjAUAMI0CAACNBQAQjgIAAIwFADCPAgEArQMAIZACAQCtAwAhlQJAALEDACGkAgEArQMAIQeMAgAAjAUAMI0CAACNBQAQjgIAAIwFADCPAgEArQMAIZACAQCtAwAhlQJAALEDACGkAgEArQMAIQOPAgEA_AMAIZUCQAD9AwAhpAIBAPwDACEECQAAtgQAII8CAQD8AwAhlQJAAP0DACGkAgEA_AMAIQQJAAC4BAAgjwIBAAAAAZUCQAAAAAGkAgEAAAABAyAAALwGACDiAgAAvQYAIOYCAAABACAEIAAAhQUAMOICAACGBQAw5gIAAIkFADDnAgAAiAUAIAQgAAD5BAAw4gIAAPoEADDmAgAA_QQAMOcCAAD8BAAgBCAAAO0EADDiAgAA7gQAMOYCAADxBAAw5wIAAPAEACAEIAAA4QQAMOICAADiBAAw5gIAAOUEADDnAgAA5AQAIAQgAADTBAAw4gIAANQEADDmAgAA1wQAMOcCAADWBAAgBCAAAMUEADDiAgAAxgQAMOYCAADJBAAw5wIAAMgEACAIBAAAngYAIAUAAJ8GACAGAACgBgAgEQAAnQUAIBIAAJ4FACATAAChBgAgzQIAAKcEACDfAgAApwQAIAAAAAAAAAAAAAAAAAAAAegCAAAAuQICAAAAAAAFIAAAtwYAICEAALoGACDiAgAAuAYAIOMCAAC5BgAg5gIAACYAIAMgAAC3BgAg4gIAALgGACDmAgAAJgAgAAAAAAAAAAAB6AIAAADIAgIAAAALIAAAvAUAMCEAAMAFADDiAgAAvQUAMOMCAAC-BQAw5AIAAIkFADDlAgAAiQUAMOYCAACJBQAw5wIAAL8FACDoAgAAiQUAMOkCAADBBQAw6gIAAIwFADAEBgAAtwQAII8CAQAAAAGQAgEAAAABlQJAAAAAAQIAAAAPACAgAADEBQAgAwAAAA8AICAAAMQFACAhAADDBQAgARkAALYGADACAAAADwAgGQAAwwUAIAIAAACNBQAgGQAAwgUAIAOPAgEA_AMAIZACAQD8AwAhlQJAAP0DACEEBgAAtQQAII8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIQQGAAC3BAAgjwIBAAAAAZACAQAAAAGVAkAAAAABBCAAALwFADDiAgAAvQUAMOYCAACJBQAw5wIAAL8FACAAAAAAAAAFIAAAsQYAICEAALQGACDiAgAAsgYAIOMCAACzBgAg5gIAAAEAIAMgAACxBgAg4gIAALIGACDmAgAAAQAgAAAABSAAAKwGACAhAACvBgAg4gIAAK0GACDjAgAArgYAIOYCAAABACADIAAArAYAIOICAACtBgAg5gIAAAEAIAAAAAHoAgAAAN8CAgsgAACMBgAwIQAAkQYAMOICAACNBgAw4wIAAI4GADDkAgAAkAYAMOUCAACQBgAw5gIAAJAGADDnAgAAjwYAIOgCAACQBgAw6QIAAJIGADDqAgAAkwYAMAsgAACABgAwIQAAhQYAMOICAACBBgAw4wIAAIIGADDkAgAAhAYAMOUCAACEBgAw5gIAAIQGADDnAgAAgwYAIOgCAACEBgAw6QIAAIYGADDqAgAAhwYAMAcgAAD7BQAgIQAA_gUAIOICAAD8BQAg4wIAAP0FACDkAgAACwAg5QIAAAsAIOYCAACkAgAgCyAAAPIFADAhAAD2BQAw4gIAAPMFADDjAgAA9AUAMOQCAADXBAAw5QIAANcEADDmAgAA1wQAMOcCAAD1BQAg6AIAANcEADDpAgAA9wUAMOoCAADaBAAwCyAAAOYFADAhAADrBQAw4gIAAOcFADDjAgAA6AUAMOQCAADqBQAw5QIAAOoFADDmAgAA6gUAMOcCAADpBQAg6AIAAOoFADDpAgAA7AUAMOoCAADtBQAwCyAAAN0FADAhAADhBQAw4gIAAN4FADDjAgAA3wUAMOQCAADJBAAw5QIAAMkEADDmAgAAyQQAMOcCAADgBQAg6AIAAMkEADDpAgAA4gUAMOoCAADMBAAwCQYAAJYEACANAADSBAAgjwIBAAAAAZACAQAAAAGVAkAAAAABqgICAAAAAbECAQAAAAGzAgEAAAABtAIgAAAAAQIAAAApACAgAADlBQAgAwAAACkAICAAAOUFACAhAADkBQAgARkAAKsGADACAAAAKQAgGQAA5AUAIAIAAADNBAAgGQAA4wUAIAePAgEA_AMAIZACAQD8AwAhlQJAAP0DACGqAgIAkgQAIbECAQD8AwAhswIBAIgEACG0AiAA_gMAIQkGAACUBAAgDQAA0AQAII8CAQD8AwAhkAIBAPwDACGVAkAA_QMAIaoCAgCSBAAhsQIBAPwDACGzAgEAiAQAIbQCIAD-AwAhCQYAAJYEACANAADSBAAgjwIBAAAAAZACAQAAAAGVAkAAAAABqgICAAAAAbECAQAAAAGzAgEAAAABtAIgAAAAAQkNAACuBQAgjwIBAAAAAbECAQAAAAG6AgAAALYCArsCAQAAAAG8AggAAAABvgIAAAC-AgK_AkAAAAABwAJAAAAAAQIAAAAzACAgAADxBQAgAwAAADMAICAAAPEFACAhAADwBQAgARkAAKoGADAOAwAAsgMAIA0AAOkDACCMAgAA5gMAMI0CAAAhABCOAgAA5gMAMI8CAQAAAAGxAgEAAAABsgIBAK0DACG6AgAAwgO2AiK7AgEAAAABvAIIAK8DACG-AgAA5wO-AiK_AkAAsQMAIcACQADoAwAhAgAAADMAIBkAAPAFACACAAAA7gUAIBkAAO8FACAMjAIAAO0FADCNAgAA7gUAEI4CAADtBQAwjwIBAK0DACGxAgEArQMAIbICAQCtAwAhugIAAMIDtgIiuwIBAK0DACG8AggArwMAIb4CAADnA74CIr8CQACxAwAhwAJAAOgDACEMjAIAAO0FADCNAgAA7gUAEI4CAADtBQAwjwIBAK0DACGxAgEArQMAIbICAQCtAwAhugIAAMIDtgIiuwIBAK0DACG8AggArwMAIb4CAADnA74CIr8CQACxAwAhwAJAAOgDACEIjwIBAPwDACGxAgEA_AMAIboCAACcBLYCIrsCAQD8AwAhvAIIAIYEACG-AgAAnQS-AiK_AkAA_QMAIcACQACeBAAhCQ0AAK0FACCPAgEA_AMAIbECAQD8AwAhugIAAJwEtgIiuwIBAPwDACG8AggAhgQAIb4CAACdBL4CIr8CQAD9AwAhwAJAAJ4EACEJDQAArgUAII8CAQAAAAGxAgEAAAABugIAAAC2AgK7AgEAAAABvAIIAAAAAb4CAAAAvgICvwJAAAAAAcACQAAAAAEMBgAAogQAIAwAAOAEACAOAACjBAAgDwAApAQAII8CAQAAAAGQAgEAAAABlQJAAAAAAa0CQAAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQIAAAAmACAgAAD6BQAgAwAAACYAICAAAPoFACAhAAD5BQAgARkAAKkGADACAAAAJgAgGQAA-QUAIAIAAADbBAAgGQAA-AUAIAiPAgEA_AMAIZACAQD8AwAhlQJAAP0DACGtAkAA_QMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQwGAACKBAAgDAAA3gQAIA4AAIsEACAPAACMBAAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACG-AgAAhwTEAiLBAgEA_AMAIcICCACGBAAhxAIBAIgEACEMBgAAogQAIAwAAOAEACAOAACjBAAgDwAApAQAII8CAQAAAAGQAgEAAAABlQJAAAAAAa0CQAAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAARAHAACSBQAgCgAAkwUAIAsAAJQFACAQAACVBQAgEQAAlgUAIBIAAJcFACCPAgEAAAABlQJAAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABAgAAAKQCACAgAAD7BQAgAwAAAAsAICAAAPsFACAhAAD_BQAgEgAAAAsAIAcAAL8EACAKAADABAAgCwAAwQQAIBAAAMIEACARAADDBAAgEgAAxAQAIBkAAP8FACCPAgEA_AMAIZUCQAD9AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIRAHAAC_BAAgCgAAwAQAIAsAAMEEACAQAADCBAAgEQAAwwQAIBIAAMQEACCPAgEA_AMAIZUCQAD9AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIQyPAgEAAAABlQJAAAAAAa0CQAAAAAHRAgEAAAAB0gIBAAAAAdMCAQAAAAHUAgEAAAAB1QIBAAAAAdYCQAAAAAHXAkAAAAAB2AIBAAAAAdkCAQAAAAECAAAACQAgIAAAiwYAIAMAAAAJACAgAACLBgAgIQAAigYAIAEZAACoBgAwEQMAALIDACCMAgAA9wMAMI0CAAAHABCOAgAA9wMAMI8CAQAAAAGVAkAAsQMAIaUCAQCtAwAhrQJAALEDACHRAgEArQMAIdICAQCtAwAh0wIBAOADACHUAgEA4AMAIdUCAQDgAwAh1gJAAOgDACHXAkAA6AMAIdgCAQDgAwAh2QIBAOADACECAAAACQAgGQAAigYAIAIAAACIBgAgGQAAiQYAIBCMAgAAhwYAMI0CAACIBgAQjgIAAIcGADCPAgEArQMAIZUCQACxAwAhpQIBAK0DACGtAkAAsQMAIdECAQCtAwAh0gIBAK0DACHTAgEA4AMAIdQCAQDgAwAh1QIBAOADACHWAkAA6AMAIdcCQADoAwAh2AIBAOADACHZAgEA4AMAIRCMAgAAhwYAMI0CAACIBgAQjgIAAIcGADCPAgEArQMAIZUCQACxAwAhpQIBAK0DACGtAkAAsQMAIdECAQCtAwAh0gIBAK0DACHTAgEA4AMAIdQCAQDgAwAh1QIBAOADACHWAkAA6AMAIdcCQADoAwAh2AIBAOADACHZAgEA4AMAIQyPAgEA_AMAIZUCQAD9AwAhrQJAAP0DACHRAgEA_AMAIdICAQD8AwAh0wIBAIgEACHUAgEAiAQAIdUCAQCIBAAh1gJAAJ4EACHXAkAAngQAIdgCAQCIBAAh2QIBAIgEACEMjwIBAPwDACGVAkAA_QMAIa0CQAD9AwAh0QIBAPwDACHSAgEA_AMAIdMCAQCIBAAh1AIBAIgEACHVAgEAiAQAIdYCQACeBAAh1wJAAJ4EACHYAgEAiAQAIdkCAQCIBAAhDI8CAQAAAAGVAkAAAAABrQJAAAAAAdECAQAAAAHSAgEAAAAB0wIBAAAAAdQCAQAAAAHVAgEAAAAB1gJAAAAAAdcCQAAAAAHYAgEAAAAB2QIBAAAAAQePAgEAAAABlQJAAAAAAa0CQAAAAAHQAkAAAAAB2gIBAAAAAdsCAQAAAAHcAgEAAAABAgAAAAUAICAAAJcGACADAAAABQAgIAAAlwYAICEAAJYGACABGQAApwYAMAwDAACyAwAgjAIAAPgDADCNAgAAAwAQjgIAAPgDADCPAgEAAAABlQJAALEDACGlAgEArQMAIa0CQACxAwAh0AJAALEDACHaAgEAAAAB2wIBAOADACHcAgEA4AMAIQIAAAAFACAZAACWBgAgAgAAAJQGACAZAACVBgAgC4wCAACTBgAwjQIAAJQGABCOAgAAkwYAMI8CAQCtAwAhlQJAALEDACGlAgEArQMAIa0CQACxAwAh0AJAALEDACHaAgEArQMAIdsCAQDgAwAh3AIBAOADACELjAIAAJMGADCNAgAAlAYAEI4CAACTBgAwjwIBAK0DACGVAkAAsQMAIaUCAQCtAwAhrQJAALEDACHQAkAAsQMAIdoCAQCtAwAh2wIBAOADACHcAgEA4AMAIQePAgEA_AMAIZUCQAD9AwAhrQJAAP0DACHQAkAA_QMAIdoCAQD8AwAh2wIBAIgEACHcAgEAiAQAIQePAgEA_AMAIZUCQAD9AwAhrQJAAP0DACHQAkAA_QMAIdoCAQD8AwAh2wIBAIgEACHcAgEAiAQAIQePAgEAAAABlQJAAAAAAa0CQAAAAAHQAkAAAAAB2gIBAAAAAdsCAQAAAAHcAgEAAAABBCAAAIwGADDiAgAAjQYAMOYCAACQBgAw5wIAAI8GACAEIAAAgAYAMOICAACBBgAw5gIAAIQGADDnAgAAgwYAIAMgAAD7BQAg4gIAAPwFACDmAgAApAIAIAQgAADyBQAw4gIAAPMFADDmAgAA1wQAMOcCAAD1BQAgBCAAAOYFADDiAgAA5wUAMOYCAADqBQAw5wIAAOkFACAEIAAA3QUAMOICAADeBQAw5gIAAMkEADDnAgAA4AUAIAAABwMAAJgFACAHAACZBQAgCgAAmgUAIAsAAJsFACAQAACcBQAgEQAAnQUAIBIAAJ4FACAABgMAAJgFACAGAACgBgAgDAAAowYAIA4AAKQGACAPAAClBgAgxAIAAKcEACACBgAAoAYAIA0AAKIGACADAwAAmAUAIA0AAKIGACDAAgAApwQAIAQDAACYBQAgBgAAoAYAIA0AAKIGACCzAgAApwQAIAEHAACZBQAgB48CAQAAAAGVAkAAAAABrQJAAAAAAdACQAAAAAHaAgEAAAAB2wIBAAAAAdwCAQAAAAEMjwIBAAAAAZUCQAAAAAGtAkAAAAAB0QIBAAAAAdICAQAAAAHTAgEAAAAB1AIBAAAAAdUCAQAAAAHWAkAAAAAB1wJAAAAAAdgCAQAAAAHZAgEAAAABCI8CAQAAAAGQAgEAAAABlQJAAAAAAa0CQAAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQiPAgEAAAABsQIBAAAAAboCAAAAtgICuwIBAAAAAbwCCAAAAAG-AgAAAL4CAr8CQAAAAAHAAkAAAAABB48CAQAAAAGQAgEAAAABlQJAAAAAAaoCAgAAAAGxAgEAAAABswIBAAAAAbQCIAAAAAEPBQAAmQYAIAYAAJoGACARAACbBgAgEgAAnQYAIBMAAJwGACCPAgEAAAABlQJAAAAAAaMCIAAAAAGtAkAAAAABxgIBAAAAAcgCAAAA3wICzAIBAAAAAc0CAQAAAAHdAiAAAAAB3wIBAAAAAQIAAAABACAgAACsBgAgAwAAADwAICAAAKwGACAhAACwBgAgEQAAADwAIAUAANgFACAGAADZBQAgEQAA2gUAIBIAANwFACATAADbBQAgGQAAsAYAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQ8FAADYBQAgBgAA2QUAIBEAANoFACASAADcBQAgEwAA2wUAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQ8EAACYBgAgBgAAmgYAIBEAAJsGACASAACdBgAgEwAAnAYAII8CAQAAAAGVAkAAAAABowIgAAAAAa0CQAAAAAHGAgEAAAAByAIAAADfAgLMAgEAAAABzQIBAAAAAd0CIAAAAAHfAgEAAAABAgAAAAEAICAAALEGACADAAAAPAAgIAAAsQYAICEAALUGACARAAAAPAAgBAAA1wUAIAYAANkFACARAADaBQAgEgAA3AUAIBMAANsFACAZAAC1BgAgjwIBAPwDACGVAkAA_QMAIaMCIAD-AwAhrQJAAP0DACHGAgEA_AMAIcgCAADWBd8CIswCAQD8AwAhzQIBAIgEACHdAiAA_gMAId8CAQCIBAAhDwQAANcFACAGAADZBQAgEQAA2gUAIBIAANwFACATAADbBQAgjwIBAPwDACGVAkAA_QMAIaMCIAD-AwAhrQJAAP0DACHGAgEA_AMAIcgCAADWBd8CIswCAQD8AwAhzQIBAIgEACHdAiAA_gMAId8CAQCIBAAhA48CAQAAAAGQAgEAAAABlQJAAAAAAQ0DAAChBAAgBgAAogQAIAwAAOAEACAPAACkBAAgjwIBAAAAAZACAQAAAAGVAkAAAAABrQJAAAAAAbICAQAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQIAAAAmACAgAAC3BgAgAwAAAB8AICAAALcGACAhAAC7BgAgDwAAAB8AIAMAAIkEACAGAACKBAAgDAAA3gQAIA8AAIwEACAZAAC7BgAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQ0DAACJBAAgBgAAigQAIAwAAN4EACAPAACMBAAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQ8EAACYBgAgBQAAmQYAIBEAAJsGACASAACdBgAgEwAAnAYAII8CAQAAAAGVAkAAAAABowIgAAAAAa0CQAAAAAHGAgEAAAAByAIAAADfAgLMAgEAAAABzQIBAAAAAd0CIAAAAAHfAgEAAAABAgAAAAEAICAAALwGACADjwIBAAAAAZUCQAAAAAGkAgEAAAABBo8CAQAAAAGSAgEAAAABkwIBAAAAAZUCQAAAAAGiAgEAAAABowIgAAAAAQSPAgEAAAABkQJAAAAAAZUCQAAAAAGhAgEAAAABBo8CAQAAAAGRAkAAAAABkgIBAAAAAZMCAQAAAAGUAiAAAAABlQJAAAAAAQgGAAClBAAgjwIBAAAAAZACAQAAAAGRAkAAAAABkgIBAAAAAZMCAQAAAAGUAiAAAAABlQJAAAAAAQIAAAAdACAgAADCBgAgAwAAABsAICAAAMIGACAhAADGBgAgCgAAABsAIAYAAP8DACAZAADGBgAgjwIBAPwDACGQAgEA_AMAIZECQAD9AwAhkgIBAPwDACGTAgEA_AMAIZQCIAD-AwAhlQJAAP0DACEIBgAA_wMAII8CAQD8AwAhkAIBAPwDACGRAkAA_QMAIZICAQD8AwAhkwIBAPwDACGUAiAA_gMAIZUCQAD9AwAhCI8CAQAAAAGVAkAAAAABrQJAAAAAAbICAQAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQ0DAAChBAAgBgAAogQAIAwAAOAEACAOAACjBAAgjwIBAAAAAZACAQAAAAGVAkAAAAABrQJAAAAAAbICAQAAAAG-AgAAAMQCAsECAQAAAAHCAggAAAABxAIBAAAAAQIAAAAmACAgAADIBgAgAwAAAB8AICAAAMgGACAhAADMBgAgDwAAAB8AIAMAAIkEACAGAACKBAAgDAAA3gQAIA4AAIsEACAZAADMBgAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQ0DAACJBAAgBgAAigQAIAwAAN4EACAOAACLBAAgjwIBAPwDACGQAgEA_AMAIZUCQAD9AwAhrQJAAP0DACGyAgEA_AMAIb4CAACHBMQCIsECAQD8AwAhwgIIAIYEACHEAgEAiAQAIQePAgEAAAABlQJAAAAAAaoCAgAAAAGxAgEAAAABsgIBAAAAAbMCAQAAAAG0AiAAAAABAwAAADwAICAAALwGACAhAADQBgAgEQAAADwAIAQAANcFACAFAADYBQAgEQAA2gUAIBIAANwFACATAADbBQAgGQAA0AYAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQ8EAADXBQAgBQAA2AUAIBEAANoFACASAADcBQAgEwAA2wUAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQSPAgEAAAABlQJAAAAAAcwCAQAAAAHNAgEAAAABAgAAAJcBACAgAADRBgAgEQMAAJEFACAKAACTBQAgCwAAlAUAIBAAAJUFACARAACWBQAgEgAAlwUAII8CAQAAAAGVAkAAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABAgAAAKQCACAgAADTBgAgAwAAAJoBACAgAADRBgAgIQAA1wYAIAYAAACaAQAgGQAA1wYAII8CAQD8AwAhlQJAAP0DACHMAgEA_AMAIc0CAQD8AwAhBI8CAQD8AwAhlQJAAP0DACHMAgEA_AMAIc0CAQD8AwAhAwAAAAsAICAAANMGACAhAADaBgAgEwAAAAsAIAMAAL4EACAKAADABAAgCwAAwQQAIBAAAMIEACARAADDBAAgEgAAxAQAIBkAANoGACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhEQMAAL4EACAKAADABAAgCwAAwQQAIBAAAMIEACARAADDBAAgEgAAxAQAII8CAQD8AwAhlQJAAP0DACGlAgEA_AMAIaYCAQD8AwAhpwIBAPwDACGoAgIAkgQAIakCAQD8AwAhqgIIAIYEACGrAgIAkgQAIawCIAD-AwAhrQJAAP0DACERAwAAkQUAIAcAAJIFACALAACUBQAgEAAAlQUAIBEAAJYFACASAACXBQAgjwIBAAAAAZUCQAAAAAGlAgEAAAABpgIBAAAAAacCAQAAAAGoAgIAAAABqQIBAAAAAaoCCAAAAAGrAgIAAAABrAIgAAAAAa0CQAAAAAECAAAApAIAICAAANsGACADAAAACwAgIAAA2wYAICEAAN8GACATAAAACwAgAwAAvgQAIAcAAL8EACALAADBBAAgEAAAwgQAIBEAAMMEACASAADEBAAgGQAA3wYAII8CAQD8AwAhlQJAAP0DACGlAgEA_AMAIaYCAQD8AwAhpwIBAPwDACGoAgIAkgQAIakCAQD8AwAhqgIIAIYEACGrAgIAkgQAIawCIAD-AwAhrQJAAP0DACERAwAAvgQAIAcAAL8EACALAADBBAAgEAAAwgQAIBEAAMMEACASAADEBAAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIREDAACRBQAgBwAAkgUAIAoAAJMFACAQAACVBQAgEQAAlgUAIBIAAJcFACCPAgEAAAABlQJAAAAAAaUCAQAAAAGmAgEAAAABpwIBAAAAAagCAgAAAAGpAgEAAAABqgIIAAAAAasCAgAAAAGsAiAAAAABrQJAAAAAAQIAAACkAgAgIAAA4AYAIAMAAAALACAgAADgBgAgIQAA5AYAIBMAAAALACADAAC-BAAgBwAAvwQAIAoAAMAEACAQAADCBAAgEQAAwwQAIBIAAMQEACAZAADkBgAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIREDAAC-BAAgBwAAvwQAIAoAAMAEACAQAADCBAAgEQAAwwQAIBIAAMQEACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhEQMAAJEFACAHAACSBQAgCgAAkwUAIAsAAJQFACARAACWBQAgEgAAlwUAII8CAQAAAAGVAkAAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABAgAAAKQCACAgAADlBgAgEQMAAJEFACAHAACSBQAgCgAAkwUAIAsAAJQFACAQAACVBQAgEgAAlwUAII8CAQAAAAGVAkAAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABAgAAAKQCACAgAADnBgAgDwQAAJgGACAFAACZBgAgBgAAmgYAIBIAAJ0GACATAACcBgAgjwIBAAAAAZUCQAAAAAGjAiAAAAABrQJAAAAAAcYCAQAAAAHIAgAAAN8CAswCAQAAAAHNAgEAAAAB3QIgAAAAAd8CAQAAAAECAAAAAQAgIAAA6QYAIA8EAACYBgAgBQAAmQYAIAYAAJoGACARAACbBgAgEgAAnQYAII8CAQAAAAGVAkAAAAABowIgAAAAAa0CQAAAAAHGAgEAAAAByAIAAADfAgLMAgEAAAABzQIBAAAAAd0CIAAAAAHfAgEAAAABAgAAAAEAICAAAOsGACADAAAAPAAgIAAA6wYAICEAAO8GACARAAAAPAAgBAAA1wUAIAUAANgFACAGAADZBQAgEQAA2gUAIBIAANwFACAZAADvBgAgjwIBAPwDACGVAkAA_QMAIaMCIAD-AwAhrQJAAP0DACHGAgEA_AMAIcgCAADWBd8CIswCAQD8AwAhzQIBAIgEACHdAiAA_gMAId8CAQCIBAAhDwQAANcFACAFAADYBQAgBgAA2QUAIBEAANoFACASAADcBQAgjwIBAPwDACGVAkAA_QMAIaMCIAD-AwAhrQJAAP0DACHGAgEA_AMAIcgCAADWBd8CIswCAQD8AwAhzQIBAIgEACHdAiAA_gMAId8CAQCIBAAhEQMAAJEFACAHAACSBQAgCgAAkwUAIAsAAJQFACAQAACVBQAgEQAAlgUAII8CAQAAAAGVAkAAAAABpQIBAAAAAaYCAQAAAAGnAgEAAAABqAICAAAAAakCAQAAAAGqAggAAAABqwICAAAAAawCIAAAAAGtAkAAAAABAgAAAKQCACAgAADwBgAgDwQAAJgGACAFAACZBgAgBgAAmgYAIBEAAJsGACATAACcBgAgjwIBAAAAAZUCQAAAAAGjAiAAAAABrQJAAAAAAcYCAQAAAAHIAgAAAN8CAswCAQAAAAHNAgEAAAAB3QIgAAAAAd8CAQAAAAECAAAAAQAgIAAA8gYAIAMAAAALACAgAADwBgAgIQAA9gYAIBMAAAALACADAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEAAAwgQAIBEAAMMEACAZAAD2BgAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIREDAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEAAAwgQAIBEAAMMEACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhAwAAADwAICAAAPIGACAhAAD5BgAgEQAAADwAIAQAANcFACAFAADYBQAgBgAA2QUAIBEAANoFACATAADbBQAgGQAA-QYAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQ8EAADXBQAgBQAA2AUAIAYAANkFACARAADaBQAgEwAA2wUAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQMAAAALACAgAADnBgAgIQAA_AYAIBMAAAALACADAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEAAAwgQAIBIAAMQEACAZAAD8BgAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIREDAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEAAAwgQAIBIAAMQEACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhAwAAADwAICAAAOkGACAhAAD_BgAgEQAAADwAIAQAANcFACAFAADYBQAgBgAA2QUAIBIAANwFACATAADbBQAgGQAA_wYAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQ8EAADXBQAgBQAA2AUAIAYAANkFACASAADcBQAgEwAA2wUAII8CAQD8AwAhlQJAAP0DACGjAiAA_gMAIa0CQAD9AwAhxgIBAPwDACHIAgAA1gXfAiLMAgEA_AMAIc0CAQCIBAAh3QIgAP4DACHfAgEAiAQAIQMAAAALACAgAADlBgAgIQAAggcAIBMAAAALACADAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEQAAwwQAIBIAAMQEACAZAACCBwAgjwIBAPwDACGVAkAA_QMAIaUCAQD8AwAhpgIBAPwDACGnAgEA_AMAIagCAgCSBAAhqQIBAPwDACGqAggAhgQAIasCAgCSBAAhrAIgAP4DACGtAkAA_QMAIREDAAC-BAAgBwAAvwQAIAoAAMAEACALAADBBAAgEQAAwwQAIBIAAMQEACCPAgEA_AMAIZUCQAD9AwAhpQIBAPwDACGmAgEA_AMAIacCAQD8AwAhqAICAJIEACGpAgEA_AMAIaoCCACGBAAhqwICAJIEACGsAiAA_gMAIa0CQAD9AwAhBwQGAgUKAwYMBAgADxExCxI1DRM0DAEDAAEBAwABCAMAAQcQBQgADgoWCAsaCRAeChEnCxIqDQIGAAQJAAYCBxEFCAAHAQcSAAEGAAQBBgAEAgYABA0gCwUDAAEGAAQMAAoOIgwPJA0CAwABDQALAwMAAQYABA0ACwYHKwAKLAALLQAQLgARLwASMAAFBDYABTcAETgAEjoAEzkAAAAAAwgAFCYAFScAFgAAAAMIABQmABUnABYBAwABAQMAAQMIABsmABwnAB0AAAADCAAbJgAcJwAdAQMAAQEDAAEDCAAiJgAjJwAkAAAAAwgAIiYAIycAJAAAAAMIAComACsnACwAAAADCAAqJgArJwAsAAADCAAxJgAyJwAzAAAAAwgAMSYAMicAMwAAAAMIADkmADonADsAAAADCAA5JgA6JwA7AwMAAQYABAwACgMDAAEGAAQMAAoFCABAJgBDJwBEiAEAQYkBAEIAAAAAAAUIAEAmAEMnAESIAQBBiQEAQgIDAAENAAsCAwABDQALBQgASSYATCcATYgBAEqJAQBLAAAAAAAFCABJJgBMJwBNiAEASokBAEsAAAADCABTJgBUJwBVAAAAAwgAUyYAVCcAVQMDAAEGAAQNAAsDAwABBgAEDQALBQgAWiYAXScAXogBAFuJAQBcAAAAAAAFCABaJgBdJwBeiAEAW4kBAFwBAwABAQMAAQUIAGMmAGYnAGeIAQBkiQEAZQAAAAAABQgAYyYAZicAZ4gBAGSJAQBlAgYABAkABgIGAAQJAAYDCABsJgBtJwBuAAAAAwgAbCYAbScAbgEGAAQBBgAEAwgAcyYAdCcAdQAAAAMIAHMmAHQnAHUBBgAEAQYABAMIAHomAHsnAHwAAAADCAB6JgB7JwB8AQYABAEGAAQDCACBASYAggEnAIMBAAAAAwgAgQEmAIIBJwCDARQCARU7ARY-ARc_ARhAARpCARtEEBxFER1HAR5JEB9KEiJLASNMASRNEChQEylRFypSAitTAixUAi1VAi5WAi9YAjBaEDFbGDJdAjNfEDRgGTVhAjZiAjdjEDhmGjlnHjpoAztpAzxqAz1rAz5sAz9uA0BwEEFxH0JzA0N1EER2IEV3A0Z4A0d5EEh8IUl9JUp_JkuAASZMgwEmTYQBJk6FASZPhwEmUIkBEFGKASdSjAEmU44BEFSPAShVkAEmVpEBJleSARBYlQEpWZYBLVqYAQZbmQEGXJwBBl2dAQZengEGX6ABBmCiARBhowEuYqUBBmOnARBkqAEvZakBBmaqAQZnqwEQaK4BMGmvATRqsQE1a7IBNWy1ATVttgE1brcBNW-5ATVwuwEQcbwBNnK-ATVzwAEQdMEBN3XCATV2wwE1d8QBEHjHATh5yAE8eskBC3vKAQt8ywELfcwBC37NAQt_zwELgAHRARCBAdIBPYIB1AELgwHWARCEAdcBPoUB2AELhgHZAQuHAdoBEIoB3QE_iwHeAUWMAd8BDI0B4AEMjgHhAQyPAeIBDJAB4wEMkQHlAQySAecBEJMB6AFGlAHqAQyVAewBEJYB7QFHlwHuAQyYAe8BDJkB8AEQmgHzAUibAfQBTpwB9gFPnQH3AU-eAfoBT58B-wFPoAH8AU-hAf4BT6IBgAIQowGBAlCkAYMCT6UBhQIQpgGGAlGnAYcCT6gBiAJPqQGJAhCqAYwCUqsBjQJWrAGOAg2tAY8CDa4BkAINrwGRAg2wAZICDbEBlAINsgGWAhCzAZcCV7QBmQINtQGbAhC2AZwCWLcBnQINuAGeAg25AZ8CELoBogJZuwGjAl-8AaUCBL0BpgIEvgGoAgS_AakCBMABqgIEwQGsAgTCAa4CEMMBrwJgxAGxAgTFAbMCEMYBtAJhxwG1AgTIAbYCBMkBtwIQygG6AmLLAbsCaMwBvAIFzQG9AgXOAb4CBc8BvwIF0AHAAgXRAcICBdIBxAIQ0wHFAmnUAccCBdUByQIQ1gHKAmrXAcsCBdgBzAIF2QHNAhDaAdACa9sB0QJv3AHSAgjdAdMCCN4B1AII3wHVAgjgAdYCCOEB2AII4gHaAhDjAdsCcOQB3QII5QHfAhDmAeACcecB4QII6AHiAgjpAeMCEOoB5gJy6wHnAnbsAegCCe0B6QIJ7gHqAgnvAesCCfAB7AIJ8QHuAgnyAfACEPMB8QJ39AHzAgn1AfUCEPYB9gJ49wH3Agn4AfgCCfkB-QIQ-gH8Ann7Af0CffwB_gIK_QH_Agr-AYADCv8BgQMKgAKCAwqBAoQDCoIChgMQgwKHA36EAokDCoUCiwMQhgKMA3-HAo0DCogCjgMKiQKPAxCKApIDgAGLApMDhAE"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config2.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config2);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  AvailabilitySlotScalarFieldEnum: () => AvailabilitySlotScalarFieldEnum,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  ContactMessageScalarFieldEnum: () => ContactMessageScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PlatformPaymentAccountScalarFieldEnum: () => PlatformPaymentAccountScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  TutorAvailabilityExceptionScalarFieldEnum: () => TutorAvailabilityExceptionScalarFieldEnum,
  TutorCategoryScalarFieldEnum: () => TutorCategoryScalarFieldEnum,
  TutorProfileScalarFieldEnum: () => TutorProfileScalarFieldEnum,
  TutorWeeklyAvailabilityScalarFieldEnum: () => TutorWeeklyAvailabilityScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.8.0",
  engine: "3c6e192761c0362d496ed980de936e2f3cebcd3a"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Category: "Category",
  ContactMessage: "ContactMessage",
  Booking: "Booking",
  Payment: "Payment",
  PlatformPaymentAccount: "PlatformPaymentAccount",
  Review: "Review",
  TutorProfile: "TutorProfile",
  TutorCategory: "TutorCategory",
  TutorWeeklyAvailability: "TutorWeeklyAvailability",
  TutorAvailabilityException: "TutorAvailabilityException",
  AvailabilitySlot: "AvailabilitySlot"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  role: "role",
  phoneNumber: "phoneNumber",
  isActive: "isActive"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  image: "image",
  createdAt: "createdAt"
};
var ContactMessageScalarFieldEnum = {
  id: "id",
  fullName: "fullName",
  email: "email",
  role: "role",
  subject: "subject",
  message: "message",
  isRead: "isRead",
  createdAt: "createdAt"
};
var BookingScalarFieldEnum = {
  id: "id",
  studentId: "studentId",
  tutorProfileId: "tutorProfileId",
  availabilitySlotId: "availabilitySlotId",
  price: "price",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  meetingLink: "meetingLink"
};
var PaymentScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  studentId: "studentId",
  paymentMethod: "paymentMethod",
  transactionId: "transactionId",
  amount: "amount",
  status: "status",
  submittedAt: "submittedAt",
  verifiedAt: "verifiedAt"
};
var PlatformPaymentAccountScalarFieldEnum = {
  id: "id",
  method: "method",
  accountNumber: "accountNumber",
  accountType: "accountType",
  isActive: "isActive"
};
var ReviewScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  studentId: "studentId",
  tutorProfileId: "tutorProfileId",
  rating: "rating",
  comment: "comment",
  isFeatured: "isFeatured",
  createdAt: "createdAt"
};
var TutorProfileScalarFieldEnum = {
  id: "id",
  userId: "userId",
  title: "title",
  bio: "bio",
  hourlyRate: "hourlyRate",
  experience: "experience",
  rating: "rating",
  totalReviews: "totalReviews",
  isProfileNew: "isProfileNew",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorCategoryScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  categoryId: "categoryId",
  createdAt: "createdAt"
};
var TutorWeeklyAvailabilityScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  dayOfWeek: "dayOfWeek",
  startTime: "startTime",
  endTime: "endTime",
  isActive: "isActive",
  createdAt: "createdAt"
};
var TutorAvailabilityExceptionScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  date: "date",
  reason: "reason",
  createdAt: "createdAt"
};
var AvailabilitySlotScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  date: "date",
  startTime: "startTime",
  endTime: "endTime",
  isBooked: "isBooked",
  createdAt: "createdAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path2.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${config_default.db_url}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import { createAuthMiddleware } from "better-auth/api";
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
    // or "mysql", "postgresql", ...etc
  }),
  baseURL: config_default.better_auth_url,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true
  },
  trustedOrigins: [config_default.app_url, "http://localhost:5000", "http://localhost:3000"],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT"
      },
      phoneNumber: {
        type: "string",
        required: false
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        required: false
      }
    }
  },
  advanced: {
    disableOriginCheck: false
  },
  hooks: {
    before: async (context) => {
      if (!context.request) {
        return context;
      }
      const url = new URL(context.request.url, config_default.better_auth_url);
      const body = context.body;
      if (url.pathname.endsWith("/sign-in/email")) {
        if (!context.body?.email) {
          throw new APIError("BAD_REQUEST", {
            message: "Email is required"
          });
        } else if (!context.body?.password) {
          throw new APIError("BAD_REQUEST", {
            message: "Password is required"
          });
        }
      }
      if (context.body?.role !== void 0 && context.body?.role !== "ADMIN" && context.body?.role !== "TUTOR" && context.body?.role !== "STUDENT") {
        throw new APIError("BAD_REQUEST", {
          message: "Role must be on of STUDENT or TUTOR"
        });
      }
      if (url.pathname.endsWith("/sign-up/email")) {
        const requestedRole = body?.role;
        const userEmail = body?.email?.toLowerCase();
        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail }
        });
        if (existingUser) {
          throw new APIError("BAD_REQUEST", {
            message: "This email is already registered. Please use another email."
          });
        }
        const superAdminEmail = config_default.seeding_acc_email;
        if (requestedRole === "ADMIN") {
          if (userEmail !== superAdminEmail) {
            context.body.role = "STUDENT";
          }
        }
      }
      return context;
    },
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const newAccount = ctx.context.returned;
        if (newAccount.user) {
          if (newAccount.user.role === "TUTOR") {
            try {
              await prisma.tutorProfile.create({
                data: {
                  userId: newAccount.user.id,
                  title: "New Tutor",
                  bio: "Bio is empty. Update your profile.",
                  hourlyRate: 0,
                  experience: "0"
                }
              });
              console.log("Tutor Profile Account Created");
            } catch (error) {
              console.log("Error creating Tutor Profile Account:", error);
            }
          }
        }
      }
    })
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const verificationUrl = `${config_default.app_url}/verify-email?token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Please verify your email address!",
        html: `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Email Verification</title>
                    <style>
                      body {
                        margin: 0;
                        padding: 0;
                        background-color: #f4f6f8;
                        font-family: Arial, Helvetica, sans-serif;
                      }

                      .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                      }

                      .header {
                        background-color: #0f172a;
                        color: #ffffff;
                        padding: 20px;
                        text-align: center;
                      }

                      .header h1 {
                        margin: 0;
                        font-size: 22px;
                      }

                      .content {
                        padding: 30px;
                        color: #334155;
                        line-height: 1.6;
                      }

                      .content h2 {
                        margin-top: 0;
                        font-size: 20px;
                        color: #0f172a;
                      }

                      .button-wrapper {
                        text-align: center;
                        margin: 30px 0;
                      }

                      .verify-button {
                        background-color: #2563eb;
                        color: #ffffff !important;
                        padding: 14px 28px;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 6px;
                        display: inline-block;
                      }

                      .verify-button:hover {
                        background-color: #1d4ed8;
                      }

                      .footer {
                        background-color: #f1f5f9;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                        color: #64748b;
                      }

                      .link {
                        word-break: break-all;
                        font-size: 13px;
                        color: #2563eb;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <!-- Header -->
                      <div class="header">
                        <h1>SkillBridge App</h1>
                      </div>

                      <!-- Content -->
                      <div class="content">
                        <h2>Verify Your Email Address</h2>
                        <p>
                          Hello ${user.name} <br /><br />
                          Thank you for registering on <strong>SkillBridge App</strong>.
                          Please confirm your email address to activate your account.
                        </p>

                        <div class="button-wrapper">
                          <a href="${verificationUrl}" class="verify-button">
                            Verify Email
                          </a>
                        </div>

                        <p>
                          If the button doesn\u2019t work, copy and paste the link below into your browser:
                        </p>

                        <p class="link">
                          ${verificationUrl}
                        </p>

                        <p>
                          This verification link will expire soon for security reasons.
                          If you did not create an account, you can safely ignore this email.
                        </p>

                        <p>
                          Regards, <br />
                          <strong>SkillBridge Team</strong>
                        </p>
                      </div>

                      <!-- Footer -->
                      <div class="footer">
                        \xA9 2026 SkillBridge. All rights reserved.
                      </div>
                    </div>
                  </body>
                  </html>
        `
      });
    }
  }
});

// src/utils/AppError.ts
var AppError = class extends Error {
  statusCode;
  code;
  isOperational;
  constructor(message, statusCode, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
};

// src/middleware/notFound.ts
var notFound = (req, res, next) => {
  const message = `Cannot find ${req.originalUrl} on this server!`;
  const error = new AppError(message, 404, "ROUTE_NOT_FOUND");
  next(error);
};
var notFound_default = notFound;

// src/middleware/globalErrorHandler.ts
import { APIError as APIError2 } from "better-auth/api";
import { ZodError } from "zod";
var errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "An unexpected error occurred.";
  let errorCode = err.code ?? "INTERNAL_SERVER_ERROR";
  let errorDetails = err;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code;
  } else if (err.name === "MulterError") {
    statusCode = 400;
    errorCode = "FILE_UPLOAD_ERROR";
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size is too large. Maximum limit is 3MB.";
    } else {
      message = err.message;
    }
  } else if (err.body?.code === "FAILED_TO_GET_SESSION" || err?.code === "ECONNREFUSED") {
    statusCode = 503;
    errorCode = "DATABASE_CONNECTION_ERROR";
    message = "Could not connect to the database. Please ensure your database server is running.";
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = err.issues.map((issue) => issue.message).join(", ");
    errorDetails = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
  } else if (err instanceof APIError2 || err.name === "BetterAuthError") {
    statusCode = err.status || 401;
    errorCode = err.code || "AUTH_ERROR";
    if (err.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      message = "This email is already registered.";
    }
  } else if (err?.code === "INVALID_EMAIL_OR_PASSWORD") {
    statusCode = 401;
    errorCode = "INVALID_EMAIL_OR_PASSWORD";
    message = "Invalid email or password. Please try again.";
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    errorCode = `PRISMA_${err.code}`;
    switch (err.code) {
      case "P2002":
        statusCode = 400;
        message = `Duplicate entry found for ${err.meta?.target || "field"}.`;
        break;
      case "P2025":
        statusCode = 404;
        message = "The requested record was not found.";
        break;
      default:
        statusCode = 400;
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    errorCode = "PRISMA_VALIDATION_ERROR";
    statusCode = 400;
    message = "Invalid data format. Please check your input.";
  }
  const isDev = process.env.NODE_ENV === "development";
  res.status(statusCode).json({
    success: false,
    code: errorCode,
    message,
    // Only include detailed error info in development mode
    error: isDev ? errorDetails : {},
    stack: isDev ? err.stack : void 0
  });
};
var globalErrorHandler_default = errorHandler;

// src/modules/category/category.router.ts
import { Router } from "express";

// src/modules/category/category.service.ts
var getAllCategories = async (payload) => {
  const whereOptions = payload.searchTerm ? {
    name: {
      contains: payload.searchTerm,
      mode: "insensitive"
    }
  } : {};
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where: whereOptions,
      skip: payload.skip,
      take: payload.limit,
      orderBy: {
        [payload.sortBy]: payload.sortOrder
      }
    }),
    prisma.category.count({ where: whereOptions })
  ]);
  return {
    data: categories,
    pagination: {
      total,
      page: payload.page,
      limit: payload.limit,
      totalPages: Math.ceil(total / payload.limit)
    }
  };
};
var isExistingCategory = async (name) => {
  return await prisma.category.findUnique({
    where: {
      name
    }
  });
};
var createCategory = async (data) => {
  return await prisma.category.create({
    data: {
      name: data.name,
      image: data.image
    }
  });
};
var getCategoryById = async (id) => {
  return await prisma.category.findUnique({
    where: {
      id
    }
  });
};
var updateCategory = async (id, data) => {
  return await prisma.category.update({
    where: {
      id
    },
    data
  });
};
var deleteCategory = async (id) => {
  const hasRelations = await prisma.tutorCategory.findFirst({
    where: {
      categoryId: id
    }
  });
  if (hasRelations) {
    throw new AppError("Cannot delete category as it is associated with tutors", 400, "RELATIONAL_DATA_EXIST");
  }
  return await prisma.category.delete({
    where: {
      id
    }
  });
};
var categoryService = {
  getAllCategories,
  createCategory,
  isExistingCategory,
  getCategoryById,
  updateCategory,
  deleteCategory
};
var category_service_default = categoryService;

// src/validation/category.validation.ts
import { z } from "zod";
var createCategorySchema = z.object({
  name: z.string({
    error: "Category name is required!"
  }).min(3, "Name must be at least 3 characters!")
});
var updateCategorySchema = z.object({
  name: z.string({
    error: "Category name is required!"
  }).min(3, "Name must be at least 3 characters!").optional()
});
var categoryQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? Number(val) : 1),
    limit: z.string().optional().transform((val) => val ? Number(val) : 10),
    sortBy: z.string().optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
    searchTerm: z.string().optional()
  })
});

// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: config_default.cloudinary_cloud_name,
  api_key: config_default.cloudinary_api_key,
  api_secret: config_default.cloudinary_api_secret
});
var cloudinary_default = cloudinary;

// src/modules/category/category.controller.ts
import fs from "fs/promises";
var getAllCategories2 = async (req, res, next) => {
  try {
    const validatedQuery = categoryQuerySchema.parse({
      query: req.query
    });
    const { page, limit, sortBy, sortOrder, searchTerm } = validatedQuery.query;
    const skip = (page - 1) * limit;
    const result = await category_service_default.getAllCategories({ page, limit, skip, sortBy, sortOrder, searchTerm });
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createCategory2 = async (req, res, next) => {
  let localFilePath = req.file?.path;
  try {
    if (!localFilePath) {
      throw new AppError("Category image is required", 400, "IMAGE_MISSING");
    }
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      throw validation.error;
    }
    const { name: categoryName } = validation.data;
    const isExistingCategory2 = await category_service_default.isExistingCategory(categoryName);
    if (isExistingCategory2) {
      throw new AppError("Category name already exists", 400, "DUPLICATE_ERROR");
    }
    const cloudinaryResult = await cloudinary_default.uploader.upload(localFilePath, {
      folder: "skillbridge/categories"
    });
    const categoryImageUrl = cloudinaryResult?.secure_url;
    const result = await category_service_default.createCategory({ name: categoryName, image: categoryImageUrl });
    if (result) {
      if (localFilePath) {
        await fs.unlink(localFilePath);
      }
    }
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result
    });
  } catch (err) {
    if (localFilePath) {
      await fs.unlink(localFilePath);
    }
    next(err);
  }
};
var updateCategory2 = async (req, res, next) => {
  let localFilePath = req.file?.path;
  try {
    const id = req.params.id;
    const existingCategory = await category_service_default.getCategoryById(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }
    const validation = updateCategorySchema.safeParse(req.body);
    if (!validation.success) {
      throw validation.error;
    }
    const { name: categoryName } = validation.data;
    const updateData = {};
    if (categoryName) {
      const isExistingCategory2 = await category_service_default.isExistingCategory(categoryName);
      if (isExistingCategory2 && isExistingCategory2.id !== id) {
        throw new AppError("Category name already exists", 400, "DUPLICATE_ERROR");
      }
      updateData.name = categoryName;
    }
    if (localFilePath) {
      const cloudinaryResult = await cloudinary_default.uploader.upload(localFilePath, {
        folder: "skillbridge/categories"
      });
      updateData.image = cloudinaryResult?.secure_url;
      const oldImageUrl = existingCategory.image;
      const publicId = extractPublicId(oldImageUrl);
      if (publicId) {
        await cloudinary_default.uploader.destroy(publicId);
      }
    }
    const result = await category_service_default.updateCategory(id, updateData);
    if (localFilePath) {
      await fs.unlink(localFilePath);
    }
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: result
    });
  } catch (err) {
    if (localFilePath) {
      await fs.unlink(localFilePath);
    }
    next(err);
  }
};
var deleteCategory2 = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existingCategory = await category_service_default.getCategoryById(id);
    if (!existingCategory) {
      throw new AppError("Category not found", 404);
    }
    const result = await category_service_default.deleteCategory(id);
    const imageUrl = existingCategory.image;
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      await cloudinary_default.uploader.destroy(publicId);
    }
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var extractPublicId = (url) => {
  const parts = url.split("/");
  const folderIndex = parts.indexOf("skillbridge");
  if (folderIndex !== -1) {
    const publicIdWithExtension = parts.slice(folderIndex).join("/");
    return publicIdWithExtension.split(".")[0];
  }
  return null;
};
var categoryController = {
  getAllCategories: getAllCategories2,
  createCategory: createCategory2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};
var category_controller_default = categoryController;

// src/middleware/authMiddleware.ts
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["STUDENT"] = "STUDENT";
  UserRole2["ADMIN"] = "ADMIN";
  UserRole2["TUTOR"] = "TUTOR";
  return UserRole2;
})(UserRole || {});
var auth2 = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!"
        });
      }
      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verify your email!"
        });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You don't have permission to access this resources!"
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var authMiddleware_default = auth2;

// src/middleware/uploadHandler.ts
import multer from "multer";
import path3 from "path";
import fs2 from "fs";
var isVercel = process.env.VERCEL || process.env.NODE_ENV === "production";
var uploadDir = isVercel ? "/tmp/uploads" : path3.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadDir)) {
  fs2.mkdirSync(uploadDir, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path3.extname(file.originalname));
  }
});
var fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only jpeg and png files are allowed", 400, "INVALID_FILE_TYPE"), false);
  }
};
var uploadHandler = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024
    // 3 MB
  }
});
var uploadHandler_default = uploadHandler;

// src/modules/category/category.router.ts
var router = Router();
router.get("/", category_controller_default.getAllCategories);
router.post("/", authMiddleware_default("ADMIN" /* ADMIN */), uploadHandler_default.single("image"), category_controller_default.createCategory);
router.patch("/:id", authMiddleware_default("ADMIN" /* ADMIN */), uploadHandler_default.single("image"), category_controller_default.updateCategory);
router.delete("/:id", authMiddleware_default("ADMIN" /* ADMIN */), category_controller_default.deleteCategory);
var categoryRouter = router;

// src/modules/tutor/tutor.router.ts
import { Router as Router2 } from "express";

// src/modules/tutor/tutor.service.ts
import { addDays, differenceInCalendarDays, differenceInMinutes, differenceInMonths, endOfDay, endOfMonth, format, formatDistanceToNow, isAfter, isBefore, isSameDay, parse, startOfDay, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
var getAllTutors = async (query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, categories, minPrice, maxPrice, minRating } = query;
  const whereConditions = { AND: [] };
  if (searchTerm) {
    whereConditions.AND.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { bio: { contains: searchTerm, mode: "insensitive" } },
        {
          user: {
            name: { contains: searchTerm, mode: "insensitive" }
          }
        }
      ]
    });
  }
  if (categories) {
    const categoryNames = categories.split(",");
    whereConditions.AND.push({
      tutorCategories: {
        some: {
          category: {
            name: { in: categoryNames, mode: "insensitive" }
          }
        }
      }
    });
  }
  if (minPrice !== void 0 || maxPrice !== void 0) {
    whereConditions.AND.push({
      hourlyRate: {
        gte: minPrice ?? 0,
        lte: maxPrice ?? 1e6
      }
    });
  }
  if (minRating !== void 0) {
    whereConditions.AND.push({
      rating: {
        gte: minRating
      }
    });
  }
  const skip = (page - 1) * limit;
  let orderBy = { [sortBy]: sortOrder };
  if (sortBy === "highest-rated") {
    orderBy = { rating: "desc" };
  } else if (sortBy === "low-to-high") {
    orderBy = { hourlyRate: "asc" };
  } else if (sortBy === "high-to-low") {
    orderBy = { hourlyRate: "desc" };
  } else if (sortBy === "most-reviews") {
    orderBy = { totalReviews: "desc" };
  }
  whereConditions.AND.push({
    user: {
      isActive: true
    },
    isProfileNew: false
  });
  const [tutors, total] = await Promise.all([
    prisma.tutorProfile.findMany({
      where: whereConditions.AND.length > 0 ? whereConditions : {},
      include: {
        // get tutor profile along with user data (name and image)
        user: {
          select: {
            name: true,
            image: true
          }
        },
        // include tutor categories with category name
        tutorCategories: {
          include: {
            category: {
              select: { name: true }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy
    }),
    prisma.tutorProfile.count({
      where: whereConditions.AND.length > 0 ? whereConditions : {}
    })
  ]);
  return {
    data: tutors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
var getTutorProfileByProfileId = async (tutorProfileId) => {
  const result = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, user: { isActive: true } },
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      },
      tutorCategories: {
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }
    }
  });
  if (!result) {
    throw new AppError("Tutor profile not found", 404);
  }
  const [completedBookings, reviewCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tutorProfileId,
        status: "COMPLETED"
      },
      include: {
        availabilitySlot: true
      }
    }),
    prisma.review.count({
      where: { tutorProfileId }
    })
  ]);
  let totalMinutes = 0;
  const studentIds = /* @__PURE__ */ new Set();
  completedBookings.forEach((booking) => {
    if (booking.availabilitySlot) {
      const start = parse(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date());
      const end = parse(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date());
      totalMinutes += differenceInMinutes(end, start);
    }
    studentIds.add(booking.studentId);
  });
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalClassHour = `${hours}h ${minutes}m`;
  const totalUniqueStudents = studentIds.size;
  const formattedReviews = result.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    studentName: review.user.name,
    studentImage: review.user.image || null,
    timeAgo: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
    // Output is: "2 days ago", "about 1 month ago" 
  }));
  return {
    ...result,
    reviews: formattedReviews,
    totalReviews: reviewCount,
    totalClassHour,
    totalUniqueStudents
  };
};
var getAvailableSlots = async (tutorProfileId, startDateStr) => {
  const options = { timeZone: "Asia/Dhaka", hour12: false };
  const todayStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
  const currentTimeStr = new Intl.DateTimeFormat("en-US", { ...options, hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date());
  const [cHours, cMinutes] = currentTimeStr.split(":").map(Number);
  const currentMinutes = cHours * 60 + cMinutes;
  const now = /* @__PURE__ */ new Date();
  const today = startOfDay(now);
  let startFrom = startDateStr ? startOfDay(new Date(startDateStr)) : today;
  if (isBefore(startFrom, today)) {
    throw new AppError("Cannot fetch slots for past dates", 400, "INVALID_DATE");
  }
  const daysDifference = differenceInCalendarDays(startFrom, today);
  if (daysDifference > 4) {
    throw new AppError("You can only fetch slots within 4 days from today", 400, "DATE_OUT_OF_RANGE");
  }
  const daysToGenerate = startDateStr ? 1 : 3;
  const availableSlots = [];
  const [weeklySchedules, exceptions, bookedSlots] = await Promise.all([
    prisma.tutorWeeklyAvailability.findMany({ where: { tutorProfileId, isActive: true } }),
    prisma.tutorAvailabilityException.findMany({ where: { tutorProfileId } }),
    prisma.availabilitySlot.findMany({
      where: { tutorProfileId, date: { gte: startFrom }, isBooked: true }
    })
  ]);
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startFrom, i);
    const dateString = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(currentDate);
    const dayName = new Intl.DateTimeFormat("en-US", { ...options, weekday: "long" }).format(currentDate);
    const isExceptionDay = exceptions.some((ex) => {
      const exDateStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ex.date));
      return exDateStr === dateString;
    });
    if (isExceptionDay) continue;
    const daySchedules = weeklySchedules.filter((ws) => ws.dayOfWeek === dayName);
    for (const schedule of daySchedules) {
      if (dateString === todayStr) {
        const [sHours, sMinutes] = schedule.startTime.split(":").map(Number);
        const slotStartMinutes = sHours * 60 + (sMinutes || 0);
        if (slotStartMinutes <= currentMinutes) {
          continue;
        }
      }
      const isAlreadyBooked = bookedSlots.some((bs) => {
        const bsDateStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(bs.date));
        return bsDateStr === dateString && bs.startTime === schedule.startTime && bs.endTime === schedule.endTime;
      });
      if (!isAlreadyBooked) {
        availableSlots.push({
          tutorProfileId,
          date: dateString,
          day: dayName,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });
      }
    }
  }
  return availableSlots;
};
var getTutorDetailsByUserId = async (userId) => {
  return await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      phoneNumber: true
    }
  });
};
var getTutorProfileByUserId = async (userId) => {
  return await prisma.tutorProfile.findUniqueOrThrow({
    where: {
      userId
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          phoneNumber: true
        }
      }
    }
  });
};
var updateTutorProfile = async (loggedTutorId, updatableData) => {
  return await prisma.$transaction(async (tx) => {
    let updatedTutor;
    let updateUserData = {};
    const hasUserProfileUpdate = Boolean(
      updatableData.userProfile.name !== void 0 || updatableData.userProfile.phoneNumber !== void 0 || updatableData.userProfile.image !== void 0
    );
    const hasTutorProfileUpdate = Boolean(
      updatableData.tutorProfile.title !== void 0 || updatableData.tutorProfile.bio !== void 0 || updatableData.tutorProfile.hourlyRate !== void 0 || updatableData.tutorProfile.experience !== void 0
    );
    if (hasUserProfileUpdate) {
      updateUserData = await tx.user.update({
        where: { id: loggedTutorId },
        data: updatableData.userProfile,
        select: {
          id: true,
          name: true,
          image: true,
          phoneNumber: true
        }
      });
    }
    if (hasTutorProfileUpdate) {
      updatedTutor = await tx.tutorProfile.update({
        where: { userId: loggedTutorId },
        data: updatableData.tutorProfile,
        select: {
          id: true,
          title: true,
          bio: true,
          hourlyRate: true,
          experience: true
        }
      });
    }
    const currentTutorProfile = await tx.tutorProfile.findUnique({
      where: { userId: loggedTutorId },
      select: {
        title: true,
        bio: true,
        hourlyRate: true,
        experience: true
      }
    });
    const currentUserProfile = await tx.user.findUnique({
      where: { id: loggedTutorId },
      select: {
        image: true
      }
    });
    const profileValues = {
      title: updatedTutor?.title ?? currentTutorProfile?.title ?? null,
      bio: updatedTutor?.bio ?? currentTutorProfile?.bio ?? null,
      hourlyRate: updatedTutor?.hourlyRate ?? currentTutorProfile?.hourlyRate ?? null,
      experience: updatedTutor?.experience ?? currentTutorProfile?.experience ?? null,
      image: updateUserData.image ?? currentUserProfile?.image ?? null
    };
    const isProfileCompleted = Boolean(profileValues.title && profileValues.title.trim() !== "" && profileValues.title !== "New Tutor") && Boolean(profileValues.bio && profileValues.bio.trim() !== "" && profileValues.bio !== "Bio is empty. Update your profile.") && typeof profileValues.hourlyRate === "number" && profileValues.hourlyRate > 0 && Boolean(profileValues.experience && profileValues.experience.trim() !== "" && profileValues.experience !== "0") && profileValues.image !== null && profileValues.image !== "";
    await tx.tutorProfile.update({
      where: { userId: loggedTutorId },
      data: { isProfileNew: !isProfileCompleted }
    });
    return { userData: updateUserData, tutorProfile: updatedTutor, isProfileNew: !isProfileCompleted };
  });
};
var getTutorSelectedCategories = async (tutorProfileId) => {
  return await prisma.tutorCategory.findMany({
    where: { tutorProfileId },
    select: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
};
var setTutorCategories = async (tutorProfileId, categoryIds) => {
  if (categoryIds.length > 1) {
    throw new AppError("You can only add one category at a time.", 400);
  }
  return await prisma.$transaction(async (tx) => {
    await tx.tutorCategory.deleteMany({
      where: { tutorProfileId }
    });
    const tutorCategoriesData = categoryIds.map((categoryId) => ({
      tutorProfileId,
      categoryId
    }));
    const result = await tx.tutorCategory.createMany({
      data: tutorCategoriesData
    });
    return result;
  });
};
var getTutorWeeklyAvailableSlots = async (tutorProfileId) => {
  return await prisma.tutorWeeklyAvailability.findMany({
    where: { tutorProfileId },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isActive: true
    },
    orderBy: {
      dayOfWeek: "asc"
    }
  });
};
var createTutorWeeklyAvailability = async (tutorProfileId, payload) => {
  const { dayOfWeek, startTime, endTime } = payload;
  const referenceDate = /* @__PURE__ */ new Date();
  const start = parse(startTime, "HH:mm", referenceDate);
  const end = parse(endTime, "HH:mm", referenceDate);
  const diffInMinutes = differenceInMinutes(end, start);
  if (diffInMinutes < 60) {
    throw new AppError(
      "The duration of the slot must be at least 1 hour.",
      400,
      "INVALID_DURATION"
    );
  }
  const isOverlapping = await prisma.tutorWeeklyAvailability.findFirst({
    where: {
      tutorProfileId,
      dayOfWeek,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } }
          ]
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } }
          ]
        }
      ]
    }
  });
  if (isOverlapping) {
    throw new AppError("This time slot overlaps with an existing schedule", 400, "OVERLAP_ERROR");
  }
  return await prisma.tutorWeeklyAvailability.create({
    data: {
      tutorProfileId,
      dayOfWeek,
      startTime,
      endTime
    }
  });
};
var updateTutorWeeklyAvailability = async (tutorProfileId, slotId, payload) => {
  const slot = await prisma.tutorWeeklyAvailability.findUnique({
    where: { id: slotId }
  });
  if (!slot) {
    throw new AppError("Time slot not found", 404, "NOT_FOUND");
  }
  if (slot.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to update this slot", 403, "FORBIDDEN");
  }
  return await prisma.tutorWeeklyAvailability.update({
    where: { id: slotId },
    data: { isActive: payload.isActive }
  });
};
var deleteTutorWeeklyAvailability = async (tutorProfileId, slotId) => {
  const slot = await prisma.tutorWeeklyAvailability.findUnique({
    where: { id: slotId }
  });
  if (!slot) {
    throw new AppError("Time slot not found", 404, "NOT_FOUND");
  }
  if (slot.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to delete this slot", 403, "FORBIDDEN");
  }
  return await prisma.tutorWeeklyAvailability.delete({
    where: { id: slotId }
  });
};
var getAllTutorException = async (tutorProfileId) => {
  return await prisma.tutorAvailabilityException.findMany({
    where: { tutorProfileId },
    orderBy: {
      date: "asc"
    }
  });
};
var createTutorException = async (tutorProfileId, payload) => {
  const today = startOfDay(/* @__PURE__ */ new Date());
  const exceptionDate = startOfDay(new Date(payload.date));
  if (isBefore(exceptionDate, today)) {
    throw new AppError("Cannot create exception for past dates", 400, "INVALID_DATE");
  }
  const existingException = await prisma.tutorAvailabilityException.findFirst({
    where: {
      tutorProfileId,
      date: exceptionDate
    }
  });
  if (existingException) {
    throw new AppError("An exception already exists for this date", 400, "DUPLICATE_ERROR");
  }
  const hasBookedSlot = await prisma.availabilitySlot.findFirst({
    where: {
      tutorProfileId,
      date: exceptionDate,
      isBooked: true
    }
  });
  if (hasBookedSlot) {
    throw new AppError(
      "Cannot create exception. You already have a booked slot on this date.",
      400,
      "BOOKING_EXISTS"
    );
  }
  return await prisma.tutorAvailabilityException.create({
    data: {
      tutorProfileId,
      date: exceptionDate,
      reason: payload.reason
    }
  });
};
var deleteTutorException = async (tutorProfileId, exceptionId) => {
  const exception = await prisma.tutorAvailabilityException.findUnique({
    where: { id: exceptionId }
  });
  if (!exception) {
    throw new AppError("Exception not found", 404, "NOT_FOUND");
  }
  if (exception.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to delete this exception", 403, "FORBIDDEN");
  }
  const today = startOfDay(/* @__PURE__ */ new Date());
  const exceptionDate = startOfDay(new Date(exception.date));
  if (!isBefore(today, exceptionDate)) {
    throw new AppError("Cannot delete exception on or after the exception date", 400, "INVALID_DATE");
  }
  return await prisma.tutorAvailabilityException.delete({
    where: { id: exceptionId }
  });
};
var getTutorAllSession = async (tutorProfileId, query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, status } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [
    { tutorProfileId }
  ];
  andConditions.push({
    status: { notIn: ["CANCELLED", "PENDING"] }
  });
  if (searchTerm) {
    const orConditions = [
      {
        user: {
          // student user relation
          name: { contains: searchTerm, mode: "insensitive" }
        }
      },
      {
        tutorProfile: {
          tutorCategories: {
            some: {
              category: {
                name: { contains: searchTerm, mode: "insensitive" }
              }
            }
          }
        }
      }
    ];
    let parsedDate = null;
    if (searchTerm.includes("/") || searchTerm.includes("-")) {
      const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})$/;
      if (dateRegex.test(searchTerm)) {
        if (searchTerm.includes("/")) {
          parsedDate = parse(searchTerm, "dd/MM/yyyy", /* @__PURE__ */ new Date());
        } else {
          parsedDate = new Date(searchTerm);
        }
      }
    }
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const start = startOfDay(parsedDate);
      const end = endOfDay(parsedDate);
      orConditions.push({
        availabilitySlot: {
          date: {
            gte: start,
            lte: end
          }
        }
      });
    }
    andConditions.push({ OR: orConditions });
  }
  if (status) {
    andConditions.push({ status });
  }
  const whereConditions = { AND: andConditions };
  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: [
        { availabilitySlot: { date: "desc" } },
        { availabilitySlot: { startTime: "desc" } }
      ],
      include: {
        user: { select: { name: true, image: true } },
        // student info
        availabilitySlot: true,
        tutorProfile: {
          include: {
            tutorCategories: {
              include: { category: { select: { name: true } } }
            }
          }
        }
      }
    }),
    prisma.booking.count({ where: whereConditions })
  ]);
  const formattedData = result.map((booking) => ({
    bookingId: booking.id,
    studentName: booking.user?.name || "N/A",
    studentImage: booking.user?.image || "",
    categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
    availabilitySlotDate: booking.availabilitySlot ? format(booking.availabilitySlot.date, "MMMM dd, yyyy") : "N/A",
    availabilityStartTime: booking.availabilitySlot ? format(parse(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    availabilityEndTime: booking.availabilitySlot ? format(parse(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    status: booking.status,
    meetingLink: booking.meetingLink
  }));
  return {
    data: formattedData,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var updateBookingStatus = async (tutorProfileId, bookingId, meetingLink) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { availabilitySlot: true }
  });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to update this booking", 403);
  }
  if (!booking.meetingLink || booking.meetingLink.trim() === "") {
    return await prisma.booking.update({
      where: { id: bookingId },
      data: { meetingLink }
    });
  }
  if (booking.status === "COMPLETED") {
    throw new AppError("This session has already been marked as completed.", 400);
  }
  if (booking.status !== "CONFIRMED") {
    throw new AppError(`Cannot complete a booking that is currently ${booking.status}`, 400);
  }
  const now = /* @__PURE__ */ new Date();
  const slotDate = format(booking.availabilitySlot.date, "yyyy-MM-dd");
  const sessionEndDateTime = parse(
    `${slotDate} ${booking.availabilitySlot.endTime}`,
    "yyyy-MM-dd HH:mm",
    /* @__PURE__ */ new Date()
  );
  if (!isAfter(now, sessionEndDateTime)) {
    throw new AppError("Session time has not ended yet. You cannot mark it as completed before the end time.", 400);
  }
  return await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" }
  });
};
var updateBookingMeetingLink = async (tutorProfileId, bookingId, payload) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to update this booking", 403);
  }
  if (booking.status !== "CONFIRMED") {
    throw new AppError(`Cannot update meeting link for a booking that is currently ${booking.status}`, 400);
  }
  return await prisma.booking.update({
    where: { id: bookingId },
    data: { meetingLink: payload.meetingLink }
  });
};
var getSessionDetailsByBookingId = async (tutorProfileId, bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { name: true, image: true } },
      // student info
      availabilitySlot: true,
      tutorProfile: {
        include: {
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      },
      review: {
        select: {
          rating: true,
          comment: true
        }
      }
    }
  });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.tutorProfileId !== tutorProfileId) {
    throw new AppError("You are not authorized to view this booking", 403);
  }
  const { availabilitySlot } = booking;
  let duration = 0;
  if (availabilitySlot) {
    const start = parse(availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date());
    const end = parse(availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date());
    duration = differenceInMinutes(end, start);
  }
  return {
    bookingId: booking.id,
    studentName: booking.user?.name || "N/A",
    studentImage: booking.user?.image || "",
    categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
    availabilitySlotDate: availabilitySlot ? format(availabilitySlot.date, "MMMM dd, yyyy") : "N/A",
    availabilityStartTime: availabilitySlot ? format(parse(availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    availabilityEndTime: availabilitySlot ? format(parse(availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    duration,
    status: booking.status,
    meetingLink: booking.meetingLink,
    review: booking.review ? {
      rating: booking.review.rating,
      comment: booking.review.comment || ""
    } : null
  };
};
var getUpcomingTutorSessions = async (tutorId, limit) => {
  const now = /* @__PURE__ */ new Date();
  const todayStart = startOfDay(now);
  const result = await prisma.booking.findMany({
    where: {
      tutorProfileId: tutorId,
      status: "CONFIRMED",
      availabilitySlot: {
        date: { gte: todayStart }
      }
    },
    orderBy: [
      { availabilitySlot: { date: "asc" } },
      { availabilitySlot: { startTime: "asc" } }
    ],
    take: limit * 5,
    // fetch extra to account for in-progress slot filtering
    include: {
      user: { select: { name: true, image: true } },
      availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      tutorProfile: {
        include: {
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      }
    }
  });
  return result.filter((booking) => {
    const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter(endDateTime, now);
  }).slice(0, limit);
};
var getDashboardMeta = async (tutorProfileId) => {
  const now = /* @__PURE__ */ new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
  const tutor = await prisma.tutorProfile.findUniqueOrThrow({
    where: { id: tutorProfileId },
    include: { user: { select: { name: true } } }
  });
  const todaySessionsResult = await prisma.booking.findMany({
    where: {
      tutorProfileId,
      status: { not: "CANCELLED" },
      availabilitySlot: {
        date: todayStart
      }
    },
    include: { availabilitySlot: true }
  });
  const todayUpcomingSessionsCount = todaySessionsResult.filter((booking) => {
    const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter(endDateTime, now);
  }).length;
  const totalCompletedSessions = await prisma.booking.count({
    where: { tutorProfileId, status: "COMPLETED" }
  });
  const currentMonthCompleted = await prisma.booking.count({
    where: {
      tutorProfileId,
      status: "COMPLETED",
      availabilitySlot: {
        date: { gte: currentMonthStart }
      }
    }
  });
  const lastMonthCompleted = await prisma.booking.count({
    where: {
      tutorProfileId,
      status: "COMPLETED",
      availabilitySlot: {
        date: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    }
  });
  const sessionGrowth = lastMonthCompleted === 0 ? currentMonthCompleted > 0 ? 100 : 0 : (currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted * 100;
  const totalEarningsResult = await prisma.booking.aggregate({
    where: { tutorProfileId, status: "COMPLETED" },
    _sum: { price: true }
  });
  const totalEarnings = totalEarningsResult._sum.price || 0;
  const currentMonthEarningsResult = await prisma.booking.aggregate({
    where: {
      tutorProfileId,
      status: "COMPLETED",
      availabilitySlot: {
        date: { gte: currentMonthStart }
      }
    },
    _sum: { price: true }
  });
  const currentMonthEarnings = currentMonthEarningsResult._sum.price || 0;
  const lastMonthEarningsResult = await prisma.booking.aggregate({
    where: {
      tutorProfileId,
      status: "COMPLETED",
      availabilitySlot: {
        date: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    },
    _sum: { price: true }
  });
  const lastMonthEarnings = lastMonthEarningsResult._sum.price || 0;
  const earningGrowth = lastMonthEarnings === 0 ? currentMonthEarnings > 0 ? 100 : 0 : (currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100;
  const currentMonthAvgRatingResult = await prisma.review.aggregate({
    where: {
      tutorProfileId,
      createdAt: { gte: currentMonthStart }
    },
    _avg: { rating: true }
  });
  const currentMonthAvgRating = currentMonthAvgRatingResult._avg.rating || 0;
  const lastMonthAvgRatingResult = await prisma.review.aggregate({
    where: {
      tutorProfileId,
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
    },
    _avg: { rating: true }
  });
  const lastMonthAvgRating = lastMonthAvgRatingResult._avg.rating || 0;
  let ratingStatus = "Steady";
  if (currentMonthAvgRating > lastMonthAvgRating) ratingStatus = "Up";
  else if (currentMonthAvgRating < lastMonthAvgRating) ratingStatus = "Down";
  const todayConfirmedUpcomingCount = todaySessionsResult.filter((booking) => {
    if (booking.status !== "CONFIRMED") return false;
    const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter(endDateTime, now);
  }).length;
  const futureConfirmedCount = await prisma.booking.count({
    where: {
      tutorProfileId,
      status: "CONFIRMED",
      availabilitySlot: {
        date: { gt: todayStart }
      }
    }
  });
  const newBookingsCount = todayConfirmedUpcomingCount + futureConfirmedCount;
  const todayConfirmedNoLinkCount = todaySessionsResult.filter((booking) => {
    if (booking.status !== "CONFIRMED") return false;
    if (booking.meetingLink && booking.meetingLink !== "") return false;
    const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter(endDateTime, now);
  }).length;
  const futureConfirmedNoLinkCount = await prisma.booking.count({
    where: {
      tutorProfileId,
      status: "CONFIRMED",
      availabilitySlot: {
        date: { gt: todayStart }
      },
      OR: [
        { meetingLink: null },
        { meetingLink: "" }
      ]
    }
  });
  const bookingsWithNoLinkCount = todayConfirmedNoLinkCount + futureConfirmedNoLinkCount;
  const upcomingSessionsRaw = await getUpcomingTutorSessions(tutorProfileId, 3);
  const upcomingSessions = upcomingSessionsRaw.map((booking) => {
    const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const startTimeISO = parse(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date()).toISOString();
    return {
      bookingId: booking.id,
      studentName: booking.user.name,
      categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
      slotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      slotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      startTimeISO,
      meetingLink: booking.meetingLink
    };
  });
  return {
    tutorName: tutor.user.name,
    todayUpcomingSessionsCount,
    stats: {
      totalSessions: {
        value: totalCompletedSessions,
        growth: Number(sessionGrowth.toFixed(2))
      },
      totalEarnings: {
        value: totalEarnings,
        growth: Number(earningGrowth.toFixed(2))
      },
      avgRating: {
        value: tutor.rating,
        status: ratingStatus
      },
      newBookings: {
        value: newBookingsCount,
        badge: String(bookingsWithNoLinkCount)
      }
    },
    upcomingSessions
  };
};
var getDashboardRevenueTrends = async (tutorProfileId, trendPeriod) => {
  const now = /* @__PURE__ */ new Date();
  const revenueTrends = [];
  if (trendPeriod === "one-week" || trendPeriod === "one-month") {
    const daysToCount = trendPeriod === "one-week" ? 7 : 30;
    for (let i = daysToCount - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const start = startOfDay(date);
      const end = endOfDay(date);
      const label = trendPeriod === "one-week" ? format(date, "EEE") : format(date, "MMM dd");
      const dayRevenue = await prisma.booking.aggregate({
        where: {
          tutorProfileId,
          status: "COMPLETED",
          availabilitySlot: {
            date: { gte: start, lte: end }
          }
        },
        _sum: { price: true }
      });
      revenueTrends.push({
        month: label,
        revenue: dayRevenue._sum.price || 0
      });
    }
  } else {
    let monthsToCount = 12;
    let startFrom = startOfMonth(subMonths(now, 11));
    if (trendPeriod === "three-month") {
      monthsToCount = 3;
      startFrom = startOfMonth(subMonths(now, 2));
    } else if (trendPeriod === "six-month") {
      monthsToCount = 6;
      startFrom = startOfMonth(subMonths(now, 5));
    } else if (trendPeriod === "this-year") {
      const currentYearStart = startOfYear(now);
      monthsToCount = differenceInMonths(now, currentYearStart) + 1;
      startFrom = currentYearStart;
    } else if (trendPeriod === "all-time") {
      const firstBooking = await prisma.booking.findFirst({
        where: { tutorProfileId, status: "COMPLETED" },
        orderBy: { availabilitySlot: { date: "asc" } },
        include: { availabilitySlot: true }
      });
      if (firstBooking?.availabilitySlot) {
        const tutorStartDate = startOfMonth(firstBooking.availabilitySlot.date);
        monthsToCount = differenceInMonths(now, tutorStartDate) + 1;
        startFrom = tutorStartDate;
      } else {
        monthsToCount = 6;
        startFrom = startOfMonth(subMonths(now, 5));
      }
    }
    for (let i = monthsToCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      if (isBefore(monthDate, startFrom)) continue;
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthName = format(monthDate, "MMMM");
      const monthlyRevenue = await prisma.booking.aggregate({
        where: {
          tutorProfileId,
          status: "COMPLETED",
          availabilitySlot: {
            date: { gte: start, lte: end }
          }
        },
        _sum: { price: true }
      });
      revenueTrends.push({
        month: monthName,
        revenue: monthlyRevenue._sum.price || 0
      });
    }
  }
  return { revenueTrends };
};
var getTutorScheduleMeta = async (tutorProfileId) => {
  const now = /* @__PURE__ */ new Date();
  const today = startOfDay(now);
  const tomorrow = startOfDay(addDays(now, 1));
  const bookings = await prisma.booking.findMany({
    where: {
      tutorProfileId,
      status: { in: ["CONFIRMED", "COMPLETED"] }
    },
    include: {
      availabilitySlot: true,
      user: { select: { name: true, image: true } },
      tutorProfile: {
        include: {
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      }
    }
  });
  const reviews = await prisma.review.findMany({
    where: { tutorProfileId }
  });
  const todaySessions = bookings.filter((b) => {
    if (b.status !== "CONFIRMED" || !isSameDay(b.availabilitySlot.date, today)) return false;
    const dateStr = format(b.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse(`${dateStr} ${b.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter(endDateTime, now);
  }).length;
  const upcomingSessionsCount = bookings.filter(
    (b) => b.status === "CONFIRMED" && isSameDay(b.availabilitySlot.date, tomorrow)
  ).length;
  const uncompletedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED"
  ).length;
  const totalBookings = bookings.length;
  const completedBookingsCount = bookings.filter((b) => b.status === "COMPLETED").length;
  let satisfactionRate = 100;
  if (reviews.length > 0) {
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    satisfactionRate = positiveReviews / reviews.length * 100;
  }
  const startingSoonRaw = await getUpcomingTutorSessions(tutorProfileId, 3);
  const startingSoon = startingSoonRaw.map((b) => {
    const dateStr = format(b.availabilitySlot.date, "yyyy-MM-dd");
    const startTimeISO = parse(`${dateStr} ${b.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date()).toISOString();
    return {
      bookingId: b.id,
      categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
      startTime: format(parse(b.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      endTime: format(parse(b.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      studentName: b.user.name,
      studentImage: b.user.image || "",
      startTimeISO,
      bookingStatus: b.status,
      meetingLink: b.meetingLink
    };
  });
  const classLinkHubRaw = await getUpcomingTutorSessions(tutorProfileId, 6);
  const classLinkHub = classLinkHubRaw.filter((b) => b.status === "CONFIRMED").map((b) => ({
    bookingId: b.id,
    categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
    studentName: b.user.name,
    bookingStatus: b.status,
    meetingLink: b.meetingLink
  }));
  return {
    stats: {
      todaySessions,
      upcomingSessions: upcomingSessionsCount,
      uncompletedBookings,
      totalBookings,
      completedBookings: {
        count: completedBookingsCount,
        satisfactionRate: Number(satisfactionRate.toFixed(2))
      }
    },
    startingSoon,
    classLinkHub
  };
};
var getTutorScheduleEvents = async (tutorProfileId, startDate, endDate) => {
  const now = /* @__PURE__ */ new Date();
  const start = startDate ? startOfDay(new Date(startDate)) : startOfMonth(now);
  const end = endDate ? endOfDay(new Date(endDate)) : endOfMonth(now);
  const whereConditions = {
    tutorProfileId,
    status: { in: ["CONFIRMED", "COMPLETED"] },
    availabilitySlot: {
      date: {
        gte: start,
        lte: end
      }
    }
  };
  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    include: {
      availabilitySlot: true,
      user: { select: { name: true } },
      tutorProfile: {
        include: {
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: [
      { availabilitySlot: { date: "asc" } },
      { availabilitySlot: { startTime: "asc" } }
    ]
  });
  const calendarEvents = bookings.map((b) => ({
    bookingId: b.id,
    categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
    studentName: b.user.name,
    dateISO: b.availabilitySlot.date.toISOString(),
    startTime: format(parse(b.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    endTime: format(parse(b.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    bookingStatus: b.status,
    meetingLink: b.meetingLink
  }));
  return { calendarEvents };
};
var tutorService = {
  getAllTutors,
  getTutorProfileByProfileId,
  getAvailableSlots,
  getTutorDetailsByUserId,
  updateTutorProfile,
  getTutorSelectedCategories,
  setTutorCategories,
  getTutorWeeklyAvailableSlots,
  createTutorWeeklyAvailability,
  updateTutorWeeklyAvailability,
  deleteTutorWeeklyAvailability,
  getAllTutorException,
  createTutorException,
  deleteTutorException,
  getTutorAllSession,
  updateBookingStatus,
  updateBookingMeetingLink,
  getSessionDetailsByBookingId,
  getDashboardMeta,
  getDashboardRevenueTrends,
  getTutorScheduleMeta,
  getTutorScheduleEvents,
  getTutorProfileByUserId
};
var tutor_service_default = tutorService;

// src/modules/tutor/tutor.controller.ts
import fs3 from "fs/promises";

// src/validation/tutor.validation.ts
import { z as z2 } from "zod";
var updateTutorSchema = z2.object({
  body: z2.object({
    name: z2.string().min(3).optional(),
    phoneNumber: z2.string().optional(),
    title: z2.string().min(5).optional(),
    bio: z2.string().min(20).optional(),
    hourlyRate: z2.string().transform((val) => Number(val)).optional(),
    experience: z2.string().optional()
  })
});
var tutorQuerySchema = z2.object({
  query: z2.object({
    page: z2.string().optional().transform((val) => val ? Number(val) : 1),
    limit: z2.string().optional().transform((val) => val ? Number(val) : 12),
    sortBy: z2.enum(["createdAt", "highest-rated", "low-to-high", "high-to-low", "most-reviews"]).optional().default("createdAt"),
    sortOrder: z2.enum(["asc", "desc"]).optional().default("asc"),
    searchTerm: z2.string().optional(),
    categories: z2.string().optional(),
    // (e.g., "Math,Physics")
    minPrice: z2.string().optional().transform((val) => val ? Number(val) : void 0),
    maxPrice: z2.string().optional().transform((val) => val ? Number(val) : void 0),
    minRating: z2.string().optional().transform((val) => val ? Number(val) : void 0)
  })
});
var setTutorCategoriesSchema = z2.object({
  body: z2.object({
    categoryId: z2.array(z2.string().uuid("Invalid Category ID")).min(1, "At least one category is required").max(1, "Only one category can be added at a time")
  })
});
var createTutorExceptionSchema = z2.object({
  body: z2.object({
    // ISO Date format (e.g., "2026-02-15")
    date: z2.string({
      error: "Date is required"
    }).refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format. Use YYYY-MM-DD"
    }),
    reason: z2.string({
      error: "Reason is required"
    }).min(5, "Reason must be at least 5 characters long")
  })
});
var daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var createWeeklyAvailabilitySchema = z2.object({
  body: z2.object({
    dayOfWeek: z2.enum(daysOfWeek, {
      message: "Invalid day of the week"
    }),
    startTime: z2.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    endTime: z2.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)")
  }).refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"]
  })
});
var updateWeeklyAvailabilitySchema = z2.object({
  params: z2.object({
    id: z2.uuid("Invalid Slot ID format")
  }),
  body: z2.object({
    isActive: z2.boolean()
  })
});
var deleteWeeklyAvailabilitySchema = z2.object({
  params: z2.object({
    id: z2.uuid("Invalid Slot ID format")
  })
});
var getAvailableSlotsSchema = z2.object({
  query: z2.object({
    tutorProfileId: z2.uuid("Invalid Tutor ID"),
    startDate: z2.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date").optional()
  })
});
var tutorSessionQuerySchema = z2.object({
  query: z2.object({
    page: z2.string().optional().transform((val) => val ? Number(val) : 1),
    limit: z2.string().optional().transform((val) => val ? Number(val) : 10),
    sortBy: z2.string().optional().default("createdAt"),
    sortOrder: z2.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z2.string().optional(),
    // student name, subject and date searching
    status: z2.enum(["CONFIRMED", "COMPLETED"]).optional()
  })
});
var updateBookingStatusByTutorSchema = z2.object({
  params: z2.object({
    bookingId: z2.string({ error: "Booking ID is required in query params" })
  }),
  body: z2.object({
    status: z2.enum(["CONFIRMED", "COMPLETED"]),
    meetingLink: z2.string().optional()
  }).refine((data) => data.status === "COMPLETED" ? data.meetingLink : true, {
    message: "Meeting link is required when status is COMPLETED",
    path: ["meetingLink"]
  })
});
var deleteTutorExceptionSchema = z2.object({
  params: z2.object({
    id: z2.uuid("Invalid Exception ID format")
  })
});
var getDashboardRevenueTrendsQuerySchema = z2.object({
  query: z2.object({
    trendPeriod: z2.enum(["one-week", "one-month", "three-month", "six-month", "this-year", "all-time"]).optional().default("six-month")
  })
});
var scheduleEventsQuerySchema = z2.object({
  query: z2.object({
    startDate: z2.string({ error: "Start date is required" }).min(1, "Start date is required"),
    endDate: z2.string({ error: "End date is required" }).min(1, "End date is required")
  })
});

// src/modules/tutor/tutor.controller.ts
var getAllTutors2 = async (req, res, next) => {
  try {
    const validation = tutorQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.getAllTutors(validation.data.query);
    res.status(200).json({
      success: true,
      message: "Tutors fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getTutorProfileByProfileId2 = async (req, res, next) => {
  try {
    const tutorProfileId = req.params.profileId;
    const result = await tutor_service_default.getTutorProfileByProfileId(tutorProfileId);
    res.status(200).json({
      success: true,
      message: "Tutor profile fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAvailableSlots2 = async (req, res, next) => {
  try {
    const validatedQuery = getAvailableSlotsSchema.safeParse({ query: req.query });
    if (!validatedQuery.success) throw validatedQuery.error;
    const { tutorProfileId, startDate } = validatedQuery.data.query;
    const result = await tutor_service_default.getAvailableSlots(tutorProfileId, startDate);
    if (result.length === 0) {
      res.status(200).json({
        success: true,
        message: "No available slots found",
        data: result
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Available slots fetched successfully",
        data: result
      });
    }
  } catch (err) {
    next(err);
  }
};
var getTutorProfileByUserId2 = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const result = await tutor_service_default.getTutorProfileByUserId(userId);
    res.status(200).json({
      success: true,
      message: "Tutor profile fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var updateTutorProfile2 = async (req, res, next) => {
  let localFilePath = req.file?.path;
  try {
    const tutorId = req.user?.id;
    if (!tutorId) throw new AppError("Unauthorized", 401, "AUTH_ERROR");
    const validation = updateTutorSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const updateData = { ...validation.data.body };
    if (localFilePath) {
      const currentUser = await tutor_service_default.getTutorDetailsByUserId(tutorId);
      const cloudinaryResult = await cloudinary_default.uploader.upload(localFilePath, {
        folder: "skillbridge/tutors"
      });
      updateData.image = cloudinaryResult.secure_url;
      if (currentUser?.image) {
        const publicId = currentUser.image.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary_default.uploader.destroy(`skillbridge/tutors/${publicId}`).catch(() => {
          });
        }
      }
    }
    const updatableData = {
      userProfile: {
        name: updateData.name,
        phoneNumber: updateData.phoneNumber,
        image: updateData.image
      },
      tutorProfile: {
        title: updateData.title,
        bio: updateData.bio,
        hourlyRate: updateData.hourlyRate,
        experience: updateData.experience
      }
    };
    const result = await tutor_service_default.updateTutorProfile(tutorId, updatableData);
    if (result) {
      if (localFilePath) await fs3.unlink(localFilePath);
    }
    res.status(200).json({
      success: true,
      message: "Update tutor profile successfully",
      data: result
    });
  } catch (err) {
    if (localFilePath) await fs3.unlink(localFilePath);
    next(err);
  }
};
var getTutorSelectedCategories2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const result = await tutor_service_default.getTutorSelectedCategories(tutorProfile.id);
    res.status(200).json({
      success: true,
      message: "Tutor selected categories fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var setTutorCategories2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = setTutorCategoriesSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.setTutorCategories(tutorProfile.id, validation.data.body.categoryId);
    res.status(201).json({
      success: true,
      message: "Tutor categories set successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createTutorWeeklyAvailableSlots = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = createWeeklyAvailabilitySchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.createTutorWeeklyAvailability(tutorProfile.id, validation.data.body);
    res.status(201).json({
      success: true,
      message: "Tutor weekly availability created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getTutorWeeklyAvailableSlots2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const result = await tutor_service_default.getTutorWeeklyAvailableSlots(tutorProfile.id);
    res.status(200).json({
      success: true,
      message: "Tutor weekly available slots fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var updateTutorWeeklyAvailableSlots = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = updateWeeklyAvailabilitySchema.safeParse({ params: req.params, body: req.body });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.updateTutorWeeklyAvailability(tutorProfile.id, validation.data.params.id, validation.data.body);
    res.status(200).json({
      success: true,
      message: "Tutor weekly availability updated successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var deleteTutorWeeklyAvailableSlots = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = deleteWeeklyAvailabilitySchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.deleteTutorWeeklyAvailability(tutorProfile.id, validation.data.params.id);
    res.status(200).json({
      success: true,
      message: "Tutor weekly availability deleted successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllTutorException2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const result = await tutor_service_default.getAllTutorException(tutorProfile.id);
    res.status(200).json({
      success: true,
      message: "Tutor exceptions fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createTutorException2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = createTutorExceptionSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.createTutorException(tutorProfile.id, validation.data.body);
    res.status(201).json({
      success: true,
      message: "Tutor exception (Off-day) created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var deleteTutorException2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = deleteTutorExceptionSchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.deleteTutorException(tutorProfile.id, validation.data.params.id);
    res.status(200).json({
      success: true,
      message: "Tutor exception deleted successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getDashboardMeta2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const result = await tutor_service_default.getDashboardMeta(tutorProfile.id);
    res.status(200).json({
      success: true,
      message: "Dashboard meta fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getDashboardRevenueTrends2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) throw new AppError("Tutor profile not found", 404, "NOT_FOUND");
    const validation = getDashboardRevenueTrendsQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const { trendPeriod } = validation.data.query;
    const result = await tutor_service_default.getDashboardRevenueTrends(tutorProfile.id, trendPeriod);
    res.status(200).json({
      success: true,
      message: "Dashboard revenue trends fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getTutorAllSession2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    const validation = tutorSessionQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await tutor_service_default.getTutorAllSession(tutorProfile?.id, validation.data.query);
    res.status(200).json({
      success: true,
      message: "Tutor session fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var updateBookingStatusOrMeetingLink = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    const validation = updateBookingStatusByTutorSchema.safeParse({ params: req.params, body: req.body });
    if (!validation.success) throw validation.error;
    const meetingLink = validation.data.body.meetingLink;
    const bookingStatus = validation.data.body.status;
    if (meetingLink !== null && bookingStatus === "CONFIRMED") {
      const result = await tutor_service_default.updateBookingMeetingLink(tutorProfile?.id, validation.data.params.bookingId, validation.data.body);
      res.status(200).json({
        success: true,
        message: "Session meeting link updated successfully",
        data: result
      });
    }
    if (meetingLink !== null && bookingStatus === "COMPLETED") {
      const result = await tutor_service_default.updateBookingStatus(tutorProfile?.id, validation.data.params.bookingId, meetingLink);
      res.status(200).json({
        success: true,
        message: "Session status marked as completed successfully",
        data: result
      });
    }
  } catch (err) {
    next(err);
  }
};
var getSessionDetailsByBookingId2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) {
      return res.status(404).json({ success: false, message: "Tutor profile not found" });
    }
    const bookingId = req.params.bookingId;
    const result = await tutor_service_default.getSessionDetailsByBookingId(tutorProfile.id, bookingId);
    res.status(200).json({
      success: true,
      message: "Tutor session details fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getTutorScheduleMeta2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) {
      return res.status(404).json({ success: false, message: "Tutor profile not found" });
    }
    const result = await tutor_service_default.getTutorScheduleMeta(tutorProfile.id);
    res.status(200).json({
      success: true,
      message: "Tutor schedule fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getTutorScheduleEvents2 = async (req, res, next) => {
  try {
    const tutorId = req.user?.id;
    if (!tutorId) {
      return res.status(403).json({ success: false, message: "Tutor not found" });
    }
    const tutorProfile = await tutor_service_default.getTutorProfileByUserId(tutorId);
    if (!tutorProfile) {
      return res.status(404).json({ success: false, message: "Tutor profile not found" });
    }
    const validation = scheduleEventsQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const { startDate, endDate } = validation.data.query;
    const result = await tutor_service_default.getTutorScheduleEvents(tutorProfile.id, startDate, endDate);
    res.status(200).json({
      success: true,
      message: "Tutor schedule events fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var tutorController = {
  getAllTutors: getAllTutors2,
  getTutorProfileByProfileId: getTutorProfileByProfileId2,
  getAvailableSlots: getAvailableSlots2,
  getTutorProfileByUserId: getTutorProfileByUserId2,
  updateTutorProfile: updateTutorProfile2,
  getTutorSelectedCategories: getTutorSelectedCategories2,
  setTutorCategories: setTutorCategories2,
  getTutorWeeklyAvailableSlots: getTutorWeeklyAvailableSlots2,
  createTutorWeeklyAvailableSlots,
  updateTutorWeeklyAvailableSlots,
  deleteTutorWeeklyAvailableSlots,
  getAllTutorException: getAllTutorException2,
  createTutorException: createTutorException2,
  deleteTutorException: deleteTutorException2,
  getDashboardMeta: getDashboardMeta2,
  getDashboardRevenueTrends: getDashboardRevenueTrends2,
  getTutorAllSession: getTutorAllSession2,
  updateBookingStatusOrMeetingLink,
  getTutorScheduleMeta: getTutorScheduleMeta2,
  getTutorScheduleEvents: getTutorScheduleEvents2,
  getSessionDetailsByBookingId: getSessionDetailsByBookingId2
};
var tutor_controller_default = tutorController;

// src/modules/tutor/tutor.router.ts
var router2 = Router2();
router2.get("/", tutor_controller_default.getAllTutors);
router2.get("/available-slots", tutor_controller_default.getAvailableSlots);
router2.get("/weekly-available-slots", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorWeeklyAvailableSlots);
router2.get("/profile", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorProfileByUserId);
router2.get("/categories", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorSelectedCategories);
router2.get("/exceptions", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getAllTutorException);
router2.get("/sessions", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorAllSession);
router2.get("/dashboard/meta", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getDashboardMeta);
router2.get("/dashboard/revenue-trends", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getDashboardRevenueTrends);
router2.get("/schedule/meta", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorScheduleMeta);
router2.get("/schedule/events", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getTutorScheduleEvents);
router2.get("/session-details/:bookingId", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.getSessionDetailsByBookingId);
router2.get("/:profileId", tutor_controller_default.getTutorProfileByProfileId);
router2.post("/categories", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.setTutorCategories);
router2.post("/weekly-available-slots", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.createTutorWeeklyAvailableSlots);
router2.post("/exceptions", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.createTutorException);
router2.put("/sessions/:bookingId", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.updateBookingStatusOrMeetingLink);
router2.put("/profile", authMiddleware_default("TUTOR" /* TUTOR */), uploadHandler_default.single("avatar"), tutor_controller_default.updateTutorProfile);
router2.patch("/weekly-available-slots/:id", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.updateTutorWeeklyAvailableSlots);
router2.delete("/weekly-available-slots/:id", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.deleteTutorWeeklyAvailableSlots);
router2.delete("/exceptions/:id", authMiddleware_default("TUTOR" /* TUTOR */), tutor_controller_default.deleteTutorException);
var tutorRouter = router2;

// src/modules/booking/booking.router.ts
import { Router as Router3 } from "express";

// src/modules/booking/booking.service.ts
import { differenceInMinutes as differenceInMinutes2, format as format2, parse as parse2, startOfMonth as startOfMonth2, subMonths as subMonths2 } from "date-fns";
var getAllBookingByAuthor = async (studentId, query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, status } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [{ studentId }];
  if (searchTerm) {
    andConditions.push({
      tutorProfile: {
        user: {
          name: {
            contains: searchTerm,
            mode: "insensitive"
          }
        }
      }
    });
  }
  if (status) {
    andConditions.push({ status });
  }
  const whereConditions = { AND: andConditions };
  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder },
      include: {
        availabilitySlot: true,
        tutorProfile: {
          include: {
            user: { select: { name: true, email: true, image: true } }
          }
        },
        payment: true
      }
    }),
    prisma.booking.count({ where: whereConditions })
  ]);
  return {
    data: result,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var getAllBooking = async (query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, bookingStatus } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [];
  andConditions.push({
    status: {
      not: "CANCELLED"
    }
  });
  if (searchTerm) {
    andConditions.push({
      OR: [
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
        { tutorProfile: { user: { name: { contains: searchTerm, mode: "insensitive" } } } },
        { tutorProfile: { user: { email: { contains: searchTerm, mode: "insensitive" } } } },
        {
          tutorProfile: {
            tutorCategories: {
              some: {
                category: {
                  name: { contains: searchTerm, mode: "insensitive" }
                }
              }
            }
          }
        }
      ]
    });
  }
  if (bookingStatus) andConditions.push({ status: bookingStatus });
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { name: true, email: true } },
        tutorProfile: {
          include: {
            user: { select: { name: true, email: true } },
            tutorCategories: { include: { category: { select: { name: true } } } }
          }
        },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } }
      }
    }),
    prisma.booking.count({ where: whereConditions })
  ]);
  const formattedData = result.map((booking) => ({
    bookingId: booking.id,
    studentName: booking.user?.name || "N/A",
    studentEmail: booking.user?.email || "N/A",
    tutorName: booking.tutorProfile?.user?.name || "N/A",
    tutorEmail: booking.tutorProfile?.user?.email || "N/A",
    tutorCategoryName: booking.tutorProfile?.tutorCategories.map((tc) => tc.category.name) || [],
    availabilitySlotDate: format2(booking.availabilitySlot?.date, "MMM dd, yyyy"),
    availabilitySlotStartTime: format2(parse2(booking.availabilitySlot?.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    availabilitySlotEndTime: format2(parse2(booking.availabilitySlot?.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    amount: booking.price || 0,
    bookingStatus: booking.status
  }));
  return {
    data: formattedData,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var getBookingStats = async () => {
  const now = /* @__PURE__ */ new Date();
  const currentMonthStart = startOfMonth2(now);
  const previousMonthStart = startOfMonth2(subMonths2(now, 1));
  const [
    totalBookings,
    pendingBooking,
    totalCompletedSession,
    totalCancelled,
    uncompletedBooking,
    currentMonthBookings,
    previousMonthBookings
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { createdAt: { gte: currentMonthStart } } }),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart
        }
      }
    })
  ]);
  let bookingGrowthMetric = 0;
  if (previousMonthBookings === 0) {
    bookingGrowthMetric = currentMonthBookings > 0 ? 100 : 0;
  } else {
    bookingGrowthMetric = (currentMonthBookings - previousMonthBookings) / previousMonthBookings * 100;
  }
  const completedPlusCancelled = totalCompletedSession + totalCancelled;
  const sessionSuccessRate = completedPlusCancelled === 0 ? 0 : totalCompletedSession / completedPlusCancelled * 100;
  return {
    totalBookings,
    bookingGrowthMetric: parseFloat(bookingGrowthMetric.toFixed(2)),
    pendingBooking,
    totalCompletedSession,
    sessionSuccessRate: parseFloat(sessionSuccessRate.toFixed(2)),
    uncompletedBooking
  };
};
var getBookingReceipt = async (bookingId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { name: true, email: true } },
      tutorProfile: {
        include: {
          user: { select: { name: true, email: true } },
          tutorCategories: { include: { category: { select: { name: true } } } }
        }
      },
      availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      payment: { select: { amount: true, paymentMethod: true, transactionId: true } }
    }
  });
  if (!booking) {
    throw new AppError("Booking record not found", 404);
  }
  return {
    invoiceId: `INV-${booking.id.slice(-5).toUpperCase()}`,
    bookingId: booking.id,
    studentName: booking.user?.name || "N/A",
    studentEmail: booking.user?.email || "N/A",
    tutorName: booking.tutorProfile?.user?.name || "N/A",
    tutorEmail: booking.tutorProfile?.user?.email || "N/A",
    tutorCategoryName: booking.tutorProfile?.tutorCategories.map((tc) => tc.category.name).join(", ") || "N/A",
    bookingStatus: booking.status,
    availabilitySlotDate: format2(booking.availabilitySlot?.date, "MMM dd, yyyy"),
    availabilitySlotStartTime: format2(parse2(booking.availabilitySlot?.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    availabilitySlotEndTime: format2(parse2(booking.availabilitySlot?.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    paidAmount: booking.payment?.amount || 0,
    paymentMethod: booking.payment?.paymentMethod || "N/A",
    transactionId: booking.payment?.transactionId || "N/A"
  };
};
var createBookingWithPayment = async (studentId, payload) => {
  const { tutorProfileId, date, startTime, endTime, paymentMethod, transactionId } = payload;
  const bookingDate = new Date(date);
  const dayOfWeek = format2(bookingDate, "EEEE");
  const tutorData = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: {
      tutorWeeklyAvailabilities: {
        where: { dayOfWeek, isActive: true }
      },
      tutorAvailabilityExceptions: {
        where: { date: bookingDate }
      }
    }
  });
  if (!tutorData) {
    throw new AppError("Tutor not found", 404, "NOT_FOUND");
  }
  const isValidWeeklySlot = tutorData.tutorWeeklyAvailabilities.find(
    (slot) => slot.startTime === startTime && slot.endTime === endTime
  );
  if (!isValidWeeklySlot) {
    throw new AppError("The tutor is not available at this time according to their weekly schedule.", 400, "INVALID_SLOT");
  }
  if (tutorData.tutorAvailabilityExceptions.length > 0) {
    throw new AppError("The tutor has an exception/holiday on this specific date.", 400, "TUTOR_OFF_DAY");
  }
  const start = parse2(startTime, "HH:mm", /* @__PURE__ */ new Date());
  const end = parse2(endTime, "HH:mm", /* @__PURE__ */ new Date());
  const totalMinutes = differenceInMinutes2(end, start);
  if (totalMinutes <= 0) {
    throw new AppError("End time must be after start time", 400, "INVALID_TIME");
  }
  const calculatedPrice = Math.ceil(tutorData.hourlyRate * totalMinutes / 60);
  const finalPrice = parseFloat(calculatedPrice.toFixed(2));
  return await prisma.$transaction(async (tx) => {
    const existingSlot = await tx.availabilitySlot.findFirst({
      where: { tutorProfileId, date: bookingDate, startTime, endTime }
    });
    if (existingSlot?.isBooked) {
      throw new AppError("This slot is already booked", 400, "SLOT_TAKEN");
    }
    const slot = await tx.availabilitySlot.upsert({
      where: { id: existingSlot?.id || "00000000-0000-0000-0000-000000000000" },
      create: { tutorProfileId, date: bookingDate, startTime, endTime, isBooked: true },
      update: { isBooked: true }
    });
    const booking = await tx.booking.create({
      data: {
        studentId,
        tutorProfileId,
        availabilitySlotId: slot.id,
        price: finalPrice,
        status: "PENDING"
      },
      include: {
        availabilitySlot: true,
        tutorProfile: {
          include: {
            user: { select: { name: true, image: true } }
          }
        }
      }
    });
    const existingPayment = await tx.payment.findUnique({
      where: { transactionId }
    });
    if (existingPayment) {
      throw new AppError("This Transaction ID has already been used", 400, "DUPLICATE_TRANSACTION");
    }
    const payment = await tx.payment.create({
      data: {
        bookingId: booking.id,
        studentId,
        paymentMethod,
        transactionId,
        amount: finalPrice,
        status: "PENDING"
      }
    });
    return { booking, payment };
  });
};
var getAllBookingByStudentId = async (query, studentId) => {
  const { page, limit, sortBy, sortOrder, searchTerm, bookingStatus } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [{ studentId }];
  if (searchTerm) {
    let parsedDate = null;
    try {
      parsedDate = parse2(searchTerm, "dd/MM/yyyy", /* @__PURE__ */ new Date());
      if (Number.isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    } catch {
      parsedDate = null;
    }
    if (!parsedDate) {
      const isoDate = new Date(searchTerm);
      if (!Number.isNaN(isoDate.getTime())) {
        parsedDate = isoDate;
      }
    }
    const orConditions = [
      { tutorProfile: { user: { name: { contains: searchTerm, mode: "insensitive" } } } },
      { tutorProfile: { title: { contains: searchTerm, mode: "insensitive" } } },
      {
        tutorProfile: {
          tutorCategories: {
            some: {
              category: {
                name: { contains: searchTerm, mode: "insensitive" }
              }
            }
          }
        }
      }
    ];
    if (parsedDate) {
      const startOfDay3 = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0);
      const endOfDay3 = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59);
      orConditions.push({
        availabilitySlot: {
          date: {
            gte: startOfDay3,
            lte: endOfDay3
          }
        }
      });
    }
    andConditions.push({ OR: orConditions });
  }
  if (bookingStatus) {
    andConditions.push({ status: bookingStatus });
  }
  const whereConditions = { AND: andConditions };
  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder },
      include: {
        availabilitySlot: true,
        tutorProfile: {
          include: {
            user: { select: { name: true, image: true } },
            tutorCategories: { include: { category: { select: { name: true } } } }
          }
        }
      }
    }),
    prisma.booking.count({ where: whereConditions })
  ]);
  const bookings = result.map((booking) => ({
    id: booking.id,
    tutorName: booking.tutorProfile?.user?.name || "N/A",
    tutorTitle: booking.tutorProfile?.title || "N/A",
    TutorImage: booking.tutorProfile?.user?.image || null,
    categories: booking.tutorProfile?.tutorCategories.map((tc) => tc.category.name) || [],
    availabilitySlotDate: format2(booking.availabilitySlot?.date, "MMM dd, yyyy"),
    availabilityStartTime: format2(parse2(booking.availabilitySlot?.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    availabilityEndTime: format2(parse2(booking.availabilitySlot?.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    price: booking.price || 0,
    status: booking.status
  }));
  return {
    bookings,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var getBookingsMetaDataByStudentId = async (studentId) => {
  const bookings = await prisma.booking.findMany({
    where: { studentId },
    include: { availabilitySlot: true }
  });
  const totalInvestment = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "PENDING").reduce((sum, b) => sum + (b.price || 0), 0);
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED" && b.availabilitySlot);
  let totalMinutes = 0;
  for (const b of completedBookings) {
    try {
      const start = parse2(b.availabilitySlot.startTime, "HH:mm", new Date(b.availabilitySlot.date));
      const end = parse2(b.availabilitySlot.endTime, "HH:mm", new Date(b.availabilitySlot.date));
      const minutes2 = differenceInMinutes2(end, start);
      if (!Number.isNaN(minutes2) && minutes2 > 0) totalMinutes += minutes2;
    } catch (e) {
    }
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const learningHours = `${hours}h ${minutes}m`;
  const completedSessions = String(completedBookings.length);
  return {
    totalInvestment,
    learningHours,
    completedSessions
  };
};
var getBookingReciptByBookingId = async (bookingId, studentId) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, studentId },
    include: {
      tutorProfile: {
        include: {
          user: { select: { name: true } },
          tutorCategories: { include: { category: { select: { name: true } } } }
        }
      },
      availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      payment: { select: { amount: true, paymentMethod: true, transactionId: true } }
    }
  });
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  const duration = booking.availabilitySlot ? differenceInMinutes2(
    parse2(booking.availabilitySlot.endTime, "HH:mm", new Date(booking.availabilitySlot.date)),
    parse2(booking.availabilitySlot.startTime, "HH:mm", new Date(booking.availabilitySlot.date))
  ) : 0;
  const categories = booking.tutorProfile?.tutorCategories.map((tc) => tc.category.name) || [];
  const platformServiceFee = 0;
  const total = (booking.price || 0) + platformServiceFee;
  return {
    bookingId: booking.id,
    invoiceId: `INV-${booking.id.slice(-5).toUpperCase()}`,
    tutorName: booking.tutorProfile?.user?.name || "N/A",
    categories,
    availabilitySlotDate: booking.availabilitySlot ? format2(booking.availabilitySlot.date, "MMM dd, yyyy") : "N/A",
    availabilitySlotStartTime: booking.availabilitySlot ? format2(parse2(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    availabilityEndTime: booking.availabilitySlot ? format2(parse2(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a") : "N/A",
    duration: Math.max(duration, 0),
    status: booking.status === "COMPLETED" ? "COMPLETED" : "CONFIRMED",
    price: booking.price || 0,
    platformServiceFee,
    total,
    trancationId: booking.payment?.transactionId || "N/A",
    paymentMethod: booking.payment?.paymentMethod || "N/A"
  };
};
var getBookingSuccessRate = async () => {
  const totalBookings = await prisma.booking.count();
  const completedBookings = await prisma.booking.count({ where: { status: "COMPLETED" } });
  const successRate = totalBookings === 0 ? 0 : completedBookings / totalBookings * 100;
  return {
    successRate: Number(successRate.toFixed(2))
  };
};
var getAboutUsStats = async () => {
  const [activeStudent, expertTutors, totalSessions] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.user.count({
      where: {
        role: "TUTOR",
        isActive: true
      }
    }),
    prisma.booking.count({ where: { status: "COMPLETED" } })
  ]);
  const { successRate } = await getBookingSuccessRate();
  return {
    activeStudent,
    expertTutors,
    totalSessions,
    successRate: Number(successRate)
  };
};
var bookingService = {
  getAllBookingByAuthor,
  getAllBooking,
  getBookingStats,
  getBookingReceipt,
  createBookingWithPayment,
  getAllBookingByStudentId,
  getBookingsMetaDataByStudentId,
  getBookingReciptByBookingId,
  getBookingSuccessRate,
  getAboutUsStats
};
var booking_service_default = bookingService;

// src/validation/booking.validation.ts
import { z as z3 } from "zod";
var createBookingSchema = z3.object({
  tutorProfileId: z3.uuid("Invalid Tutor ID"),
  date: z3.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date format"),
  startTime: z3.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
  endTime: z3.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid Time format"),
  paymentMethod: z3.enum(["BKASH", "NAGAD", "ROCKET"]),
  transactionId: z3.string().min(6, "Transaction ID is too short")
});
var bookingQuerySchema = z3.object({
  query: z3.object({
    page: z3.string().optional().default("1"),
    limit: z3.string().optional().default("10"),
    sortBy: z3.string().optional().default("createdAt"),
    sortOrder: z3.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z3.string().optional(),
    status: z3.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional()
  })
});
var cancelBookingSchema = z3.object({
  params: z3.object({
    id: z3.uuid("Invalid Booking ID format")
  })
});
var adminBookingQuerySchema = z3.object({
  query: z3.object({
    page: z3.string().optional().default("1"),
    limit: z3.string().optional().default("10"),
    sortBy: z3.string().optional().default("createdAt"),
    sortOrder: z3.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z3.string().optional(),
    // for searching student name, email or tutor name, email, category name
    bookingStatus: z3.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional()
  })
});
var adminBookingReceiptSchema = z3.object({
  params: z3.object({
    id: z3.string({
      error: "Booking ID is required"
    })
  })
});
var studentBookingQuerySchema = z3.object({
  query: z3.object({
    page: z3.string().optional().default("1"),
    limit: z3.string().optional().default("10"),
    sortBy: z3.string().optional().default("createdAt"),
    sortOrder: z3.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z3.string().optional(),
    bookingStatus: z3.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional()
  })
});

// src/modules/booking/booking.controller.ts
var getAllBookingByAuthor2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const validation = bookingQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await booking_service_default.getAllBookingByAuthor(studentId, validation.data.query);
    if (result.data.length === 0) {
      res.status(200).json({
        success: true,
        message: "No booking found."
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Bookings fetched successfully",
        data: result
      });
    }
  } catch (err) {
    next(err);
  }
};
var getAllBooking2 = async (req, res, next) => {
  try {
    const validation = adminBookingQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await booking_service_default.getAllBooking(validation.data.query);
    res.status(200).json({
      success: true,
      message: `Booking fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getBookingStats2 = async (req, res, next) => {
  try {
    const result = await booking_service_default.getBookingStats();
    res.status(200).json({
      success: true,
      message: `Booking statistics fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getBookingReceipt2 = async (req, res, next) => {
  try {
    const validation = adminBookingReceiptSchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const { id } = validation.data.params;
    const result = await booking_service_default.getBookingReceipt(id);
    res.status(200).json({
      success: true,
      message: `Booking receipt fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createBookingWithPayment2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) throw validation.error;
    const result = await booking_service_default.createBookingWithPayment(
      studentId,
      validation.data
    );
    res.status(201).json({
      success: true,
      message: "Booking and payment created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllBookingByStudentId2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const validation = studentBookingQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await booking_service_default.getAllBookingByStudentId(validation.data.query, studentId);
    res.status(200).json({
      success: true,
      message: `Booking fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getBookingsMetaDataByStudentId2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new Error("User not found");
    }
    const result = await booking_service_default.getBookingsMetaDataByStudentId(studentId);
    res.status(200).json({
      success: true,
      message: `Booking meta data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getBookingReciptByBookingId2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      throw new Error("User not found");
    }
    const validation = adminBookingReceiptSchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const { id: bookingId } = validation.data.params;
    const result = await booking_service_default.getBookingReciptByBookingId(bookingId, studentId);
    res.status(200).json({
      success: true,
      message: `Booking details fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getBookingSuccessRate2 = async (req, res, next) => {
  try {
    const result = await booking_service_default.getBookingSuccessRate();
    res.status(200).json({
      success: true,
      message: `Success rate fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAboutUsStats2 = async (req, res, next) => {
  try {
    const result = await booking_service_default.getAboutUsStats();
    res.status(200).json({
      success: true,
      message: `Success rate fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var bookingController = {
  getAllBookingByAuthor: getAllBookingByAuthor2,
  getAllBooking: getAllBooking2,
  getBookingStats: getBookingStats2,
  getBookingReceipt: getBookingReceipt2,
  createBookingWithPayment: createBookingWithPayment2,
  getAllBookingByStudentId: getAllBookingByStudentId2,
  getBookingsMetaDataByStudentId: getBookingsMetaDataByStudentId2,
  getBookingReciptByBookingId: getBookingReciptByBookingId2,
  getBookingSuccessRate: getBookingSuccessRate2,
  getAboutUsStats: getAboutUsStats2
};
var booking_controller_default = bookingController;

// src/modules/booking/booking.router.ts
var router3 = Router3();
router3.get("/", authMiddleware_default("STUDENT" /* STUDENT */), booking_controller_default.getAllBookingByAuthor);
router3.get("/admin", authMiddleware_default("ADMIN" /* ADMIN */), booking_controller_default.getAllBooking);
router3.get("/platform-success-rate", booking_controller_default.getBookingSuccessRate);
router3.get("/about-us/stats", booking_controller_default.getAboutUsStats);
router3.get("/admin/stats", authMiddleware_default("ADMIN" /* ADMIN */), booking_controller_default.getBookingStats);
router3.get("/admin/receipt/:id", authMiddleware_default("ADMIN" /* ADMIN */), booking_controller_default.getBookingReceipt);
router3.get("/student", authMiddleware_default("STUDENT" /* STUDENT */), booking_controller_default.getAllBookingByStudentId);
router3.get("/student/meta", authMiddleware_default("STUDENT" /* STUDENT */), booking_controller_default.getBookingsMetaDataByStudentId);
router3.get("/student/:id", authMiddleware_default("STUDENT" /* STUDENT */), booking_controller_default.getBookingReciptByBookingId);
router3.post("/", authMiddleware_default("STUDENT" /* STUDENT */), booking_controller_default.createBookingWithPayment);
var bookingRouter = router3;

// src/modules/review/review.router.ts
import { Router as Router4 } from "express";

// src/modules/review/review.service.ts
import { format as format3, formatDistanceToNow as formatDistanceToNow2, parse as parse3 } from "date-fns";
var getAllBookingWithReview = async (query, studentId) => {
  const { page, limit, sortBy, sortOrder, searchTerm, reviewStatus } = query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [{ studentId }];
  andConditions.push({ status: "COMPLETED" });
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          tutorProfile: {
            user: {
              name: { contains: searchTerm, mode: "insensitive" }
            }
          }
        },
        {
          tutorProfile: {
            title: { contains: searchTerm, mode: "insensitive" }
          }
        }
      ]
    });
  }
  if (reviewStatus === "Reviewed") {
    andConditions.push({ review: { isNot: null } });
  }
  if (reviewStatus === "Unreviewed") {
    andConditions.push({ review: { is: null } });
  }
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const allowedSortFields = ["createdAt", "updatedAt", "status", "price", "id"];
  const orderBy = allowedSortFields.includes(sortBy) ? { [sortBy]: sortOrder } : { createdAt: sortOrder };
  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy,
      include: {
        tutorProfile: {
          include: {
            user: { select: { name: true, image: true } },
            tutorCategories: { include: { category: { select: { name: true } } } }
          }
        },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
        review: { select: { rating: true, comment: true } }
      }
    }),
    prisma.booking.count({ where: whereConditions })
  ]);
  const data = result.map((booking) => ({
    id: booking.id,
    tutorName: booking.tutorProfile.user.name,
    tutorTitle: booking.tutorProfile.title,
    TutorImage: booking.tutorProfile.user.image ?? null,
    categories: booking.tutorProfile.tutorCategories.map((item) => item.category.name),
    availabilitySlotDate: format3(booking.availabilitySlot.date, "MMM dd, yyyy"),
    availabilityStartTime: format3(parse3(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    availabilityEndTime: format3(parse3(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    status: booking.status,
    review: booking.review ? {
      rating: booking.review.rating,
      comment: booking.review.comment ?? ""
    } : null
  }));
  return {
    data,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var createReview = async (studentId, payload) => {
  const { bookingId, rating, comment } = payload;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.studentId !== studentId) throw new AppError("You can only review your own sessions", 403);
  if (booking.status !== "COMPLETED") throw new AppError("Review is only allowed after completion", 400);
  const existingReview = await prisma.review.findUnique({ where: { bookingId } });
  if (existingReview) throw new AppError("Review already exists for this booking", 400);
  const result = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        bookingId,
        studentId,
        tutorProfileId: booking.tutorProfileId,
        rating,
        comment
      }
    });
    const stats = await tx.review.aggregate({
      where: { tutorProfileId: booking.tutorProfileId },
      _avg: { rating: true },
      _count: { id: true }
    });
    const avgRating = stats._avg.rating ?? 0;
    const roundedAvg = Number(avgRating.toFixed(2));
    await tx.tutorProfile.update({
      where: { id: booking.tutorProfileId },
      data: {
        rating: roundedAvg,
        totalReviews: stats._count.id || 0
      }
    });
    return newReview;
  });
  return result;
};
var getAllReviewStatsByTutorProfileId = async (tutorProfileId) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: {
      id: true,
      hourlyRate: true,
      rating: true,
      totalReviews: true,
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  });
  if (!tutorProfile) {
    throw new AppError("Tutor profile not found", 404);
  }
  const reviewGroups = await prisma.review.groupBy({
    by: ["rating"],
    where: { tutorProfileId },
    _count: { id: true }
  });
  const countMap = new Map(
    reviewGroups.map((item) => [item.rating, item._count.id])
  );
  const totalReviews = reviewGroups.reduce((sum, item) => sum + item._count.id, 0);
  const buildBreakdown = (star) => {
    const count = countMap.get(star) ?? 0;
    const percentage = totalReviews > 0 ? Number((count / totalReviews * 100).toFixed(2)) : 0;
    return { count, percentage };
  };
  return {
    tutor: {
      profileId: tutorProfile.id,
      name: tutorProfile.user.name,
      avatar: tutorProfile.user.image ?? null,
      pricePerSession: tutorProfile.hourlyRate,
      averageRating: Number(tutorProfile.rating.toFixed(2)),
      totalReviewsCount: totalReviews
    },
    ratingBreakdown: {
      fiveStars: buildBreakdown(5),
      fourStars: buildBreakdown(4),
      threeStars: buildBreakdown(3),
      twoStars: buildBreakdown(2),
      oneStars: buildBreakdown(1)
    }
  };
};
var getAllReviewByTutorProfileId = async (tutorProfileId, query) => {
  const pageNumber = Number(query.page) || 1;
  const limitNumber = Number(query.limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;
  const sortOrderMap = {
    "most-recent": { createdAt: "desc" },
    "highest-rated": { rating: "desc" },
    "lowest-rated": { rating: "asc" }
  };
  const orderBy = sortOrderMap[query.sortOrder] ?? { createdAt: "desc" };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { tutorProfileId },
      skip,
      take: limitNumber,
      orderBy,
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    }),
    prisma.review.count({ where: { tutorProfileId } })
  ]);
  return {
    reviews: reviews.map((review) => ({
      id: review.id,
      studentName: review.user.name,
      studentAvatar: review.user.image ?? null,
      rating: review.rating,
      comment: review.comment ?? "",
      time: formatDistanceToNow2(review.createdAt, { addSuffix: true })
    })),
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var getFeaturedReviews = async () => {
  const reviews = await prisma.review.findMany({
    where: { isFeatured: true },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return reviews.map((review) => ({
    id: review.id,
    studentName: review.user.name,
    studentTitle: "Verified Student",
    studentAvatar: review.user.image ?? null,
    rating: review.rating,
    comment: review.comment ?? ""
  }));
};
var reviewService = {
  getAllBookingWithReview,
  createReview,
  getAllReviewStatsByTutorProfileId,
  getAllReviewByTutorProfileId,
  getFeaturedReviews
};
var review_service_default = reviewService;

// src/validation/review.validation.ts
import { z as z4 } from "zod";
var getAllBookingWIthReviewValidationSchema = z4.object({
  query: z4.object({
    page: z4.string().optional().default("1"),
    limit: z4.string().optional().default("10"),
    sortBy: z4.string().optional().default("createdAt"),
    sortOrder: z4.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z4.string().optional(),
    reviewStatus: z4.enum(["Reviewed", "Unreviewed"]).optional()
  })
});
var reviewValidationSchema = z4.object({
  body: z4.object({
    bookingId: z4.string({ error: "Booking ID is required" }),
    rating: z4.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot be more than 5"),
    comment: z4.string().optional().default("")
  })
});
var getAllReviewByTutorProfileIdValidationSchema = z4.object({
  query: z4.object({
    page: z4.string().optional().default("1"),
    limit: z4.string().optional().default("10"),
    sortBy: z4.string().optional().default("createdAt"),
    sortOrder: z4.enum(["highest-rated", "lowest-rated", "most-recent"]).default("most-recent")
  })
});

// src/modules/review/review.controller.ts
var getAllBookingWithReview2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) throw new Error("UserId is required");
    const validation = getAllBookingWIthReviewValidationSchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await review_service_default.getAllBookingWithReview(validation.data.query, studentId);
    res.status(200).json({
      success: true,
      message: `Review fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllReviewStatsByTutorProfileId2 = async (req, res, next) => {
  try {
    const tutorProfileId = req.params?.tutorProfileId;
    if (!tutorProfileId) throw new Error("Tutor profile id required");
    const result = await review_service_default.getAllReviewStatsByTutorProfileId(tutorProfileId);
    res.status(200).json({
      success: true,
      message: `All review stats fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllReviewByTutorProfileId2 = async (req, res, next) => {
  try {
    const tutorProfileId = req.params?.tutorProfileId;
    if (!tutorProfileId) throw new Error("Tutor profile id required");
    const validation = getAllReviewByTutorProfileIdValidationSchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await review_service_default.getAllReviewByTutorProfileId(tutorProfileId, validation.data.query);
    res.status(200).json({
      success: true,
      message: `All Review fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createReview2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const validation = reviewValidationSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await review_service_default.createReview(studentId, validation.data.body);
    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getFeaturedReviews2 = async (req, res, next) => {
  try {
    const result = await review_service_default.getFeaturedReviews();
    res.status(200).json({
      success: true,
      message: "Featured reviews fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var reviewController = {
  getAllBookingWithReview: getAllBookingWithReview2,
  createReview: createReview2,
  getAllReviewStatsByTutorProfileId: getAllReviewStatsByTutorProfileId2,
  getAllReviewByTutorProfileId: getAllReviewByTutorProfileId2,
  getFeaturedReviews: getFeaturedReviews2
};
var review_controller_default = reviewController;

// src/modules/review/review.router.ts
var router4 = Router4();
router4.get("/", authMiddleware_default("STUDENT" /* STUDENT */), review_controller_default.getAllBookingWithReview);
router4.get("/featured", review_controller_default.getFeaturedReviews);
router4.get("/:tutorProfileId/review-stats", review_controller_default.getAllReviewStatsByTutorProfileId);
router4.get("/:tutorProfileId/reviews", review_controller_default.getAllReviewByTutorProfileId);
router4.post("/", authMiddleware_default("STUDENT" /* STUDENT */), review_controller_default.createReview);
var reviewRouter = router4;

// src/modules/auth/auth.router.ts
import { Router as Router5 } from "express";

// src/modules/auth/auth.service.ts
import { format as format4 } from "date-fns";
var getUserProfileById = async (loggedUserId) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: loggedUserId
    }
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    phoneNumber: user.phoneNumber || "N/A",
    updatedAt: format4(new Date(user.updatedAt), "MMM d, yyyy 'at' hh:mm aa")
  };
};
var updateUserProfileById = async (loggedUserId, updateData) => {
  console.log("updated data:", updateData);
  const updatedUser = await prisma.user.update({
    where: {
      id: loggedUserId
    },
    data: updateData
  });
  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    image: updatedUser.image,
    phoneNumber: updatedUser.phoneNumber || "N/A",
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
};
var authService = {
  getUserProfileById,
  updateUserProfileById
};

// src/validation/user-profile.validation.ts
import { z as z5 } from "zod";
var updateUserProfileSchema = z5.object({
  body: z5.object({
    name: z5.string().min(3, "Name must be at least 3 characters").optional(),
    phoneNumber: z5.string().min(11, "Invalid phone number").optional()
  })
});
var userQuerySchema = z5.object({
  query: z5.object({
    page: z5.string().optional().default("1"),
    limit: z5.string().optional().default("10"),
    sortBy: z5.string().optional().default("createdAt"),
    sortOrder: z5.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z5.string().optional(),
    role: z5.string().optional().transform((val) => val?.toUpperCase()),
    isActive: z5.enum(["true", "false"]).optional()
  })
});
var bannedUserSchema = z5.object({
  params: z5.object({
    id: z5.string({
      error: "User ID is required"
    })
  }),
  body: z5.object({
    isActive: z5.boolean({
      error: "isActive status is required"
    })
  })
});
var tutorProfileDetailsSchema = z5.object({
  params: z5.object({
    userId: z5.string({
      error: "User ID is required"
    })
  })
});
var studentProfileDetailsSchema = z5.object({
  params: z5.object({
    userId: z5.string({
      error: "User ID is required"
    })
  })
});
var userProfileDetailsSchema = z5.object({
  params: z5.object({
    userId: z5.string({
      error: "User ID is required"
    })
  })
});

// src/modules/auth/auth.controller.ts
import fs4 from "fs/promises";
var getUserProfileById2 = async (req, res, next) => {
  try {
    const loggedInUser = req.user?.id;
    const result = await authService.getUserProfileById(loggedInUser);
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var updateUserProfileById2 = async (req, res, next) => {
  let localFilePath = req.file?.path;
  console.log("object", localFilePath);
  try {
    const loggedInUser = req.user?.id;
    if (!loggedInUser) {
      throw new AppError("You are not authorized", 401, "UNAUTHORIZED");
    }
    const validation = updateUserProfileSchema.safeParse({ body: req.body });
    if (!validation.success) {
      throw validation.error;
    }
    const updateData = { ...validation.data.body };
    if (localFilePath) {
      const user = await authService.getUserProfileById(loggedInUser);
      const cloudinaryResult = await cloudinary_default.uploader.upload(localFilePath, {
        folder: "skillbridge/profiles"
      });
      updateData.image = cloudinaryResult.secure_url;
      if (user?.image) {
        const publicId = user.image.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary_default.uploader.destroy(`skillbridge/profiles/${publicId}`);
        }
      }
    }
    const result = await authService.updateUserProfileById(loggedInUser, updateData);
    if (result) {
      if (localFilePath) {
        await fs4.unlink(localFilePath);
      }
    }
    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: result
    });
  } catch (err) {
    if (localFilePath) {
      await fs4.unlink(localFilePath);
    }
    next(err);
  }
};
var authController = {
  getUserProfileById: getUserProfileById2,
  updateUserProfileById: updateUserProfileById2
};

// src/modules/auth/auth.router.ts
var router5 = Router5();
router5.get("/me", authMiddleware_default("STUDENT" /* STUDENT */), authController.getUserProfileById);
router5.put("/me", authMiddleware_default("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */), uploadHandler_default.single("avatar"), authController.updateUserProfileById);
var authRouter = router5;
var auth_router_default = authRouter;

// src/modules/payment/payment.router.ts
import { Router as Router6 } from "express";

// src/modules/payment/payment.service.ts
import { format as format5, startOfMonth as startOfMonth3, subMonths as subMonths3 } from "date-fns";
var getAccountDetails = async () => {
  return await prisma.platformPaymentAccount.findFirst({
    where: { isActive: true },
    select: {
      method: true,
      accountNumber: true,
      accountType: true
    }
  });
};
var getAllPaymentAccount = async (query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, method, isActive } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      accountNumber: {
        contains: searchTerm,
        mode: "insensitive"
      }
    });
  }
  if (method) {
    andConditions.push({ method });
  }
  if (isActive) {
    andConditions.push({ isActive: isActive === "true" });
  }
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const [result, total] = await Promise.all([
    prisma.platformPaymentAccount.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.platformPaymentAccount.count({ where: whereConditions })
  ]);
  return {
    data: result,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var createPaymentAccount = async (payload) => {
  const { method, accountNumber, accountType } = payload;
  const existingAccount = await prisma.platformPaymentAccount.findFirst({
    where: {
      method,
      accountNumber
    }
  });
  if (existingAccount) {
    throw new AppError("This payment account already exists", 400, "DUPLICATE_ACCOUNT");
  }
  return await prisma.platformPaymentAccount.create({
    data: {
      method,
      accountNumber,
      accountType
    }
  });
};
var updatePaymentAccount = async (id, payload) => {
  const { method, accountNumber, accountType, isActive } = payload;
  const existingAccount = await prisma.platformPaymentAccount.findUnique({
    where: { id }
  });
  if (!existingAccount) {
    throw new AppError("Payment account not found", 404, "NOT_FOUND");
  }
  return await prisma.platformPaymentAccount.update({
    where: { id },
    data: {
      method,
      accountNumber,
      accountType,
      isActive
    }
  });
};
var getAllPayments = async (query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, status } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { transactionId: { contains: searchTerm, mode: "insensitive" } },
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        {
          booking: {
            tutorProfile: {
              user: { name: { contains: searchTerm, mode: "insensitive" } }
            }
          }
        },
        {
          booking: {
            tutorProfile: {
              tutorCategories: {
                some: {
                  category: {
                    name: { contains: searchTerm, mode: "insensitive" }
                  }
                }
              }
            }
          }
        }
      ]
    });
  }
  if (status) {
    andConditions.push({ status });
  }
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const [result, total] = await Promise.all([
    prisma.payment.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: { name: true } },
        booking: {
          include: {
            tutorProfile: {
              include: {
                user: { select: { name: true } },
                tutorCategories: { include: { category: { select: { name: true } } } }
              }
            }
          }
        }
      }
    }),
    prisma.payment.count({ where: whereConditions })
  ]);
  const formattedData = result.map((payment) => ({
    paymentId: payment.id,
    transactionId: payment.transactionId,
    studentName: payment.user?.name || "N/A",
    tutorName: payment.booking?.tutorProfile?.user?.name || "N/A",
    tutorCategoryName: payment.booking?.tutorProfile?.tutorCategories.map((tc) => tc.category.name) || [],
    paymentSummitedDate: format5(payment.submittedAt, "MMM dd, yyyy"),
    amount: payment.amount,
    status: payment.status
  }));
  return {
    data: formattedData,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPage: Math.ceil(total / limitNumber)
    }
  };
};
var getPaymentStats = async () => {
  const now = /* @__PURE__ */ new Date();
  const currentMonthStart = startOfMonth3(now);
  const previousMonthStart = startOfMonth3(subMonths3(now, 1));
  const [
    totalEarningAggregate,
    totalPendingPayments,
    totalSuccessfulPayments,
    totalFailedPayments,
    currentMonthStats,
    previousMonthStats
  ] = await Promise.all([
    // Total Successful Earning (All time)
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCESS" }
    }),
    // Total Counts (All time)
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    // Current Month Stats
    Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS", submittedAt: { gte: currentMonthStart } }
      }),
      prisma.payment.count({ where: { status: "PENDING", submittedAt: { gte: currentMonthStart } } }),
      prisma.payment.count({ where: { status: "SUCCESS", submittedAt: { gte: currentMonthStart } } }),
      prisma.payment.count({ where: { status: "FAILED", submittedAt: { gte: currentMonthStart } } })
    ]),
    // Previous Month Stats
    Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS", submittedAt: { gte: previousMonthStart, lt: currentMonthStart } }
      }),
      prisma.payment.count({ where: { status: "PENDING", submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
      prisma.payment.count({ where: { status: "SUCCESS", submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
      prisma.payment.count({ where: { status: "FAILED", submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } })
    ])
  ]);
  const totalEarning = totalEarningAggregate._sum.amount || 0;
  const currentEarnings = currentMonthStats[0]._sum.amount || 0;
  const currentPending = currentMonthStats[1];
  const currentSuccess = currentMonthStats[2];
  const currentFailed = currentMonthStats[3];
  const previousEarnings = previousMonthStats[0]._sum.amount || 0;
  const previousPending = previousMonthStats[1];
  const previousSuccess = previousMonthStats[2];
  const previousFailed = previousMonthStats[3];
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (current - previous) / previous * 100;
  };
  return {
    totalEarning,
    earningGrowthMetric: parseFloat(calculateGrowth(currentEarnings, previousEarnings).toFixed(2)),
    totalPendingPayments,
    pendingPaymentGrowthMetric: parseFloat(calculateGrowth(currentPending, previousPending).toFixed(2)),
    totalSuccessfulPayments,
    successfulPaymentGrowthMetric: parseFloat(calculateGrowth(currentSuccess, previousSuccess).toFixed(2)),
    totalFailedPayments,
    failedPaymentGrowthMetric: parseFloat(calculateGrowth(currentFailed, previousFailed).toFixed(2))
  };
};
var verifyPaymentTransaction = async (paymentId, status) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          user: true,
          availabilitySlot: {
            include: {
              tutorProfile: { include: { user: true } }
            }
          }
        }
      },
      user: true
    }
  });
  if (!payment) {
    throw new AppError("Payment record not found", 404);
  }
  if (payment.status !== "PENDING") {
    throw new AppError("This payment has already been processed", 400);
  }
  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status,
        verifiedAt: /* @__PURE__ */ new Date()
      }
    });
    if (status === "SUCCESS") {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" }
      });
    } else {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CANCELLED" }
      });
      await tx.availabilitySlot.update({
        where: { id: payment.booking.availabilitySlotId },
        data: { isBooked: false }
      });
    }
    return updatedPayment;
  });
  if (status === "SUCCESS") {
    const studentHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h2>Payment Confirmed!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hi <strong>${payment.user.name}</strong>,</p>
                    <p>Your payment for <strong>#${payment.transactionId}</strong> has been verified. Your session is now officially booked.</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
                        <p><strong>Amount:</strong> ${payment.amount} BDT</p>
                        <p><strong>Tutor:</strong> ${payment.booking.availabilitySlot.tutorProfile.user.name}</p>
                    </div>
                </div>
            </div>`;
    const tutorHtml = `
            <div style="font-family: sans-serif; padding: 20px; border-left: 5px solid #4CAF50;">
                <h2>New Class Confirmed!</h2>
                <p>Hello ${payment.booking.availabilitySlot.tutorProfile.user.name},</p>
                <p>Payment for student <strong>${payment.user.name}</strong> has been verified. Check your schedule.</p>
            </div>`;
    sendEmail({ to: payment.user.email, subject: "Payment Success", html: studentHtml }).catch((e) => console.error("Email Error:", e));
    sendEmail({ to: payment.booking.availabilitySlot.tutorProfile.user.email, subject: "New Booking", html: tutorHtml }).catch((e) => console.error("Email Error:", e));
  } else {
    const failedHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f44336;">
                <h2 style="color: #f44336;">Payment Verification Failed</h2>
                <p>Hi ${payment.user.name}, the transaction ID <strong>${payment.transactionId}</strong> you provided could not be verified.</p>
                <p>Please try again or contact support.</p>
            </div>`;
    sendEmail({ to: payment.user.email, subject: "Payment Failed", html: failedHtml }).catch((e) => console.error("Email Error:", e));
  }
  return result;
};
var getPaymentAccountDetailsById = async (id) => {
  const paymentAccount = await prisma.platformPaymentAccount.findUnique({
    where: { id }
  });
  if (!paymentAccount) {
    throw new AppError("Payment account not found", 404);
  }
  return paymentAccount;
};
var paymentService = {
  getAccountDetails,
  getAllPaymentAccount,
  createPaymentAccount,
  updatePaymentAccount,
  getAllPayments,
  getPaymentStats,
  verifyPaymentTransaction,
  getPaymentAccountDetailsById
};
var payment_service_default = paymentService;

// src/validation/payment.validation.ts
import { z as z6 } from "zod";
var paymentSchema = z6.object({
  body: z6.object({
    bookingId: z6.uuid("Invalid Booking ID"),
    paymentMethod: z6.enum(["BKASH", "NAGAD", "ROCKET"]),
    transactionId: z6.string().min(6, "Transaction ID is too short")
  })
});
var paymentAccountSchema = z6.object({
  body: z6.object({
    method: z6.enum(["BKASH", "NAGAD", "ROCKET"]),
    accountNumber: z6.string().min(11, "Account number must be at least 11 digits").max(15, "Account number is too long"),
    accountType: z6.enum(["PERSONAL", "MERCHANT"])
  })
});
var paymentAccountUpdateSchema = z6.object({
  body: z6.object({
    method: z6.enum(["BKASH", "NAGAD", "ROCKET"]),
    accountNumber: z6.string().min(11, "Account number must be at least 11 digits").max(15, "Account number is too long"),
    accountType: z6.enum(["PERSONAL", "MERCHANT"]),
    isActive: z6.boolean()
  })
});
var paymentAccountQuerySchema = z6.object({
  query: z6.object({
    page: z6.string().optional().default("1"),
    limit: z6.string().optional().default("10"),
    sortBy: z6.string().optional().default("method"),
    sortOrder: z6.enum(["asc", "desc"]).optional().default("asc"),
    searchTerm: z6.string().optional(),
    method: z6.string().optional(),
    // BKASH, NAGAD etc.
    isActive: z6.enum(["true", "false"]).optional()
  })
});
var paymentQuerySchema = z6.object({
  query: z6.object({
    page: z6.string().optional().default("1"),
    limit: z6.string().optional().default("10"),
    sortBy: z6.string().optional().default("submittedAt"),
    sortOrder: z6.enum(["asc", "desc"]).optional().default("desc"),
    searchTerm: z6.string().optional(),
    paymentMethod: z6.string().optional().transform((val) => val?.toUpperCase()),
    status: z6.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).optional()
  })
});
var verifyPaymentSchema = z6.object({
  params: z6.object({
    id: z6.string({ error: "Payment ID is required" })
  }),
  body: z6.object({
    status: z6.enum(["SUCCESS", "FAILED"], {
      error: "Verification status (SUCCESS/FAILED) is required"
    })
  })
});
var paymentAccountDetailsSchema = z6.object({
  params: z6.object({
    id: z6.string({ error: "Payment ID is required" })
  })
});

// src/modules/payment/payment.controller.ts
var getAccountDetails2 = async (req, res, next) => {
  try {
    const result = await payment_service_default.getAccountDetails();
    res.status(200).json({
      success: true,
      message: "Payment account details fetched successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllPaymentAccount2 = async (req, res, next) => {
  try {
    const validation = paymentAccountQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await payment_service_default.getAllPaymentAccount(validation.data.query);
    res.status(200).json({
      success: true,
      message: "Payment account fetch successfully.",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var createPaymentAccount2 = async (req, res, next) => {
  try {
    const validation = paymentAccountSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await payment_service_default.createPaymentAccount(validation.data.body);
    res.status(201).json({
      success: true,
      message: "Payment Account details created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var updatePaymentAccount2 = async (req, res, next) => {
  try {
    const validation = paymentAccountUpdateSchema.safeParse({ body: req.body });
    if (!validation.success) throw validation.error;
    const result = await payment_service_default.updatePaymentAccount(req.params.id, validation.data.body);
    res.status(200).json({
      success: true,
      message: "Payment Account details updated successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllPayments2 = async (req, res, next) => {
  try {
    const validation = paymentQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await payment_service_default.getAllPayments(validation.data.query);
    res.status(200).json({
      success: true,
      message: `Payment details fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getPaymentStats2 = async (req, res, next) => {
  try {
    const result = await payment_service_default.getPaymentStats();
    res.status(200).json({
      success: true,
      message: `Payment statistics fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var verifyPaymentTransaction2 = async (req, res, next) => {
  try {
    const validation = verifyPaymentSchema.safeParse({ params: req.params, body: req.body });
    if (!validation.success) throw validation.error;
    const { id } = validation.data.params;
    const { status } = validation.data.body;
    console.log(id, status);
    const result = await payment_service_default.verifyPaymentTransaction(id, status);
    res.status(200).json({
      success: true,
      message: `Payment marked as ${status.toLowerCase()} successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getPaymentAccountDetailsById2 = async (req, res, next) => {
  try {
    const validation = paymentAccountDetailsSchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const { id } = validation.data.params;
    const result = await payment_service_default.getPaymentAccountDetailsById(id);
    res.status(200).json({
      success: true,
      message: `Payment details fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var paymentController = {
  getAccountDetails: getAccountDetails2,
  getAllPaymentAccount: getAllPaymentAccount2,
  createPaymentAccount: createPaymentAccount2,
  updatePaymentAccount: updatePaymentAccount2,
  getAllPayments: getAllPayments2,
  getPaymentStats: getPaymentStats2,
  verifyPaymentTransaction: verifyPaymentTransaction2,
  getPaymentAccountDetailsById: getPaymentAccountDetailsById2
};
var payment_controller_default = paymentController;

// src/modules/payment/payment.router.ts
var router6 = Router6();
router6.get("/account-details", authMiddleware_default("STUDENT" /* STUDENT */), payment_controller_default.getAccountDetails);
router6.get("/admin/accounts", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.getAllPaymentAccount);
router6.get("/admin", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.getAllPayments);
router6.get("/admin/stats", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.getPaymentStats);
router6.get("/admin/:id", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.getPaymentAccountDetailsById);
router6.patch("/admin/verify/:id", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.verifyPaymentTransaction);
router6.post("/admin/account", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.createPaymentAccount);
router6.put("/admin/account/:id", authMiddleware_default("ADMIN" /* ADMIN */), payment_controller_default.updatePaymentAccount);
var paymentRouter = router6;

// src/modules/admin/admin.router.ts
import { Router as Router7 } from "express";

// src/modules/admin/admin.service.ts
import { format as format6, formatDistanceToNow as formatDistanceToNow3, parse as parse4 } from "date-fns";
var getDashboardStats = async () => {
  const [
    totalUsers,
    totalTutors,
    totalStudents,
    totalBannedUsers,
    recentBookings,
    recentPayments
  ] = await Promise.all([
    // total users (without Admin)
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    // total tutor count
    prisma.tutorProfile.count(),
    // total student count
    prisma.user.count({ where: { role: "STUDENT" } }),
    // total banned users
    prisma.user.count({ where: { isActive: false } }),
    // Recent 5 Bookings
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } },
        tutorProfile: {
          include: {
            user: { select: { name: true, email: true, image: true } },
            tutorCategories: { include: { category: { select: { name: true } } } }
          }
        },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } }
      }
    }),
    // Recent 5 payments for activity tracking
    prisma.payment.findMany({
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: { user: { select: { name: true } } }
    })
  ]);
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBannedUsers,
    recentBookings: recentBookings.map((booking) => ({
      studentName: booking.user.name,
      studentEmail: booking.user.email,
      studentImage: booking.user.image,
      tutorName: booking.tutorProfile.user.name,
      tutorEmail: booking.tutorProfile.user.email,
      tutorImage: booking.tutorProfile.user.image,
      tutorCategories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
      availabilitySlotDate: format6(booking.availabilitySlot.date, "MMMM dd, yyyy"),
      availabilitySlotStartTime: format6(parse4(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      availabilitySlotEndTime: format6(parse4(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      price: booking.price,
      status: booking.status
    })),
    recentPayments: recentPayments.map((payment) => ({
      transactionId: payment.transactionId,
      studentName: payment.user.name,
      amount: payment.amount,
      date: formatDistanceToNow3(new Date(payment.submittedAt), { addSuffix: true }),
      status: payment.status
    }))
  };
};
var getAllPlatformUser = async (query) => {
  const { page, limit, sortBy, sortOrder, searchTerm, role, isActive } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } }
      ]
    });
  }
  if (role && Object.values(UserRole).includes(role)) {
    andConditions.push({ role });
  }
  if (isActive) {
    andConditions.push({ isActive: isActive === "true" });
  }
  andConditions.push({
    role: {
      not: "ADMIN"
    }
  });
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        image: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where: whereConditions })
  ]);
  return {
    data: result,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    }
  };
};
var getUserByUserId = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      image: true,
      createdAt: true
    }
  });
};
var getTutorProfileDetailsByUserId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tutorProfile: {
        include: {
          bookings: {
            where: {
              status: { in: ["CONFIRMED", "COMPLETED"] }
            },
            include: {
              availabilitySlot: true
            }
          }
        }
      }
    }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (!user.tutorProfile) {
    throw new AppError("Tutor profile not found for this user", 404);
  }
  const tutorProfile = user.tutorProfile;
  let totalMinutes = 0;
  tutorProfile.bookings.forEach((booking) => {
    if (booking.availabilitySlot) {
      const start = parse4(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date());
      const end = parse4(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date());
      const diff = (end.getTime() - start.getTime()) / (1e3 * 60);
      totalMinutes += diff;
    }
  });
  const totalHours = Math.floor(totalMinutes / 60);
  const uniqueStudents = new Set(tutorProfile.bookings.map((b) => b.studentId));
  const totalStudentTaught = uniqueStudents.size;
  return {
    tutorName: user.name,
    tutorEmail: user.email,
    tutorImage: user.image,
    role: user.role,
    joiningDate: format6(user.createdAt, "MMM dd, yyyy"),
    status: user.isActive ? "Active" : "Banned",
    tutorTitle: tutorProfile.title,
    experience: `${tutorProfile.experience} years`,
    phoneNumber: user.phoneNumber || "N/A",
    hourlyRate: tutorProfile.hourlyRate || 0,
    rating: tutorProfile.rating || 0,
    totalReviews: tutorProfile.totalReviews || 0,
    totalSession: `${totalHours} hours`,
    totalStudentTaught: `${totalStudentTaught} unique students`,
    bio: tutorProfile.bio
  };
};
var getStudentDetailsByUserId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          tutorProfile: {
            include: {
              user: { select: { name: true } },
              tutorCategories: { include: { category: { select: { name: true } } } }
            }
          },
          payment: { select: { transactionId: true } }
        }
      },
      payments: {
        take: 5,
        orderBy: { submittedAt: "desc" },
        include: {
          booking: {
            include: {
              tutorProfile: {
                include: {
                  user: { select: { name: true } },
                  tutorCategories: { include: { category: { select: { name: true } } } }
                }
              }
            }
          }
        }
      },
      _count: {
        select: { bookings: true }
      }
    }
  });
  if (!user) {
    throw new AppError("Student not found", 404);
  }
  return {
    studentName: user.name,
    studentEmail: user.email,
    studentImage: user.image,
    role: user.role,
    joiningDate: format6(user.createdAt, "MMM dd, yyyy"),
    accountStatus: user.isActive ? "Active" : "Banned",
    phoneNumber: user.phoneNumber || "N/A",
    totalBookings: `${user._count.bookings} bookings`,
    recentBookings: user.bookings.map((booking) => ({
      date: format6(booking.createdAt, "MMM dd, yyyy"),
      tutorName: booking.tutorProfile?.user?.name || "N/A",
      subject: booking.tutorProfile?.tutorCategories.map((tc) => tc.category.name) || [],
      status: booking.status
    })),
    recentPayments: user.payments.map((payment) => ({
      transactionId: payment.transactionId || "N/A",
      amount: payment.amount,
      submittedDate: format6(payment.submittedAt, "MMM dd, yyyy"),
      status: payment.status
    }))
  };
};
var bannedUserAccount = async (adminId, targetUserId, status) => {
  if (adminId === targetUserId) {
    throw new AppError("You cannot ban your own account!", 400, "SELF_BAN_ERROR");
  }
  const user = await prisma.user.findUnique({
    where: { id: targetUserId }
  });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  return await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: status },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      role: true
    }
  });
};
var adminService = {
  getDashboardStats,
  getAllPlatformUser,
  getUserByUserId,
  getTutorProfileDetailsByUserId,
  getStudentDetailsByUserId,
  bannedUserAccount
};
var admin_service_default = adminService;

// src/modules/admin/admin.controller.ts
var getDashboardStats2 = async (req, res, next) => {
  try {
    const result = await admin_service_default.getDashboardStats();
    res.status(200).json({
      success: true,
      message: `Dashboard statistics fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getAllPlatformUser2 = async (req, res, next) => {
  try {
    const validation = userQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const result = await admin_service_default.getAllPlatformUser(validation.data.query);
    res.status(200).json({
      success: true,
      message: "Platform users fetch successfully.",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getUserProfileDetailsByUserId = async (req, res, next) => {
  try {
    const validation = userProfileDetailsSchema.safeParse({ params: req.params });
    if (!validation.success) throw validation.error;
    const { userId } = validation.data.params;
    const user = await admin_service_default.getUserByUserId(userId);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "TUTOR" /* TUTOR */) {
      const result = await admin_service_default.getTutorProfileDetailsByUserId(userId);
      res.status(200).json({
        success: true,
        message: `User details fetched successfully.`,
        data: result
      });
    }
    if (user.role === "STUDENT" /* STUDENT */) {
      const result = await admin_service_default.getStudentDetailsByUserId(userId);
      res.status(200).json({
        success: true,
        message: `User details fetched successfully.`,
        data: result
      });
    }
  } catch (err) {
    next(err);
  }
};
var bannedUserAccount2 = async (req, res, next) => {
  try {
    const adminId = req.user?.id;
    const validation = bannedUserSchema.safeParse({ params: req.params, body: req.body });
    if (!validation.success) throw validation.error;
    const { id } = validation.data.params;
    const { isActive } = validation.data.body;
    const result = await admin_service_default.bannedUserAccount(adminId, id, isActive);
    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "banned"} successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var adminController = {
  getDashboardStats: getDashboardStats2,
  getAllPlatformUser: getAllPlatformUser2,
  getUserProfileDetailsByUserId,
  bannedUserAccount: bannedUserAccount2
};
var admin_controller_default = adminController;

// src/modules/admin/admin.router.ts
var router7 = Router7();
router7.get("/dashboard-stats", authMiddleware_default("ADMIN" /* ADMIN */), admin_controller_default.getDashboardStats);
router7.get("/users", authMiddleware_default("ADMIN" /* ADMIN */), admin_controller_default.getAllPlatformUser);
router7.get("/users/:userId", authMiddleware_default("ADMIN" /* ADMIN */), admin_controller_default.getUserProfileDetailsByUserId);
router7.patch("/users/toggle-status/:id", authMiddleware_default("ADMIN" /* ADMIN */), admin_controller_default.bannedUserAccount);
var adminRouter = router7;
var admin_router_default = adminRouter;

// src/modules/student/student.router.ts
import { Router as Router8 } from "express";

// src/modules/student/student.service.ts
import { differenceInMinutes as differenceInMinutes3, format as format7, parse as parse5, addDays as addDays2, isSameDay as isSameDay2, startOfDay as startOfDay2, isAfter as isAfter2, startOfMonth as startOfMonth4, endOfMonth as endOfMonth2, endOfDay as endOfDay2 } from "date-fns";
var getDashboardMetaData = async (studentId) => {
  const now = /* @__PURE__ */ new Date();
  const bookings = await prisma.booking.findMany({
    where: {
      studentId
    },
    include: {
      availabilitySlot: true,
      user: { select: { name: true } },
      review: true
    }
  });
  const student = await prisma.user.findUniqueOrThrow({
    where: { id: studentId },
    select: { name: true }
  });
  let totalMinutes = 0;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  for (const b of completedBookings) {
    if (b.availabilitySlot) {
      const start = parse5(b.availabilitySlot.startTime, "HH:mm", new Date(b.availabilitySlot.date));
      const end = parse5(b.availabilitySlot.endTime, "HH:mm", new Date(b.availabilitySlot.date));
      const diff = differenceInMinutes3(end, start);
      if (!Number.isNaN(diff) && diff > 0) {
        totalMinutes += diff;
      }
    }
  }
  const totalLearningHours = Math.floor(totalMinutes / 60);
  const totalLearningMunites = totalMinutes % 60;
  const totalHoursLearned = `${totalLearningHours}h ${totalLearningMunites}m`;
  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "PENDING");
  const getSlotEndTime = (b) => {
    const dateStr = format7(b.availabilitySlot.date, "yyyy-MM-dd");
    return parse5(`${dateStr} ${b.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
  };
  const endOfWeek = addDays2(now, 7);
  const thisWeekBookings = activeBookings.filter((b) => {
    if (!b.availabilitySlot) return false;
    const slotEndTime = getSlotEndTime(b);
    return slotEndTime > now && slotEndTime <= endOfWeek;
  });
  const thisWeekCount = thisWeekBookings.length;
  const todayBookings = activeBookings.filter((b) => {
    if (!b.availabilitySlot) return false;
    const isToday = isSameDay2(new Date(b.availabilitySlot.date), now);
    if (!isToday) return false;
    const slotEndTime = getSlotEndTime(b);
    return slotEndTime > now;
  });
  const todayCount = todayBookings.length;
  const confirmedBookings = activeBookings.filter((b) => {
    if (b.status !== "CONFIRMED") return false;
    if (!b.availabilitySlot) return false;
    const slotEndTime = getSlotEndTime(b);
    return slotEndTime > now;
  });
  const activeSessionsCount = confirmedBookings.length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "PENDING").length;
  const unreviewedBookings = completedBookings.filter((b) => b.review === null);
  const unreviewedCount = unreviewedBookings.length;
  return {
    stats: {
      studentName: student.name || "",
      totalHoursLearned,
      upcomingSessionsCount: {
        thisWeekCount,
        todayCount
      },
      activeSessions: {
        count: activeSessionsCount,
        pendingModules: pendingBookingsCount
      },
      unreviewedBookings: {
        count: unreviewedCount,
        pendingFeedbackSessions: unreviewedCount
      }
    }
  };
};
var getUpcomingStudentSessions = async (studentId, limit) => {
  const now = /* @__PURE__ */ new Date();
  const todayStart = startOfDay2(now);
  const result = await prisma.booking.findMany({
    where: {
      studentId,
      status: "CONFIRMED",
      availabilitySlot: {
        date: { gte: todayStart }
      }
    },
    orderBy: [
      { availabilitySlot: { date: "asc" } },
      { availabilitySlot: { startTime: "asc" } }
    ],
    take: limit * 5,
    // fetch extra to account for in-progress slot filtering
    include: {
      availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
      tutorProfile: {
        include: {
          user: { select: { name: true, image: true } },
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      }
    }
  });
  return result.filter((booking) => {
    const dateStr = format7(booking.availabilitySlot.date, "yyyy-MM-dd");
    const endDateTime = parse5(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
    return isAfter2(endDateTime, now);
  }).slice(0, limit);
};
var getDashboardUpcomingSessions = async (studentId) => {
  const upcomingSessionsRaw = await getUpcomingStudentSessions(studentId, 3);
  const upcomingSessions = upcomingSessionsRaw.map((booking) => {
    const dateStr = format7(booking.availabilitySlot.date, "yyyy-MM-dd");
    const startTimeISO = parse5(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date()).toISOString();
    return {
      bookingId: booking.id,
      tutorName: booking.tutorProfile.user.name,
      tutorImage: booking.tutorProfile.user.image ?? null,
      categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
      slotStartTime: format7(parse5(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      slotEndTime: format7(parse5(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      startTimeISO,
      meetingLink: booking.meetingLink ?? null
    };
  });
  return upcomingSessions;
};
var getDashboardRecentBookings = async (studentId) => {
  const recentBookings = await prisma.booking.findMany({
    where: {
      studentId
    },
    take: 5,
    include: {
      availabilitySlot: true,
      tutorProfile: {
        include: {
          user: { select: { name: true, image: true } },
          tutorCategories: { include: { category: { select: { name: true } } } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const formattedBookings = recentBookings.map((booking) => ({
    bookingId: booking.id,
    tutorName: booking.tutorProfile.user.name,
    tutorImage: booking.tutorProfile.user.image ?? null,
    tutorTitle: booking.tutorProfile.title,
    categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
    availabilitySlotDate: format7(booking.availabilitySlot.date, "MMMM dd, yyyy"),
    slotStartTime: format7(parse5(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    slotEndTime: format7(parse5(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    status: booking.status,
    amount: booking.price
  }));
  return formattedBookings;
};
var getScheduleCalendarEvents = async (studentId, startDate, endDate) => {
  const now = /* @__PURE__ */ new Date();
  const start = startDate ? startOfDay2(new Date(startDate)) : startOfMonth4(now);
  const end = endDate ? endOfDay2(new Date(endDate)) : endOfMonth2(now);
  const whereConditions = {
    studentId,
    status: { in: ["CONFIRMED", "COMPLETED"] },
    availabilitySlot: {
      date: {
        gte: start,
        lte: end
      }
    }
  };
  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    include: {
      availabilitySlot: true,
      tutorProfile: {
        include: {
          user: { select: { name: true } },
          tutorCategories: {
            include: { category: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: [
      { availabilitySlot: { date: "asc" } },
      { availabilitySlot: { startTime: "asc" } }
    ]
  });
  const calendarEvents = bookings.map((b) => ({
    bookingId: b.id,
    categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
    tutorName: b.tutorProfile.user.name,
    dateISO: b.availabilitySlot.date.toISOString(),
    startTime: format7(parse5(b.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    endTime: format7(parse5(b.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
    bookingStatus: b.status,
    meetingLink: b.meetingLink
  }));
  return { calendarEvents };
};
var getScheduleMetaData = async (studentId) => {
  const now = /* @__PURE__ */ new Date();
  const bookings = await prisma.booking.findMany({
    where: {
      studentId,
      status: { in: ["CONFIRMED", "COMPLETED"] }
    },
    include: {
      availabilitySlot: true
    }
  });
  const getSlotEndTime = (b) => {
    const dateStr = format7(b.availabilitySlot.date, "yyyy-MM-dd");
    return parse5(`${dateStr} ${b.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date());
  };
  const todayBookings = bookings.filter((b) => {
    if (!b.availabilitySlot) return false;
    const isToday = isSameDay2(new Date(b.availabilitySlot.date), now);
    if (!isToday) return false;
    const slotEndTime = getSlotEndTime(b);
    return slotEndTime > now;
  });
  const todayCount = todayBookings.length;
  const upcomingSessionsRaw = await getUpcomingStudentSessions(studentId, 5);
  const upcomingSessions = upcomingSessionsRaw.map((booking) => {
    const dateStr = format7(booking.availabilitySlot.date, "yyyy-MM-dd");
    const startTimeISO = parse5(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", /* @__PURE__ */ new Date()).toISOString();
    return {
      bookingId: booking.id,
      tutorName: booking.tutorProfile.user.name,
      tutorImage: booking.tutorProfile.user.image ?? null,
      categories: booking.tutorProfile.tutorCategories.map((tc) => tc.category.name),
      slotStartTime: format7(parse5(booking.availabilitySlot.startTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      slotEndTime: format7(parse5(booking.availabilitySlot.endTime, "HH:mm", /* @__PURE__ */ new Date()), "hh:mm a"),
      startTimeISO,
      meetingLink: booking.meetingLink ?? null
    };
  });
  return {
    todaySessionCount: todayCount,
    upcomingSessions
  };
};
var studentService = {
  getDashboardMetaData,
  getDashboardUpcomingSessions,
  getDashboardRecentBookings,
  getScheduleCalendarEvents,
  getScheduleMetaData
};
var student_service_default = studentService;

// src/modules/student/student.controller.ts
var getDashboardMetaData2 = async (req, res, next) => {
  try {
    const result = await student_service_default.getDashboardMetaData(req.user?.id);
    res.status(200).json({
      success: true,
      message: `Dashboard meta data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getDashboardUpcomingSessions2 = async (req, res, next) => {
  try {
    const result = await student_service_default.getDashboardUpcomingSessions(req.user?.id);
    res.status(200).json({
      success: true,
      message: `Dashboard Upcoming sessions data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getDashboardRecentBookings2 = async (req, res, next) => {
  try {
    const result = await student_service_default.getDashboardRecentBookings(req.user?.id);
    res.status(200).json({
      success: true,
      message: `Dashboard recent booking data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getScheduleMetaData2 = async (req, res, next) => {
  try {
    const result = await student_service_default.getScheduleMetaData(req.user?.id);
    res.status(200).json({
      success: true,
      message: `Schedule meta data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var getScheduleCalendarEvents2 = async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const validation = scheduleEventsQuerySchema.safeParse({ query: req.query });
    if (!validation.success) throw validation.error;
    const { startDate, endDate } = validation.data.query;
    const result = await student_service_default.getScheduleCalendarEvents(studentId, startDate, endDate);
    res.status(200).json({
      success: true,
      message: `Schedule calendar events data fetched successfully.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var studentController = {
  getDashboardMetaData: getDashboardMetaData2,
  getDashboardUpcomingSessions: getDashboardUpcomingSessions2,
  getDashboardRecentBookings: getDashboardRecentBookings2,
  getScheduleMetaData: getScheduleMetaData2,
  getScheduleCalendarEvents: getScheduleCalendarEvents2
};
var student_controller_default = studentController;

// src/modules/student/student.router.ts
var router8 = Router8();
router8.get("/dashboard/meta", authMiddleware_default("STUDENT" /* STUDENT */), student_controller_default.getDashboardMetaData);
router8.get("/dashboard/upcoming-sessions", authMiddleware_default("STUDENT" /* STUDENT */), student_controller_default.getDashboardUpcomingSessions);
router8.get("/dashboard/recent-bookings", authMiddleware_default("STUDENT" /* STUDENT */), student_controller_default.getDashboardRecentBookings);
router8.get("/schedule/meta", authMiddleware_default("STUDENT" /* STUDENT */), student_controller_default.getScheduleMetaData);
router8.get("/schedule/events", authMiddleware_default("STUDENT" /* STUDENT */), student_controller_default.getScheduleCalendarEvents);
var studentRouter = router8;

// src/modules/contact/contact.router.ts
import { Router as Router9 } from "express";

// src/modules/contact/contact.service.ts
var createContactMessage = async (payload) => {
  const { fullName, email, role, subject, message } = payload;
  const newMessage = await prisma.contactMessage.create({
    data: { fullName, email, role, subject, message }
  });
  const adminEmail = "abdushah49@gmail.com";
  const mailOptions = {
    to: adminEmail,
    subject: `SkillBridge Contact: ${subject}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #007a3d; border-bottom: 2px solid #007a3d; padding-bottom: 10px;">New Contact Message</h2>
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Role:</strong> ${role}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid #007a3d;">
                    <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <p style="font-size: 12px; color: #777; margin-top: 20px;">This message was also saved successfully to the database (ID: ${newMessage.id}).</p>
            </div>
        `
  };
  try {
    await sendEmail({
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      from: `"${fullName} (${role})" <${config_default.email_user}>`,
      replyTo: email
    });
  } catch (err) {
    console.error("Failed to send contact email:", err);
  }
  return newMessage;
};
var contactService = {
  createContactMessage
};

// src/validation/contact.validation.ts
import { z as z7 } from "zod";
var contactMessageBodySchema = z7.object({
  fullName: z7.string().trim().min(1, "Full name is required"),
  email: z7.email("Invalid email address").min(1, "Email is required"),
  role: z7.enum(["STUDENT", "TUTOR"]),
  subject: z7.string().trim().min(1, "Subject is required"),
  message: z7.string().trim().min(1, "Message is required")
});

// src/modules/contact/contact.controller.ts
var createContactMessage2 = async (req, res, next) => {
  try {
    console.log(req.body);
    const validation = contactMessageBodySchema.safeParse(req.body);
    if (!validation.success) throw validation.error;
    const result = await contactService.createContactMessage(validation.data);
    res.status(201).json({
      success: true,
      message: "Contact message send successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
var contactController = { createContactMessage: createContactMessage2 };

// src/modules/contact/contact.router.ts
var router9 = Router9();
router9.post("/", contactController.createContactMessage);
var contactRouter = router9;

// src/app.ts
var app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: [config_default.app_url],
    credentials: true
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Welcome to SkillBridge Backend App");
});
app.use("/api/v1/profile", auth_router_default);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/tutors", tutorRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/admin", admin_router_default);
app.use("/api/v1/contacts", contactRouter);
app.use(notFound_default);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var PORT = process.env.PORT || 5e3;
async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully.");
    if (process.env.NODE_ENV !== "production") {
      app_default.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
if (process.env.NODE_ENV !== "production") {
  main();
}
var index_default = app_default;
export {
  index_default as default
};

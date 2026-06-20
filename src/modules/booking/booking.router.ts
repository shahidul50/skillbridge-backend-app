import { Router } from "express";
import bookingController from "./booking.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  / route is getting all bookings by author id
router.get('/', auth(UserRole.STUDENT), bookingController.getAllBookingByAuthor);

//  /bookings route is getting all bookings for admin dashboard
router.get('/admin', auth(UserRole.ADMIN), bookingController.getAllBooking);

//  /booking-stats route is getting all bookings stats for admin dashboard
router.get('/admin/stats', auth(UserRole.ADMIN), bookingController.getBookingStats);

//  /booking-receipt/:id route is getting booking receipt for admin dashboard
router.get('/admin/receipt/:id', auth(UserRole.ADMIN), bookingController.getBookingReceipt);

//  /student route is  getting all bookings for student dashboard
router.get('/student', auth(UserRole.STUDENT), bookingController.getAllBookingByStudentId);

//  /student/meta route is getting bookings meta data for student dashboard
router.get('/student/meta', auth(UserRole.STUDENT), bookingController.getBookingsMetaDataByStudentId);

//  /student/:bookingId route is  getting bookings details by bookingId for student dashboard
router.get('/student/:id', auth(UserRole.STUDENT), bookingController.getBookingReciptByBookingId);

//  / route is creating new booking with payment
router.post('/', auth(UserRole.STUDENT), bookingController.createBookingWithPayment);

export const bookingRouter: Router = router;
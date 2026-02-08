import { Router } from "express";
import bookingController from "./booking.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  / route for get bookings by author id
router.get('/', auth(UserRole.STUDENT), bookingController.getAllBookingByAuthor);

//  / route for create new booking
router.post('/', auth(UserRole.STUDENT), bookingController.createBooking);

//  /update-booking-status route for update booking status
router.patch('/:id', bookingController.updateBookingStatus);



export const bookingRouter: Router = router;
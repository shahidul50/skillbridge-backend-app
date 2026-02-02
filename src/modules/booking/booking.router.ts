import { Router } from "express";
import bookingController from "./booking.controller";

const router = Router();

//  / route for get bookings by author id
router.get('/author/:id', bookingController.getAllBookingByAuthorId);

//  / route for create new booking
router.post('/', bookingController.createBooking);

//  /update-booking-status route for update booking status
router.patch('/:id', bookingController.updateBookingStatus);



export const bookingRouter: Router = router;
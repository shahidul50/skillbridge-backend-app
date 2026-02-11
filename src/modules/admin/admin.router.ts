import { Router } from "express";
import adminController from "./admin.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  /account-details route for getting all platform payment account
router.get("/account-details", auth(UserRole.ADMIN), adminController.getAllPaymentAccount);

//  /account-details route for getting all platform user
router.get("/users", auth(UserRole.ADMIN), adminController.getAllPlatformUser);

//  /payments route for getting all payment
router.get('/payments', auth(UserRole.ADMIN), adminController.getAllPayments);

//  /bookings route for getting all bookings
router.get('/bookings', auth(UserRole.ADMIN), adminController.getAllBooking);

//    /dashboard-stats  route for get dashboard statistics 
router.get('/dashboard-stats', auth(UserRole.ADMIN), adminController.getStats);

//  /payments/verify/:id route for verify booking payment
router.patch('/payments/verify/:id', auth(UserRole.ADMIN), adminController.verifyPaymentTransaction);

//   /users/toggle-status/:id route for banned or activated user status
router.patch("/users/toggle-status/:id", auth(UserRole.ADMIN), adminController.bannedUserAccount)


const adminRouter: Router = router
export default adminRouter;
import { Router } from "express";
import paymentController from "./payment.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();
//  /payments/account-details route is getting user payment account details for student
router.get('/account-details', auth(UserRole.STUDENT), paymentController.getAccountDetails)

//  /admin/accounts route for getting all platform payment account for admin dashboard
router.get("/admin/accounts", auth(UserRole.ADMIN), paymentController.getAllPaymentAccount);

//  /payments/admin route is getting all payment for admin dashboard
router.get('/admin', auth(UserRole.ADMIN), paymentController.getAllPayments);

//    /payment/admin/stats  route for get payment statistics 
router.get('/admin/stats', auth(UserRole.ADMIN), paymentController.getPaymentStats);

//    /payment/admin/id  route for get payment details by payment id 
router.get('/admin/:id', auth(UserRole.ADMIN), paymentController.getPaymentAccountDetailsById);

//  /payments/admin/verify/:id route is verifing booked transaction for admin
router.patch('/admin/verify/:id', auth(UserRole.ADMIN), paymentController.verifyPaymentTransaction);

// /payments/admin/account route is creating payment account for admin admin dashboard
router.post('/admin/account', auth(UserRole.ADMIN), paymentController.createPaymentAccount)

// /payments/admin/account/:id route is updating payment account for admin admin dashboard
router.put('/admin/account/:id', auth(UserRole.ADMIN), paymentController.updatePaymentAccount)

export const paymentRouter: Router = router;
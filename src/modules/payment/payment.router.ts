import { Router } from "express";
import paymentController from "./payment.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  /me route for getting user profile
router.get('/account-details', paymentController.getAccountDetails)

router.post('/account-details', auth(UserRole.ADMIN), paymentController.createPaymentAccountDetails)

router.post('/', auth(UserRole.STUDENT), paymentController.submitPayment)

export const paymentRouter: Router = router;
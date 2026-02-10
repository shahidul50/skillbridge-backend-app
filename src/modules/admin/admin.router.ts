import { Router } from "express";
import adminController from "./admin.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  /account-details route for getting all platform payment account
router.get("/account-details", auth(UserRole.ADMIN), adminController.getAllPaymentAccount);

//  /account-details route for getting all platform user
router.get("/users", auth(UserRole.ADMIN), adminController.getAllPlatformUser);

//   /users/toggle-status/:id route for banned or activated user status
router.patch("/users/toggle-status/:id", auth(UserRole.ADMIN), adminController.bannedUserAccount)


const adminRouter: Router = router
export default adminRouter;
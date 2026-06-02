import { Router } from "express";
import adminController from "./admin.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//    /dashboard-stats  route for get dashboard statistics 
router.get('/dashboard-stats', auth(UserRole.ADMIN), adminController.getDashboardStats);

//  /users route for getting all platform user
router.get("/users", auth(UserRole.ADMIN), adminController.getAllPlatformUser);

//  /users/:userId route for getting user profile details by userId
router.get("/users/:userId", auth(UserRole.ADMIN), adminController.getUserProfileDetailsByUserId);

//   /users/toggle-status/:id route for banned or activated user status
router.patch("/users/toggle-status/:id", auth(UserRole.ADMIN), adminController.bannedUserAccount)


const adminRouter: Router = router
export default adminRouter;
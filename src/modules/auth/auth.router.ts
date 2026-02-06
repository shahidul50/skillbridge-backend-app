import { Router } from "express";
import auth, { UserRole } from "../../middleware/authMiddleware";
import { authController } from "./auth.controller";
import uploadHandler from "../../middleware/uploadHandler";

const router = Router();

//  /me route for getting user profile
router.get("/me", auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), authController.getUserProfile)
//  /me route for updating user profile
router.put("/me", auth(UserRole.STUDENT, UserRole.ADMIN), uploadHandler.single('avatar'), authController.updateUserProfile)

const authRouter = router;
export default authRouter;
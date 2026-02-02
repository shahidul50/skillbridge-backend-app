import { Router } from "express";
import categoryController from "./category.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";

const router = Router();

//  / route for getting categories
router.get('/', categoryController.getAllCategories)

//  / route for creating category
router.post('/', auth(UserRole.ADMIN), categoryController.createCategory)


export const categoryRouter: Router = router;
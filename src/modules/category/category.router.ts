import { Router } from "express";
import categoryController from "./category.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";
import uploadHandler from "../../middleware/uploadHandler";

const router = Router();

//  / route for getting categories
router.get('/', categoryController.getAllCategories)

//  / route for creating category
router.post('/', auth(UserRole.ADMIN), uploadHandler.single('image'), categoryController.createCategory)

// /:id route for updating category
router.patch('/:id', auth(UserRole.ADMIN), uploadHandler.single('image'), categoryController.updateCategory)

// /:id route for deleting category
router.delete('/:id', auth(UserRole.ADMIN), categoryController.deleteCategory)


export const categoryRouter: Router = router;
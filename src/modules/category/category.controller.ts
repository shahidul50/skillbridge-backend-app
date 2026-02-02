import { NextFunction, Request, Response } from "express";
import categoryService from "./category.service";

//get all categories
const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await categoryService.getAllCategories();
        res.status(200).json({
            success: true,
            message: 'Categories fetched successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}
//create new category
const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await categoryService.createCategory();
        res.status(200).json({
            success: true,
            message: 'Category created successfully',
            data: result
        });
    } catch (err: any) {
        next(err);
    }
}

const categoryController = {
    getAllCategories,
    createCategory
}

export default categoryController;
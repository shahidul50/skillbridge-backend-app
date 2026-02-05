import { NextFunction, Request, Response } from "express";
import categoryService from "./category.service";
import { AppError } from "../../utils/AppError";
import { categoryQuerySchema, createCategorySchema } from "../../validation/category.validation";
import cloudinary from "../../lib/cloudinary";
import fs from "fs/promises";

//get all categories
const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {

        // validate query parameters
        const validatedQuery = categoryQuerySchema.parse({
            query: req.query
        });

        const { page, limit, sortBy, sortOrder, searchTerm } = validatedQuery.query;
        const skip = (page - 1) * limit;



        const result = await categoryService.getAllCategories({ page, limit, skip, sortBy, sortOrder, searchTerm, });
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
    let localFilePath: string | undefined = req.file?.path;
    try {

        // Validate that an image file is provided
        if (!localFilePath) {
            throw new AppError("Category image is required", 400, "IMAGE_MISSING");
        }

        // Zod validation for name fields
        const validation = createCategorySchema.safeParse(req.body);
        if (!validation.success) {
            throw validation.error;
        }

        const { name: categoryName } = validation.data;

        const isExistingCategory = await categoryService.isExistingCategory(categoryName);

        //check if category name already exists
        if (isExistingCategory) {
            throw new AppError("Category name already exists", 400, "DUPLICATE_ERROR");
        }

        // Cloudinary upload
        const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
            folder: "skillbridge/categories",
        });

        const categoryImageUrl: string = cloudinaryResult?.secure_url;
        const result = await categoryService.createCategory({ name: categoryName, image: categoryImageUrl });

        if (result) {
            if (localFilePath) {
                await fs.unlink(localFilePath);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Category created successfully',
            data: result
        });
    } catch (err: any) {
        if (localFilePath) {
            await fs.unlink(localFilePath);
        }
        next(err);
    }
}

const categoryController = {
    getAllCategories,
    createCategory
}

export default categoryController;
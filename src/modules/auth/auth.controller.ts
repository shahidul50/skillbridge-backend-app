import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import { AppError } from "../../utils/AppError";
import { updateUserProfileSchema } from "../../validation/user-profile.validation";
import cloudinary from "../../lib/cloudinary";
import fs from "fs/promises";

const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUser: string = req.user?.id as string; // Assuming auth middleware attaches user info to req.user
        const result = await authService.getUserProfile(loggedInUser);
        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            data: result
        });

    } catch (err: any) {
        next(err);
    }
}

const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    let localFilePath: string | undefined = req.file?.path;
    try {
        const loggedInUser: string = req.user?.id as string;

        if (!loggedInUser) {
            throw new AppError("You are not authorized", 401, "UNAUTHORIZED");
        }

        const validation = updateUserProfileSchema.safeParse({ body: req.body });
        if (!validation.success) {
            throw validation.error;
        }

        const updateData: any = { ...validation.data.body };

        // If there's a new avatar image, upload it to Cloudinary
        if (localFilePath) {
            // get old user data 
            const user = await authService.getUserProfile(loggedInUser);

            // upload new image to cloudinary
            const cloudinaryResult = await cloudinary.uploader.upload(localFilePath, {
                folder: "skillbridge/profiles",
            });

            // set the new image URL in updateData
            updateData.image = cloudinaryResult.secure_url;

            // if user has old image, delete it from cloudinary
            if (user?.image) {
                const publicId = user.image.split('/').pop()?.split('.')[0]; // Get public ID from URL
                if (publicId) {
                    await cloudinary.uploader.destroy(`skillbridge/profiles/${publicId}`);
                }
            }
        }

        const result = await authService.updateUserProfile(loggedInUser, updateData);

        if (result) {
            if (localFilePath) {
                await fs.unlink(localFilePath);
            }
        }
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: result
        });

    } catch (err: any) {
        if (localFilePath) {
            await fs.unlink(localFilePath);
        }
        next(err);
    }
}

export const authController = {
    getUserProfile,
    updateUserProfile
};
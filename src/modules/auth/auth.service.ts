import { prisma } from "../../lib/prisma";
import { format } from "date-fns";
import { Role, TUpdateUserProfileByIdBodyData, TUpdateUserProfileByIdResponse, TGETUserProfileByIdResponse } from "../../types/auth.type";

//get user profile by userId for student dashboard
const getUserProfileById = async (loggedUserId: string): Promise<TGETUserProfileByIdResponse> => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: loggedUserId
        },
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role.STUDENT,
        image: user.image,
        phoneNumber: user.phoneNumber || "N/A",
        updatedAt: format(new Date(user.updatedAt),"MMM d, yyyy 'at' hh:mm aa"),
    };
}

//update user profile by userId for student dashboard
const updateUserProfileById = async (loggedUserId: string, updateData: TUpdateUserProfileByIdBodyData): Promise<TUpdateUserProfileByIdResponse> => {
    console.log("updated data:", updateData)
    const updatedUser = await prisma.user.update({
        where: {
            id: loggedUserId
        },
        data: updateData,
    });

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role as Role.STUDENT,
        image: updatedUser.image,
        phoneNumber: updatedUser.phoneNumber || "N/A",
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
    };
}

export const authService = {
    getUserProfileById,
    updateUserProfileById
};
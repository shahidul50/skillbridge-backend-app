import { prisma } from "../../lib/prisma";

const getUserProfile = async (loggedUserId: string) => {
    return await prisma.user.findUniqueOrThrow({
        where: {
            id: loggedUserId
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            phoneNumber: true,
        },

    });
}

const updateUserProfile = async (loggedUserId: string, updateData: { name: string, image?: string, phoneNumber?: string }) => {
    return await prisma.user.update({
        where: {
            id: loggedUserId
        },
        data: updateData,
    });
}

export const authService = {
    getUserProfile,
    updateUserProfile
};
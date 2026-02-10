import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma"
import { UserRole } from "../../middleware/authMiddleware";


//get all platform account
const getAllPaymentAccount = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, method, isActive } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // search and filter logic array
    const andConditions: Prisma.PlatformPaymentAccountWhereInput[] = [];

    // Searching (Partial match on Account Number)
    if (searchTerm) {
        andConditions.push({
            accountNumber: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        });
    }

    // Exact Filter: Method
    if (method) {
        andConditions.push({ method: method as any });
    }

    // Exact Filter: isActive
    if (isActive) {
        andConditions.push({ isActive: isActive === "true" });
    }

    const whereConditions: Prisma.PlatformPaymentAccountWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const [result, total] = await Promise.all([
        prisma.platformPaymentAccount.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.platformPaymentAccount.count({ where: whereConditions }),
    ]);

    return {
        data: result,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPage: Math.ceil(total / limitNumber),
        },
    };
}

//get all platform user
const getAllPlatformUser = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, role, isActive } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // This line is for search and Filtering conditions
    const andConditions: Prisma.UserWhereInput[] = [];

    // Searching (Name or Email)
    if (searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
        });
    }

    // Role filtering
    if (role && Object.values(UserRole).includes(role)) {
        andConditions.push({ role: role as UserRole, });
    }

    // isActive filtering
    if (isActive) {
        andConditions.push({
            isActive: isActive,
        });
    }

    //remove admin data 
    andConditions.push({
        role: {
            not: "ADMIN"
        }
    });

    const whereConditions: Prisma.UserWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const [result, total] = await Promise.all([
        prisma.user.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                image: true,
                createdAt: true,
            }
        }),
        prisma.user.count({ where: whereConditions }),
    ]);

    return {
        data: result,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPage: Math.ceil(total / limitNumber),
        },
    };
}

//banned user when he/she break platform rules
const bannedUserAccount = async () => {
    console.log("Create Review Function from review.service.ts")
}

//Get all payment details 
const getAllPaymentDetails = async () => {
    console.log("Create Review Function from review.service.ts")
}

//Update payment status as ‘SUCCESS’ or ‘FAILED’ when payment is submitted.
const verifyPaymentTransaction = async () => {
    console.log("Create Review Function from review.service.ts")
}

//Get total users, tutors and booking statistics.
const getStats = async () => {

}

//Get all booking
const getAllBooking = async () => {

}

//update booking status as 'CONFIRMED'
const updateBookingStatus = async () => {

}







const adminService = {
    getAllPaymentAccount,
    getAllPlatformUser,
    bannedUserAccount,
    getAllPaymentDetails,
    verifyPaymentTransaction,
    getStats,
    getAllBooking,
    updateBookingStatus
}


export default adminService;
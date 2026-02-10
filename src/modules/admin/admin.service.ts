import { PaymentMethod, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma"
import { UserRole } from "../../middleware/authMiddleware";
import { AppError } from "../../utils/AppError";


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
        andConditions.push({ isActive: isActive === "true" });
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
const bannedUserAccount = async (adminId: string, targetUserId: string, status: boolean) => {
    // check is admin banned his own account
    if (adminId === targetUserId) {
        throw new AppError("You cannot ban your own account!", 400, "SELF_BAN_ERROR");
    }

    // check user is exist or not
    const user = await prisma.user.findUnique({
        where: { id: targetUserId }
    });

    if (!user) {
        throw new AppError("User not found", 404, "NOT_FOUND");
    }

    return await prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: status },
        select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            role: true
        }
    });
}

//Get all payment
const getAllPayments = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, paymentMethod, status } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.PaymentWhereInput[] = [];

    // Dynamic Search (Transaction ID or User Email)
    if (searchTerm) {
        andConditions.push({
            OR: [
                {
                    transactionId: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    user: {
                        email: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        });
    }

    // Payment method filtering
    if (paymentMethod) {
        andConditions.push({ paymentMethod: paymentMethod as PaymentMethod });
    }

    // Payment status filtering
    if (status) {
        andConditions.push({ status });
    }

    const whereConditions: Prisma.PaymentWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const [result, total] = await Promise.all([
        prisma.payment.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        }),
        prisma.payment.count({ where: whereConditions }),
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

//Update payment status as ‘SUCCESS’ or ‘FAILED’ when payment is submitted.
const verifyPaymentTransaction = async (paymentId: string, status: "SUCCESS" | "FAILED") => {
    // check payment exist or not
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true }
    });

    if (!payment) {
        throw new AppError("Payment record not found", 404);
    }

    //check payment already processed or not
    if (payment.status !== "PENDING") {
        throw new AppError("This payment has already been processed", 400);
    }

    return await prisma.$transaction(async (tx) => {
        // payment status update
        const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: status,
                verifiedAt: new Date()
            }
        });

        // if payment status is 'SUCCESS' then update booking status is 'CONFIRMED'
        if (status === "SUCCESS") {
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "CONFIRMED" }
            });
        }

        //if payment status is 'FAILED' then update booking status is 'PENDING'
        else if (status === "FAILED") {
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "PENDING" }
            });
        }

        return updatedPayment;
    });
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
    getAllPayments,
    verifyPaymentTransaction,
    getStats,
    getAllBooking,
    updateBookingStatus
}


export default adminService;
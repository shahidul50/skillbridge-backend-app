import { format, parse } from "date-fns";
import { PaymentMethod, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma"
import { UserRole } from "../../middleware/authMiddleware";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/emailSender";


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
        include: {
            booking: {
                include: {
                    user: true,
                    availabilitySlot: {
                        include: {
                            tutorProfile: { include: { user: true } }
                        }
                    }
                }
            },
            user: true
        }
    });

    if (!payment) {
        throw new AppError("Payment record not found", 404);
    }

    //check payment already processed or not
    if (payment.status !== "PENDING") {
        throw new AppError("This payment has already been processed", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
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
        } else {
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "CANCELLED" }
            });

            await tx.availabilitySlot.update({
                where: { id: payment.booking.availabilitySlotId },
                data: { isBooked: false }
            });
        }

        return updatedPayment;
    });


    // sending email tutor and student for confirmation
    if (status === "SUCCESS") {
        //student template
        const studentHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                    <h2>Payment Confirmed!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hi <strong>${payment.user.name}</strong>,</p>
                    <p>Your payment for <strong>#${payment.transactionId}</strong> has been verified. Your session is now officially booked.</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
                        <p><strong>Amount:</strong> ${payment.amount} BDT</p>
                        <p><strong>Tutor:</strong> ${payment.booking.availabilitySlot.tutorProfile.user.name}</p>
                    </div>
                </div>
            </div>`;

        // tutor template
        const tutorHtml = `
            <div style="font-family: sans-serif; padding: 20px; border-left: 5px solid #4CAF50;">
                <h2>New Class Confirmed!</h2>
                <p>Hello ${payment.booking.availabilitySlot.tutorProfile.user.name},</p>
                <p>Payment for student <strong>${payment.user.name}</strong> has been verified. Check your schedule.</p>
            </div>`;


        sendEmail({ to: payment.user.email, subject: "Payment Success", html: studentHtml }).catch(e => console.error("Email Error:", e));
        sendEmail({ to: payment.booking.availabilitySlot.tutorProfile.user.email, subject: "New Booking", html: tutorHtml }).catch(e => console.error("Email Error:", e));
    } else {
        const failedHtml = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f44336;">
                <h2 style="color: #f44336;">Payment Verification Failed</h2>
                <p>Hi ${payment.user.name}, the transaction ID <strong>${payment.transactionId}</strong> you provided could not be verified.</p>
                <p>Please try again or contact support.</p>
            </div>`;
        sendEmail({ to: payment.user.email, subject: "Payment Failed", html: failedHtml }).catch(e => console.error("Email Error:", e));
    }

    return result;
}

//Get total users, tutors, booking, pendingBooking etc.
const getStats = async () => {
    const [
        totalStudents,
        totalTutors,
        totalBookings,
        totalPendingBookings,
        totalCategories,
        totalRevenue,
        recentPayments
    ] = await Promise.all([

        // total student count
        prisma.user.count({ where: { role: 'STUDENT' } }),

        // total tutor count
        prisma.tutorProfile.count(),

        // total booking count without cancelled booking
        prisma.booking.count({ where: { status: { not: 'CANCELLED' } } }),

        // total pending booking
        prisma.booking.count({ where: { status: 'PENDING' } }),

        // total categories 
        prisma.category.count(),

        //total Revenue(summation of all success payment)
        prisma.payment.aggregate({
            where: { status: 'SUCCESS' },
            _sum: { amount: true }
        }),

        // Recent 5 payments for activity tracking
        prisma.payment.findMany({
            take: 5,
            orderBy: { submittedAt: 'desc' },
            include: { user: { select: { name: true } } }
        })
    ]);

    return {
        overview: {
            totalStudents,
            totalTutors,
            totalBookings,
            totalPendingBookings,
            totalCategories,
            totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentActivity: recentPayments.map(p => ({
            id: p.id,
            userName: p.user.name,
            amount: p.amount,
            status: p.status,
            time: format(new Date(p.submittedAt), "dd MMM yyyy, hh:mm a")
        }))
    };
}

//Get all booking
const getAllBooking = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, bookingStatus, paymentStatus } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.BookingWhereInput[] = [];

    // remove those booking which status is 'CANCELLED'
    andConditions.push({
        status: {
            not: 'CANCELLED'
        }
    });

    // search logic: student name or tutor name
    if (searchTerm) {
        andConditions.push({
            OR: [
                {
                    user: {
                        name: { contains: searchTerm, mode: 'insensitive' }
                    }
                },
                {
                    tutorProfile: {
                        user: { name: { contains: searchTerm, mode: 'insensitive' } }
                    }
                }
            ]
        });
    }

    // filtering logic
    if (bookingStatus) andConditions.push({ status: bookingStatus });
    if (paymentStatus) andConditions.push({ payment: { status: paymentStatus } });

    const whereConditions: Prisma.BookingWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const [result, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                status: true,
                price: true,
                user: {
                    select: { name: true }
                },
                tutorProfile: {
                    select: {
                        user: { select: { name: true } }
                    }
                },
                payment: {
                    select: { status: true, amount: true }
                },
                availabilitySlot: {
                    select: {
                        date: true,
                        startTime: true,
                        endTime: true
                    }
                }
            }
        }),
        prisma.booking.count({ where: whereConditions }),
    ]);


    const formattedData = result.map(booking => ({
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        tutorName: booking.tutorProfile?.user?.name || "N/A",
        slotDate: format(booking.availabilitySlot?.date, 'dd-MM-yyyy'),
        slotStartTime: format(parse(booking.availabilitySlot?.startTime, "HH:mm", new Date()), "hh:mm a"),
        slotEndTime: format(parse(booking.availabilitySlot?.endTime, "HH:mm", new Date()), "hh:mm a"),
        price: booking.price || 0,
        bookingStatus: booking.status,
        paymentStatus: booking.payment?.status || "PENDING"
    }));

    return {
        data: formattedData,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPage: Math.ceil(total / limitNumber)
        },
    };
}

//get payment details 
const getAllPlatformPaymentAccount = async () => {
    return await prisma.platformPaymentAccount.findMany();
}


const adminService = {
    getAllPaymentAccount,
    getAllPlatformUser,
    bannedUserAccount,
    getAllPayments,
    verifyPaymentTransaction,
    getStats,
    getAllBooking,
    getAllPlatformPaymentAccount
}


export default adminService;
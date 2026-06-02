import { format, startOfMonth, subMonths } from "date-fns";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/emailSender";

//get payment account details 
const getAccountDetails = async () => {

    return await prisma.platformPaymentAccount.findFirst({
        where: { isActive: true },
        select: {
            method: true,
            accountNumber: true,
            accountType: true
        }
    });
}

//get all platform account for admin dashboard
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

// create payment account details for admin dashboard
const createPaymentAccount = async (payload: any) => {
    const { method, accountNumber, accountType } = payload;

    // check account exist or not by this method and accountNumber
    const existingAccount = await prisma.platformPaymentAccount.findFirst({
        where: {
            method,
            accountNumber,
        }
    });

    if (existingAccount) {
        throw new AppError("This payment account already exists", 400, "DUPLICATE_ACCOUNT");
    }

    //new account create
    return await prisma.platformPaymentAccount.create({
        data: {
            method,
            accountNumber,
            accountType
        }
    });
}

//update payment account details 
const updatePaymentAccount = async (id: string, payload: any) => {
    const { method, accountNumber, accountType, isActive } = payload;

    // check account exist or not by this id
    const existingAccount = await prisma.platformPaymentAccount.findUnique({
        where: { id }
    });

    if (!existingAccount) {
        throw new AppError("Payment account not found", 404, "NOT_FOUND");
    }

    //update account
    return await prisma.platformPaymentAccount.update({
        where: { id },
        data: {
            method,
            accountNumber,
            accountType,
            isActive
        }
    });
}

//Get all payment for admin dashboard
const getAllPayments = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, status } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.PaymentWhereInput[] = [];

    // Dynamic Search (Transaction ID, Student Name, Tutor Name, or Category Name)
    if (searchTerm) {
        andConditions.push({
            OR: [
                { transactionId: { contains: searchTerm, mode: 'insensitive' } },
                { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                {
                    booking: {
                        tutorProfile: {
                            user: { name: { contains: searchTerm, mode: 'insensitive' } }
                        }
                    }
                },
                {
                    booking: {
                        tutorProfile: {
                            tutorCategories: {
                                some: {
                                    category: {
                                        name: { contains: searchTerm, mode: 'insensitive' }
                                    }
                                }
                            }
                        }
                    }
                }
            ],
        });
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
                user: { select: { name: true } },
                booking: {
                    include: {
                        tutorProfile: {
                            include: {
                                user: { select: { name: true } },
                                tutorCategories: { include: { category: { select: { name: true } } } }
                            }
                        }
                    }
                }
            }
        }),
        prisma.payment.count({ where: whereConditions }),
    ]);

    const formattedData = result.map(payment => ({
        paymentId: payment.id,
        transactionId: payment.transactionId,
        studentName: payment.user?.name || "N/A",
        tutorName: payment.booking?.tutorProfile?.user?.name || "N/A",
        tutorCategoryName: payment.booking?.tutorProfile?.tutorCategories.map(tc => tc.category.name) || [],
        paymentSummitedDate: format(payment.submittedAt, "MMM dd, yyyy"),
        amount: payment.amount,
        status: payment.status
    }));

    return {
        data: formattedData,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPage: Math.ceil(total / limitNumber),
        },
    };
}

//Get payment statistics 
const getPaymentStats = async () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));

    const [
        totalEarningAggregate,
        totalPendingPayments,
        totalSuccessfulPayments,
        totalFailedPayments,
        currentMonthStats,
        previousMonthStats
    ] = await Promise.all([
        // Total Successful Earning (All time)
        prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: 'SUCCESS' }
        }),
        // Total Counts (All time)
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'SUCCESS' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),

        // Current Month Stats
        Promise.all([
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCESS', submittedAt: { gte: currentMonthStart } }
            }),
            prisma.payment.count({ where: { status: 'PENDING', submittedAt: { gte: currentMonthStart } } }),
            prisma.payment.count({ where: { status: 'SUCCESS', submittedAt: { gte: currentMonthStart } } }),
            prisma.payment.count({ where: { status: 'FAILED', submittedAt: { gte: currentMonthStart } } })
        ]),

        // Previous Month Stats
        Promise.all([
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCESS', submittedAt: { gte: previousMonthStart, lt: currentMonthStart } }
            }),
            prisma.payment.count({ where: { status: 'PENDING', submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
            prisma.payment.count({ where: { status: 'SUCCESS', submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
            prisma.payment.count({ where: { status: 'FAILED', submittedAt: { gte: previousMonthStart, lt: currentMonthStart } } })
        ])
    ]);

    const totalEarning = totalEarningAggregate._sum.amount || 0;

    const currentEarnings = currentMonthStats[0]._sum.amount || 0;
    const currentPending = currentMonthStats[1];
    const currentSuccess = currentMonthStats[2];
    const currentFailed = currentMonthStats[3];

    const previousEarnings = previousMonthStats[0]._sum.amount || 0;
    const previousPending = previousMonthStats[1];
    const previousSuccess = previousMonthStats[2];
    const previousFailed = previousMonthStats[3];

    // Growth Metric Helper
    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        totalEarning,
        earningGrowthMetric: parseFloat(calculateGrowth(currentEarnings, previousEarnings).toFixed(2)),
        totalPendingPayments,
        pendingPaymentGrowthMetric: parseFloat(calculateGrowth(currentPending, previousPending).toFixed(2)),
        totalSuccessfulPayments,
        successfulPaymentGrowthMetric: parseFloat(calculateGrowth(currentSuccess, previousSuccess).toFixed(2)),
        totalFailedPayments,
        failedPaymentGrowthMetric: parseFloat(calculateGrowth(currentFailed, previousFailed).toFixed(2))
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

// get payment account details by id
const getPaymentAccountDetailsById = async (id: string) => {
    const paymentAccount = await prisma.platformPaymentAccount.findUnique({
        where: { id },
    });

    if (!paymentAccount) {
        throw new AppError("Payment account not found", 404);
    }

    return paymentAccount;
}

const paymentService = {
    getAccountDetails,
    getAllPaymentAccount,
    createPaymentAccount,
    updatePaymentAccount,
    getAllPayments,
    getPaymentStats,
    verifyPaymentTransaction,
    getPaymentAccountDetailsById
}


export default paymentService;
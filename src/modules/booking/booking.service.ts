import { differenceInMinutes, format, parse, startOfMonth, subMonths } from "date-fns";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Prisma } from "../../../generated/prisma/client";



//Get all booking by author Id.
const getAllBookingByAuthor = async (studentId: string, query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, status } = query;

    // pagination logic
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // filter and searching condition
    const andConditions: Prisma.BookingWhereInput[] = [{ studentId }];

    // If there is a search term, it will check against the tutor’s name.
    if (searchTerm) {
        andConditions.push({
            tutorProfile: {
                user: {
                    name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
            },
        });
    }

    // filtering status if there is a status
    if (status) {
        andConditions.push({ status });
    }

    const whereConditions: Prisma.BookingWhereInput = { AND: andConditions };

    const [result, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            include: {
                availabilitySlot: true,
                tutorProfile: {
                    include: {
                        user: { select: { name: true, email: true, image: true } }
                    }
                },
                payment: true
            }
        }),
        prisma.booking.count({ where: whereConditions })
    ]);

    return {
        data: result,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        }
    };
}

//Get all booking
const getAllBooking = async (query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, bookingStatus } = query;

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

    // Comprehensive search logic: student name/email, tutor name/email, or category name
    if (searchTerm) {
        andConditions.push({
            OR: [
                { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
                { tutorProfile: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
                { tutorProfile: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
                {
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
            ]
        });
    }

    // filtering logic
    if (bookingStatus) andConditions.push({ status: bookingStatus });

    const whereConditions: Prisma.BookingWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const [result, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: { select: { name: true, email: true } },
                tutorProfile: {
                    include: {
                        user: { select: { name: true, email: true } },
                        tutorCategories: { include: { category: { select: { name: true } } } }
                    }
                },
                availabilitySlot: { select: { date: true, startTime: true, endTime: true } }
            }
        }),
        prisma.booking.count({ where: whereConditions }),
    ]);


    const formattedData = result.map(booking => ({
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        studentEmail: booking.user?.email || "N/A",
        tutorName: booking.tutorProfile?.user?.name || "N/A",
        tutorEmail: booking.tutorProfile?.user?.email || "N/A",
        tutorCategoryName: booking.tutorProfile?.tutorCategories.map(tc => tc.category.name) || [],
        availabilitySlotDate: format(booking.availabilitySlot?.date, 'MMM dd, yyyy'),
        availabilitySlotStartTime: format(parse(booking.availabilitySlot?.startTime, "HH:mm", new Date()), "hh:mm a"),
        availabilitySlotEndTime: format(parse(booking.availabilitySlot?.endTime, "HH:mm", new Date()), "hh:mm a"),
        amount: booking.price || 0,
        bookingStatus: booking.status
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

//Get booking statistics 
const getBookingStats = async () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));

    const [
        totalBookings,
        pendingBooking,
        totalCompletedSession,
        totalCancelled,
        uncompletedBooking,
        currentMonthBookings,
        previousMonthBookings
    ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { createdAt: { gte: currentMonthStart } } }),
        prisma.booking.count({
            where: {
                createdAt: {
                    gte: previousMonthStart,
                    lt: currentMonthStart
                }
            }
        })
    ]);

    // Calculate bookingGrowthMetric: (((currentMonthBooking - Previous Month Bookings) / Previous Month Bookings) * 100)
    let bookingGrowthMetric = 0;
    if (previousMonthBookings === 0) {
        bookingGrowthMetric = currentMonthBookings > 0 ? 100 : 0;
    } else {
        bookingGrowthMetric = ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100;
    }

    // Calculate sessionSuccessRate: (((totalCompletedBookingSession / totalBooking(completed+cancelled all)) * 100)
    const completedPlusCancelled = totalCompletedSession + totalCancelled;
    const sessionSuccessRate = completedPlusCancelled === 0 ? 0 : (totalCompletedSession / completedPlusCancelled) * 100;

    return {
        totalBookings,
        bookingGrowthMetric: parseFloat(bookingGrowthMetric.toFixed(2)),
        pendingBooking,
        totalCompletedSession,
        sessionSuccessRate: parseFloat(sessionSuccessRate.toFixed(2)),
        uncompletedBooking
    };
}

//Get booking receipt by ID
const getBookingReceipt = async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            user: { select: { name: true, email: true } },
            tutorProfile: {
                include: {
                    user: { select: { name: true, email: true } },
                    tutorCategories: { include: { category: { select: { name: true } } } }
                }
            },
            availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
            payment: { select: { amount: true, paymentMethod: true, transactionId: true } }
        }
    });

    if (!booking) {
        throw new AppError("Booking record not found", 404);
    }

    return {
        invoiceId: `INV-${booking.id.slice(-5).toUpperCase()}`,
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        studentEmail: booking.user?.email || "N/A",
        tutorName: booking.tutorProfile?.user?.name || "N/A",
        tutorEmail: booking.tutorProfile?.user?.email || "N/A",
        tutorCategoryName: booking.tutorProfile?.tutorCategories.map(tc => tc.category.name).join(", ") || "N/A",
        bookingStatus: booking.status,
        availabilitySlotDate: format(booking.availabilitySlot?.date, "MMM dd, yyyy"),
        availabilitySlotStartTime: format(parse(booking.availabilitySlot?.startTime, "HH:mm", new Date()), "hh:mm a"),
        availabilitySlotEndTime: format(parse(booking.availabilitySlot?.endTime, "HH:mm", new Date()), "hh:mm a"),
        paidAmount: booking.payment?.amount || 0,
        paymentMethod: booking.payment?.paymentMethod || "N/A",
        transactionId: booking.payment?.transactionId || "N/A"
    };
}

//Create new booking with payment (atomic transaction)
const createBookingWithPayment = async (studentId: string, payload: any) => {
    const { tutorProfileId, date, startTime, endTime, paymentMethod, transactionId } = payload;
    const bookingDate = new Date(date);
    const dayOfWeek = format(bookingDate, "EEEE");

    // find tutor info, weekly schedule and exception
    const tutorData = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
        include: {
            tutorWeeklyAvailabilities: {
                where: { dayOfWeek, isActive: true }
            },
            tutorAvailabilityExceptions: {
                where: { date: bookingDate }
            }
        }
    });

    if (!tutorData) {
        throw new AppError("Tutor not found", 404, "NOT_FOUND");
    }

    // Check whether this slot exists in the weekly schedule. (Crucial Security Check)
    const isValidWeeklySlot = tutorData.tutorWeeklyAvailabilities.find(
        (slot) => slot.startTime === startTime && slot.endTime === endTime
    );

    if (!isValidWeeklySlot) {
        throw new AppError("The tutor is not available at this time according to their weekly schedule.", 400, "INVALID_SLOT");
    }

    // check tutor has any exception on selected date 
    if (tutorData.tutorAvailabilityExceptions.length > 0) {
        throw new AppError("The tutor has an exception/holiday on this specific date.", 400, "TUTOR_OFF_DAY");
    }

    // Dynamic price calculation logic
    // format startTime and endTime of 'HH:mm' to minute
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());

    const totalMinutes = differenceInMinutes(end, start);

    if (totalMinutes <= 0) {
        throw new AppError("End time must be after start time", 400, "INVALID_TIME");
    }

    // Calculation (hourlyRate / 60) * total minute
    const calculatedPrice = Math.ceil((tutorData.hourlyRate * totalMinutes) / 60);

    // To make decimal numbers look neat (for example: turning 12.505 into 12.51),
    const finalPrice = parseFloat(calculatedPrice.toFixed(2));

    return await prisma.$transaction(async (tx) => {
        // Check slot isExist or not
        const existingSlot = await tx.availabilitySlot.findFirst({
            where: { tutorProfileId, date: bookingDate, startTime, endTime }
        });

        if (existingSlot?.isBooked) {
            throw new AppError("This slot is already booked", 400, "SLOT_TAKEN");
        }

        // Slot make or update (isBooked = true)
        const slot = await tx.availabilitySlot.upsert({
            where: { id: existingSlot?.id || '00000000-0000-0000-0000-000000000000' },
            create: { tutorProfileId, date: bookingDate, startTime, endTime, isBooked: true },
            update: { isBooked: true }
        });

        // create final booking
        const booking = await tx.booking.create({
            data: {
                studentId,
                tutorProfileId,
                availabilitySlotId: slot.id,
                price: finalPrice,
                status: 'PENDING'
            },
            include: {
                availabilitySlot: true,
                tutorProfile: {
                    include: {
                        user: { select: { name: true, image: true } }
                    }
                }
            }
        });

        // check transaction ID is unique or not
        const existingPayment = await tx.payment.findUnique({
            where: { transactionId }
        });

        if (existingPayment) {
            throw new AppError("This Transaction ID has already been used", 400, "DUPLICATE_TRANSACTION");
        }

        // create payment record linked to the new booking
        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                studentId,
                paymentMethod,
                transactionId,
                amount: finalPrice,
                status: 'PENDING'
            }
        });

        return { booking, payment };
    });
}


const bookingService = {
    getAllBookingByAuthor,
    getAllBooking,
    getBookingStats,
    getBookingReceipt,
    createBookingWithPayment
}


export default bookingService;
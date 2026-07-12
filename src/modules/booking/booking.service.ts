import { differenceInMinutes, format, parse, startOfMonth, subMonths } from "date-fns";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Prisma } from "../../../generated/prisma/client";
import { TAllBookingByStudentIdQueryParams, TGetAllBookingByStudentIdResponse, TGetAllBookingByStudentIdMetaResponse, TGetBookingReciptByBookingIdResponse } from "../../types";



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
            totalPages: Math.ceil(total / limitNumber)
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

// get all booking for student dashboard
const getAllBookingByStudentId = async (query: TAllBookingByStudentIdQueryParams, studentId: string): Promise<TGetAllBookingByStudentIdResponse> => {
    const { page, limit, sortBy, sortOrder, searchTerm, bookingStatus } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.BookingWhereInput[] = [{ studentId }];

    if (searchTerm) {
        let parsedDate: Date | null = null;

        // Try to parse date in MM/DD/YYYY format
        try {
            parsedDate = parse(searchTerm, "dd/MM/yyyy", new Date());
            if (Number.isNaN(parsedDate.getTime())) {
                parsedDate = null;
            }
        } catch {
            parsedDate = null;
        }

        // If MM/DD/YYYY parsing failed, try ISO format
        if (!parsedDate) {
            const isoDate = new Date(searchTerm);
            if (!Number.isNaN(isoDate.getTime())) {
                parsedDate = isoDate;
            }
        }

        const orConditions: Prisma.BookingWhereInput[] = [
            { tutorProfile: { user: { name: { contains: searchTerm, mode: 'insensitive' } } } },
            { tutorProfile: { title: { contains: searchTerm, mode: 'insensitive' } } },
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
        ];

        if (parsedDate) {
            // Set time to midnight for accurate date comparison
            const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0);
            const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59);
            
            orConditions.push({
                availabilitySlot: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            });
        }

        andConditions.push({ OR: orConditions });
    }

    if (bookingStatus) {
        andConditions.push({ status: bookingStatus });
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
                        user: { select: { name: true, image: true } },
                        tutorCategories: { include: { category: { select: { name: true } } } }
                    }
                }
            }
        }),
        prisma.booking.count({ where: whereConditions })
    ]);

    const bookings = result.map(booking => ({
        id: booking.id,
        tutorName: booking.tutorProfile?.user?.name || "N/A",
        tutorTitle: booking.tutorProfile?.title || "N/A",
        TutorImage: booking.tutorProfile?.user?.image || null,
        categories: booking.tutorProfile?.tutorCategories.map(tc => tc.category.name) || [],
        availabilitySlotDate: format(booking.availabilitySlot?.date, 'MMM dd, yyyy'),
        availabilityStartTime: format(parse(booking.availabilitySlot?.startTime, 'HH:mm', new Date()), 'hh:mm a'),
        availabilityEndTime: format(parse(booking.availabilitySlot?.endTime, 'HH:mm', new Date()), 'hh:mm a'),
        price: booking.price || 0,
        status: booking.status
    }));

    return {
        bookings,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber)
        }
    };
}

// get booking meta data for student dashboard
const getBookingsMetaDataByStudentId = async (studentId: string): Promise<TGetAllBookingByStudentIdMetaResponse> => {
    // fetch bookings for this student including availability slot
    const bookings = await prisma.booking.findMany({
        where: { studentId },
        include: { availabilitySlot: true }
    });

    // totalInvestment: sum of prices for CONFIRMED bookings
    const totalInvestment = bookings
        .filter(b => b.status !== 'CANCELLED' && b.status !== 'PENDING')
        .reduce((sum, b) => sum + (b.price || 0), 0);

    // completed bookings: to calculate learning hours and completed sessions
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED' && b.availabilitySlot);

    let totalMinutes = 0;
    for (const b of completedBookings) {
        try {
            const start = parse(b.availabilitySlot!.startTime, 'HH:mm', new Date(b.availabilitySlot!.date));
            const end = parse(b.availabilitySlot!.endTime, 'HH:mm', new Date(b.availabilitySlot!.date));
            const minutes = differenceInMinutes(end, start);
            if (!Number.isNaN(minutes) && minutes > 0) totalMinutes += minutes;
        } catch (e) {
            // ignore parse errors for individual records
        }
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const learningHours = `${hours}h ${minutes}m`;

    const completedSessions = String(completedBookings.length);

    return {
        totalInvestment,
        learningHours,
        completedSessions
    };
}

// get booking details for student dashboard
const getBookingReciptByBookingId = async (bookingId: string, studentId: string): Promise<TGetBookingReciptByBookingIdResponse> => {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, studentId },
        include: {
            tutorProfile: {
                include: {
                    user: { select: { name: true } },
                    tutorCategories: { include: { category: { select: { name: true } } } }
                }
            },
            availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
            payment: { select: { amount: true, paymentMethod: true, transactionId: true } }
        }
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    const duration = booking.availabilitySlot
        ? differenceInMinutes(
            parse(booking.availabilitySlot.endTime, 'HH:mm', new Date(booking.availabilitySlot.date)),
            parse(booking.availabilitySlot.startTime, 'HH:mm', new Date(booking.availabilitySlot.date))
        )
        : 0;

    const categories = booking.tutorProfile?.tutorCategories.map(tc => tc.category.name) || [];
    const platformServiceFee = 0;
    const total = (booking.price || 0) + platformServiceFee;

    return {
        bookingId: booking.id,
        invoiceId: `INV-${booking.id.slice(-5).toUpperCase()}`,
        tutorName: booking.tutorProfile?.user?.name || "N/A",
        categories,
        availabilitySlotDate: booking.availabilitySlot ? format(booking.availabilitySlot.date, 'MMM dd, yyyy') : "N/A",
        availabilitySlotStartTime: booking.availabilitySlot ? format(parse(booking.availabilitySlot.startTime, 'HH:mm', new Date()), 'hh:mm a') : "N/A",
        availabilityEndTime: booking.availabilitySlot ? format(parse(booking.availabilitySlot.endTime, 'HH:mm', new Date()), 'hh:mm a') : "N/A",
        duration: Math.max(duration, 0),
        status: booking.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
        price: booking.price || 0,
        platformServiceFee,
        total,
        trancationId: booking.payment?.transactionId || "N/A",
        paymentMethod: booking.payment?.paymentMethod || "N/A"
    };
}

//get platfrom success rate
const getBookingSuccessRate = async () => {
    const totalBookings = await prisma.booking.count();
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });

    const successRate = totalBookings === 0 ? 0 : (completedBookings / totalBookings) * 100;

    return {
        successRate: Number(successRate.toFixed(2))
    };
}


const bookingService = {
    getAllBookingByAuthor,
    getAllBooking,
    getBookingStats,
    getBookingReceipt,
    createBookingWithPayment,
    getAllBookingByStudentId,
    getBookingsMetaDataByStudentId,
    getBookingReciptByBookingId,
    getBookingSuccessRate
}


export default bookingService;
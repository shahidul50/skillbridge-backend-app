import { differenceInMinutes, format, parse } from "date-fns";
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

//Create new booking
const createBooking = async (studentId: string, payload: any) => {
    const { tutorProfileId, date, startTime, endTime } = payload;
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
    const calculatedPrice = (tutorData.hourlyRate / 60) * totalMinutes;

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
        return await tx.booking.create({
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
                        user: { select: { name: true } }
                    }
                }
            }
        });
    });
}

// Update booking status as ’CANCELLED’ of your own bookings.
const updateBookingStatus = async (studentId: string, bookingId: string) => {
    //find booking information by bookingId
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true }
    });

    if (!booking) {
        throw new AppError("Booking not found", 404, "NOT_FOUND");
    }

    // Ownership check (whether the booking belongs to this student)
    if (booking.studentId !== studentId) {
        throw new AppError("You are not authorized to cancel this booking", 403, "FORBIDDEN");
    }

    // check booking status already 'CANCELLED' or not 
    if (booking.status === "CANCELLED") {
        throw new AppError("This booking was canceled already.", 400, "ALREADY_CANCELLED");
    }

    //Business logic check (if the Admin has confirmed, or if the payment status is PENDING/SUCCESS, then cancellation is not allowed)
    if (booking.status === "CONFIRMED") {
        throw new AppError("Cannot cancel a confirmed booking. Please contact support.", 400, "ALREADY_CONFIRMED");
    }

    if (booking.payment && (booking.payment.status === "SUCCESS" || booking.payment.status === "PENDING")) {
        throw new AppError("Cannot cancel booking because payment is already submitted or verified.", 400, "PAYMENT_EXISTS");
    }

    // booking cancellation and slot release
    return await prisma.$transaction(async (tx) => {
        // booking status update
        const cancelledBooking = await tx.booking.update({
            where: { id: bookingId },
            data: { status: "CANCELLED" }
        });

        // Make the associated slot available (Free) again.
        await tx.availabilitySlot.update({
            where: { id: booking.availabilitySlotId },
            data: { isBooked: false }
        });

        return cancelledBooking;
    });
}

const bookingService = {
    getAllBookingByAuthor,
    createBooking,
    updateBookingStatus
}


export default bookingService;
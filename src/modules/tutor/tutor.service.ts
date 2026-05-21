import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { addDays, differenceInCalendarDays, differenceInMinutes, format, formatDistanceToNow, isAfter, isBefore, isSameDay, parse, startOfDay } from "date-fns";


type UpdatableDataInput = {
    userProfile: {
        name?: string;
        phoneNumber?: string;
        image?: string;
    }
    tutorProfile: {
        title?: string;
        bio?: string;
        hourlyRate?: number;
        experience?: string;
    }
}

//get all tutors with pagination, search and filtering.
const getAllTutors = async (query: any) => {
    const {
        page,
        limit,
        sortBy,
        sortOrder,
        searchTerm,
        categories,
        minPrice,
        maxPrice,
        minRating
    } = query;

    const whereConditions: any = { AND: [] };

    // Text Search (search title, bio and name fields)
    if (searchTerm) {
        whereConditions.AND.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { bio: { contains: searchTerm, mode: 'insensitive' } },
                {
                    user: {
                        name: { contains: searchTerm, mode: 'insensitive' }
                    }
                }
            ]
        });
    }

    // Category Filter (filter tutors by one or more categories)
    if (categories) {
        const categoryNames = categories.split(',');
        whereConditions.AND.push({
            tutorCategories: {
                some: {
                    category: {
                        name: { in: categoryNames, mode: 'insensitive' }
                    }
                }
            }
        });
    }

    // Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        whereConditions.AND.push({
            hourlyRate: {
                gte: minPrice ?? 0,
                lte: maxPrice ?? 1000000,
            }
        });
    }

    // Rating Filter
    if (minRating !== undefined) {
        whereConditions.AND.push({
            rating: {
                gte: minRating
            }
        });
    }

    const skip = (page - 1) * limit;

    // Custom Sorting Logic
    let orderBy: any = { [sortBy]: sortOrder };

    if (sortBy === 'highest-rated') {
        orderBy = { rating: 'desc' };
    } else if (sortBy === 'low-to-high') {
        orderBy = { hourlyRate: 'asc' };
    } else if (sortBy === 'high-to-low') {
        orderBy = { hourlyRate: 'desc' };
    } else if (sortBy === 'most-reviews') {
        orderBy = { totalReviews: 'desc' };
    }

    const [tutors, total] = await Promise.all([
        prisma.tutorProfile.findMany({
            where: whereConditions.AND.length > 0 ? whereConditions : {},
            include: {
                // get tutor profile along with user data (name and image)
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                // include tutor categories with category name
                tutorCategories: {
                    include: {
                        category: {
                            select: { name: true }
                        }
                    }
                }
            },
            skip,
            take: limit,
            orderBy,
        }),
        prisma.tutorProfile.count({
            where: whereConditions.AND.length > 0 ? whereConditions : {}
        }),
    ]);

    return {
        data: tutors,
        pagination: {
            total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
        }
    }
}

const getTutorById = async (loggedTutorId: string) => {
    return await prisma.user.findUniqueOrThrow({
        where: {
            id: loggedTutorId
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

// get tutor profile data by userId
const getTutorProfileByUserId = async (userId: string) => {
    return await prisma.tutorProfile.findUniqueOrThrow({
        where: {
            userId
        },
        include: {
            user: {
                select: {
                    name: true,
                    image: true,
                    phoneNumber: true,
                }
            }
        }
    });
}

//get tutor profile, review, availability by tutorProfileId
const getTutorProfileByProfileId = async (tutorProfileId: string) => {
    const result = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
        include: {
            user: {
                select: {
                    name: true,
                    image: true
                }
            },
            reviews: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true,
                        }
                    }
                }
            },
            tutorCategories: {
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    });

    if (!result) {
        throw new AppError("Tutor profile not found", 404);
    }

    // Get completed bookings to calculate class hours and unique student count
    const completedBookings = await prisma.booking.findMany({
        where: {
            tutorProfileId,
            status: "COMPLETED"
        },
        include: {
            availabilitySlot: true
        }
    });

    let totalMinutes = 0;
    const studentIds = new Set<string>();

    completedBookings.forEach((booking) => {
        if (booking.availabilitySlot) {
            const start = parse(booking.availabilitySlot.startTime, "HH:mm", new Date());
            const end = parse(booking.availabilitySlot.endTime, "HH:mm", new Date());
            totalMinutes += differenceInMinutes(end, start);
        }
        studentIds.add(booking.studentId);
    });

    const totalClassHours = parseFloat((totalMinutes / 60).toFixed(2));
    const totalUniqueStudents = studentIds.size;

    // recent 10 reviews with time calculation 
    const formattedReviews = result.reviews.map(review => ({
        ...review,
        timeAgo: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
        // Output is: "2 days ago", "about 1 month ago" 
    }));

    // Flatten category details to a simpler array
    const tutorSelectedCategory = result.tutorCategories.map(tc => tc.category);

    return {
        ...result,
        reviews: formattedReviews,
        totalClassHours,
        totalUniqueStudents,
        tutorSelectedCategory
    };
}

//update tutor profile
const updateTutorProfile = async (loggedTutorId: string, updatableData: UpdatableDataInput) => {
    return await prisma.$transaction(async (tx) => {
        let updatedTutor;
        let updateUserData: any = {};

        //User table update
        if (updatableData.userProfile.name || updatableData.userProfile.phoneNumber || updatableData.userProfile.image) {
            updateUserData = await tx.user.update({
                where: { id: loggedTutorId },
                data: updatableData.userProfile,
                select: {
                    id: true,
                    name: true,
                    image: true,
                    phoneNumber: true,
                }
            });
        }

        // Tutor profile table update
        if (updatableData.tutorProfile.title || updatableData.tutorProfile.bio || updatableData.tutorProfile.hourlyRate || updatableData.tutorProfile.experience) {
            updatedTutor = await tx.tutorProfile.update({
                where: { userId: loggedTutorId },
                data: updatableData.tutorProfile,
                select: {
                    id: true,
                    title: true,
                    bio: true,
                    hourlyRate: true,
                    experience: true,
                }
            });
        }

        return { userData: updateUserData, tutorProfile: updatedTutor };
    });
}

//get tutor profile by user Id
// const getTutorProfileByUserId = async (userId: string) => {
//     return await prisma.tutorProfile.findUnique({
//         where: { userId },
//         select: {
//             id: true,
//         }
//     });
// }

// get tutor selected categories
const getTutorSelectedCategories = async (tutorProfileId: string) => {
    return await prisma.tutorCategory.findMany({
        where: { tutorProfileId },
        select: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
}

//set tutor categories
const setTutorCategories = async (tutorProfileId: string, categoryIds: string[]) => {
    return await prisma.$transaction(async (tx) => {
        // delete existing categories for the tutor
        await tx.tutorCategory.deleteMany({
            where: { tutorProfileId }
        });

        // add new categories for the tutor
        const tutorCategoriesData = categoryIds.map((categoryId) => ({
            tutorProfileId,
            categoryId
        }));

        // insert new tutor categories
        const result = await tx.tutorCategory.createMany({
            data: tutorCategoriesData
        });

        return result;
    });

}

//Get All teaching sessions by tutor.
const getTutorAllSession = async (tutorProfileId: string, query: any) => {
    const { page, limit, sortBy, sortOrder, searchTerm, status, availabilitySlotDate } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.BookingWhereInput[] = [
        { tutorProfileId: tutorProfileId }
    ];

    if (!status) {
        andConditions.push({
            status: { not: 'CANCELLED' }
        });
    }

    // search logic (Student Name)
    if (searchTerm) {
        andConditions.push({
            user: { // student user relation
                name: { contains: searchTerm, mode: 'insensitive' }
            }
        });
    }

    // status filtering
    if (status) {
        andConditions.push({ status });
    }

    // date filtering(Availability Slot Date)
    if (availabilitySlotDate) {
        andConditions.push({
            availabilitySlot: {
                date: new Date(availabilitySlotDate)
            }
        });
    }

    const whereConditions: Prisma.BookingWhereInput = { AND: andConditions };


    const [result, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: { select: { name: true, email: true, image: true } }, // student info
                availabilitySlot: true,
                payment: { select: { status: true, amount: true } }
            }
        }),
        prisma.booking.count({ where: whereConditions }),
    ]);

    const formattedData = result.map(booking => ({
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        studentEmail: booking.user?.email,
        date: booking.availabilitySlot ? format(booking.availabilitySlot.date, 'dd-MM-yyyy') : "N/A",
        time: booking.availabilitySlot
            ? `${format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a")} - ${format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a")}`
            : "N/A",
        status: booking.status,
        paymentStatus: booking.payment?.status || "PENDING",
        amount: booking.payment?.amount || 0
    }));

    return {
        data: formattedData,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPage: Math.ceil(total / limitNumber)
        },
    };
}

//Update booking status as 'COMPLETED' when it is complete by own session.
const updateBookingStatus = async (tutorProfileId: string, bookingId: string) => {
    // find booking data with booking slot by bookingId
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { availabilitySlot: true }
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    // checking ownership for updating status
    if (booking.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to update this booking", 403);
    }

    // check booking status already 'COMPLETED' or not 
    if (booking.status === "COMPLETED") {
        throw new AppError("This session has already been marked as completed.", 400);
    }

    // check booking status is confirmed or not. we can update only confirmed booking status.
    if (booking.status !== "CONFIRMED") {
        throw new AppError(`Cannot complete a booking that is currently ${booking.status}`, 400);
    }

    // Time Comparison Logic
    const now = new Date();
    const slotDate = format(booking.availabilitySlot.date, "yyyy-MM-dd");
    const sessionEndDateTime = parse(
        `${slotDate} ${booking.availabilitySlot.endTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
    );

    // check if session was not completed, then we can't update status.
    if (!isAfter(now, sessionEndDateTime)) {
        throw new AppError("Session time has not ended yet. You cannot mark it as completed before the end time.", 400);
    }


    return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" }
    });
}

//Create weekly availability slot.
const createTutorWeeklyAvailability = async (tutorProfileId: string, payload: any) => {
    const { dayOfWeek, startTime, endTime } = payload;

    // check the time difference (it must be at least 1 hour)
    const referenceDate = new Date();
    const start = parse(startTime, "HH:mm", referenceDate);
    const end = parse(endTime, "HH:mm", referenceDate);

    const diffInMinutes = differenceInMinutes(end, start);

    if (diffInMinutes < 60) {
        throw new AppError(
            "The duration of the slot must be at least 1 hour.",
            400,
            "INVALID_DURATION"
        );
    }

    // Check for overlapping time slots for the same day
    const isOverlapping = await prisma.tutorWeeklyAvailability.findFirst({
        where: {
            tutorProfileId,
            dayOfWeek,
            OR: [
                {
                    AND: [
                        { startTime: { lte: startTime } },
                        { endTime: { gt: startTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gte: endTime } }
                    ]
                }
            ]
        }
    });

    if (isOverlapping) {
        throw new AppError("This time slot overlaps with an existing schedule", 400, "OVERLAP_ERROR");
    }

    // create a new weekly availability slot
    return await prisma.tutorWeeklyAvailability.create({
        data: {
            tutorProfileId,
            dayOfWeek,
            startTime,
            endTime,
        }
    });
}

//Get tutor's weekly available slots
const getWeeklyAvailableSlots = async (tutorProfileId: string) => {
    return await prisma.tutorWeeklyAvailability.findMany({
        where: { tutorProfileId },
        select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true,
        },
        orderBy: {
            dayOfWeek: "asc"
        }
    });
}

//update weekly availability slot.
const updateTutorWeeklyAvailability = async (tutorProfileId: string, slotId: string, payload: { isActive: boolean }) => {
    const slot = await prisma.tutorWeeklyAvailability.findUnique({
        where: { id: slotId }
    });

    if (!slot) {
        throw new AppError("Time slot not found", 404, "NOT_FOUND");
    }

    if (slot.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to update this slot", 403, "FORBIDDEN");
    }

    return await prisma.tutorWeeklyAvailability.update({
        where: { id: slotId },
        data: { isActive: payload.isActive }
    });
}

//delete weekly availability slot.
const deleteTutorWeeklyAvailability = async (tutorProfileId: string, slotId: string) => {
    // check if the slot exists 
    const slot = await prisma.tutorWeeklyAvailability.findUnique({
        where: { id: slotId }
    });

    if (!slot) {
        throw new AppError("Time slot not found", 404, "NOT_FOUND");
    }

    // check if the slot belongs to the tutor
    if (slot.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to delete this slot", 403, "FORBIDDEN");
    }

    //if all checks pass then delete the slot
    return await prisma.tutorWeeklyAvailability.delete({
        where: { id: slotId }
    });
}

//create exception on a special day.
const createTutorException = async (tutorProfileId: string, payload: any) => {
    const today = startOfDay(new Date());
    const exceptionDate = startOfDay(new Date(payload.date));

    // check created exception date is not in the past
    if (isBefore(exceptionDate, today)) {
        throw new AppError("Cannot create exception for past dates", 400, "INVALID_DATE");
    }

    // check if an exception already exists for the same date (Duplicate Check)
    const existingException = await prisma.tutorAvailabilityException.findFirst({
        where: {
            tutorProfileId,
            date: exceptionDate
        }
    });

    if (existingException) {
        throw new AppError("An exception already exists for this date", 400, "DUPLICATE_ERROR");
    }

    // check if there is any booked slot on the exception date. If there is a booked slot then do not allow tutor to create exception for that date.
    const hasBookedSlot = await prisma.availabilitySlot.findFirst({
        where: {
            tutorProfileId,
            date: exceptionDate,
            isBooked: true
        }
    });

    if (hasBookedSlot) {
        throw new AppError(
            "Cannot create exception. You already have a booked slot on this date.",
            400,
            "BOOKING_EXISTS"
        );
    }

    // if all checks pass then create exception (Off-day) for the tutor
    return await prisma.tutorAvailabilityException.create({
        data: {
            tutorProfileId,
            date: exceptionDate,
            reason: payload.reason,
        },
    });
}

//delete tutor availability exception.
const deleteTutorException = async (tutorProfileId: string, exceptionId: string) => {
    // check if the exception exists
    const exception = await prisma.tutorAvailabilityException.findUnique({
        where: { id: exceptionId }
    });

    if (!exception) {
        throw new AppError("Exception not found", 404, "NOT_FOUND");
    }

    // check if the exception belongs to the tutor
    if (exception.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to delete this exception", 403, "FORBIDDEN");
    }

    // check if today is equal to or after the exception date
    const today = startOfDay(new Date());
    const exceptionDate = startOfDay(new Date(exception.date));

    if (!isBefore(today, exceptionDate)) {
        throw new AppError("Cannot delete exception on or after the exception date", 400, "INVALID_DATE");
    }

    // if all checks pass then delete the exception
    return await prisma.tutorAvailabilityException.delete({
        where: { id: exceptionId }
    });
}

//get all exceptions for a tutor.
const getAllTutorException = async (tutorProfileId: string) => {
    return await prisma.tutorAvailabilityException.findMany({
        where: { tutorProfileId },
        orderBy: {
            date: "asc"
        }
    });
}

//get available slots for a tutor based on weekly availability, exceptions and already booked slots.
const getAvailableSlots = async (tutorProfileId: string, startDateStr?: string) => {
    const now = new Date();
    const today = startOfDay(now);
    const currentTime = format(now, "HH:mm"); // Current Time with (HH:mm) Format (egg. "19:00")

    let startFrom = startDateStr ? startOfDay(new Date(startDateStr)) : today;

    // Date Validation: Check if the date is in the past
    if (isBefore(startFrom, today)) {
        throw new AppError("Cannot fetch slots for past dates", 400, "INVALID_DATE");
    }

    const daysDifference = differenceInCalendarDays(startFrom, today);
    if (daysDifference > 4) {
        throw new AppError("You can only fetch slots within 4 days from today", 400, "DATE_OUT_OF_RANGE");
    }

    const daysToGenerate = startDateStr ? 1 : 3; // generate only 1 day if specific date is requested, otherwise next 3 days
    const availableSlots = [];


    // get tutor Weekly Availability and Exceptions in one time 
    const [weeklySchedules, exceptions, bookedSlots] = await Promise.all([
        prisma.tutorWeeklyAvailability.findMany({ where: { tutorProfileId, isActive: true } }),
        prisma.tutorAvailabilityException.findMany({ where: { tutorProfileId } }),
        prisma.availabilitySlot.findMany({
            where: { tutorProfileId, date: { gte: startFrom }, isBooked: true }
        })
    ]);

    for (let i = 0; i < daysToGenerate; i++) {
        const currentDate = addDays(startFrom, i);
        const dateString = format(currentDate, "yyyy-MM-dd");
        const dayName = format(currentDate, "EEEE");

        // Check if the day is an exception (Off-day)
        const isExceptionDay = exceptions.some(ex => format(new Date(ex.date), "yyyy-MM-dd") === dateString);
        if (isExceptionDay) continue;

        const daySchedules = weeklySchedules.filter(ws => ws.dayOfWeek === dayName);

        for (const schedule of daySchedules) {
            // Check if the slot is in the past for the current day
            if (isSameDay(currentDate, now)) {
                if (schedule.startTime <= currentTime) {
                    continue; // Remove past time slots for the current day
                }
            }

            // filter out already booked slots
            const isAlreadyBooked = bookedSlots.some(bs =>
                format(new Date(bs.date), "yyyy-MM-dd") === dateString &&
                bs.startTime === schedule.startTime &&
                bs.endTime === schedule.endTime
            );

            if (!isAlreadyBooked) {
                availableSlots.push({
                    tutorProfileId,
                    date: dateString,
                    day: dayName,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime
                });
            }
        }
    }

    return availableSlots;
}

const tutorService = {
    getAllTutors,
    getTutorProfileByProfileId,
    getTutorById,
    updateTutorProfile,
    setTutorCategories,
    getTutorAllSession,
    updateBookingStatus,
    createTutorWeeklyAvailability,
    updateTutorWeeklyAvailability,
    deleteTutorWeeklyAvailability,
    createTutorException,
    deleteTutorException,
    getAllTutorException,
    getAvailableSlots,
    getTutorProfileByUserId,
    getTutorSelectedCategories,
    getWeeklyAvailableSlots
}


export default tutorService;
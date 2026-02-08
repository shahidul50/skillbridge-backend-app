import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { addDays, differenceInCalendarDays, differenceInMinutes, format, isBefore, isSameDay, parse, startOfDay } from "date-fns";


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

    // Text Search (search title and bio fields in tutor profile)
    if (searchTerm) {
        whereConditions.AND.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { bio: { contains: searchTerm, mode: 'insensitive' } },
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
            orderBy: { [sortBy]: sortOrder },
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

//get all tutor by id with tutor profile, review, availability.
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

const getTutorProfileByUserId = async (userId: string) => {
    return await prisma.tutorProfile.findUnique({
        where: { userId },
        select: {
            id: true,
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
const getTutorAllSession = async () => {
    console.log("Get Tutor All Session Function from tutor.service.ts")
}

//Update booking status as 'COMPLETED' when it is complete by own session.
const updateBookingStatus = async () => {
    console.log("Update Booking Status Function from tutor.service.ts")
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

    const daysToGenerate = 3;
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
    getTutorById,
    updateTutorProfile,
    setTutorCategories,
    getTutorAllSession,
    updateBookingStatus,
    createTutorWeeklyAvailability,
    deleteTutorWeeklyAvailability,
    createTutorException,
    getTutorProfileByUserId,
    getAvailableSlots
}


export default tutorService;
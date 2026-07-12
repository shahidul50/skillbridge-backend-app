import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { UpdatableDataInput } from "../../types";
import { AppError } from "../../utils/AppError";
import { addDays, differenceInCalendarDays, differenceInMinutes, differenceInMonths, endOfDay, endOfMonth, format, formatDistanceToNow, isAfter, isBefore, isSameDay, parse, startOfDay, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
import { GetAllTutorQueryParams, TCreateException, TCreateWeeklyAvailability, TGetAllSessionsQueryParams, TGetAllSessionsResponse, TGetDashboardMetaResponse, TGetDashboardRevenueTrendsQueryParams, TGetDashboardRevenueTrendsResponse, TGetSessionDetailsByBookingIdResponse, TRevenueTrendPeriod, TScheduleCalendarEvent, TScheduleClassLinkHub, TScheduleEventsQueryParams, TScheduleEventsResponse, TScheduleMetaResponse, TScheduleStartingSoon, TUpdateWeeklyAvailability } from "../../types/tutor.type";


//get all tutors for public tutor page.
const getAllTutors = async (query: GetAllTutorQueryParams) => {
    const { page, limit, sortBy, sortOrder, searchTerm, categories, minPrice, maxPrice, minRating } = query;

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

    whereConditions.AND.push({
        user: {
            isActive: true
        },
        isProfileNew: false
    });

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

//get tutor profile with user data, tutor categories, reviews by tutorProfileId for public tutor page.
const getTutorProfileByProfileId = async (tutorProfileId: string) => {
    const result = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId, user: { isActive: true } },
        include: {
            user: {
                select: {
                    name: true,
                    image: true
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
        }
    });

    if (!result) {
        throw new AppError("Tutor profile not found", 404);
    }

    // Get completed bookings to calculate class hours and unique student count
    const [completedBookings, reviewCount] = await Promise.all([
        prisma.booking.findMany({
            where: {
                tutorProfileId,
                status: "COMPLETED"
            },
            include: {
                availabilitySlot: true
            }
        }),
        prisma.review.count({
            where: { tutorProfileId }
        })
    ]);

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

    // const totalClassHours = parseFloat((totalMinutes / 60).toFixed(2));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalClassHour = `${hours}h ${minutes}m`;
    const totalUniqueStudents = studentIds.size;

    // recent 10 reviews with time calculation 
    const formattedReviews = result.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        studentName: review.user.name,
        studentImage: review.user.image || null,
        timeAgo: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
        // Output is: "2 days ago", "about 1 month ago" 
    }));

    // Flatten category details to a simpler array
    const tutorSelectedCategory = result.tutorCategories.map(tc => tc.category);

    return {
        ...result,
        reviews: formattedReviews,
        totalReviews: reviewCount,
        totalClassHour,
        totalUniqueStudents,
        tutorSelectedCategory
    };
}

//get available slots for a tutor based on weekly availability, exceptions and already booked slots for public tutor page.
const getAvailableSlots = async (tutorProfileId: string, startDateStr?: string) => {
    //set Time Zone
    const options = { timeZone: "Asia/Dhaka", hour12: false };

    const todayStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

    const currentTimeStr = new Intl.DateTimeFormat("en-US", { ...options, hour: "2-digit", minute: "2-digit" }).format(new Date());

    // convert current time to minutes
    const [cHours, cMinutes] = currentTimeStr.split(":").map(Number);
    const currentMinutes = cHours! * 60 + cMinutes!;

    //get current date and time with time zone
    const now = new Date();
    const today = startOfDay(now);
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
        const dateString = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(currentDate);
        const dayName = new Intl.DateTimeFormat("en-US", { ...options, weekday: "long" }).format(currentDate);

        // Check if the day is an exception (Off-day)
        const isExceptionDay = exceptions.some(ex => {
            const exDateStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ex.date));
            return exDateStr === dateString;
        });
        if (isExceptionDay) continue;

        const daySchedules = weeklySchedules.filter(ws => ws.dayOfWeek === dayName);

        for (const schedule of daySchedules) {
            // Check if the slot is in the past for the current day
            if (dateString === todayStr) {
                const [sHours, sMinutes] = schedule.startTime.split(":").map(Number);
                const slotStartMinutes = sHours! * 60 + (sMinutes || 0);
                if (slotStartMinutes <= currentMinutes) {
                    continue; // Remove past time slots for the current day
                }
            }

            // filter out already booked slots
            const isAlreadyBooked = bookedSlots.some(bs => {
                const bsDateStr = new Intl.DateTimeFormat("en-CA", { ...options, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(bs.date));
                return bsDateStr === dateString &&
                    bs.startTime === schedule.startTime &&
                    bs.endTime === schedule.endTime;
            });

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

//get tutor details by userId for checking account exist or not
const getTutorDetailsByUserId = async (userId: string) => {
    return await prisma.user.findUniqueOrThrow({
        where: {
            id: userId
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

//----------------------*----------Profile Management------------*----------------------*

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

//update tutor profile function for tutor dashboard.
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

//----------------------*---------Category Management-------------*----------------------*

// get tutor selected categories for tutor dashboard.
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

//set tutor categories for tutor dashboard.
const setTutorCategories = async (tutorProfileId: string, categoryIds: string[]) => {
    // validation for single category
    if (categoryIds.length > 1) {
        throw new AppError("You can only add one category at a time.", 400);
    }

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

//----------------------*-----------Weekly Availability Management-----------*----------------------*

//Get tutor's weekly available slots for tutor dashboard.
const getTutorWeeklyAvailableSlots = async (tutorProfileId: string) => {
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

//Create weekly availability slot.
const createTutorWeeklyAvailability = async (tutorProfileId: string, payload: TCreateWeeklyAvailability) => {
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

//update weekly availability slot for tutor dashboard.
const updateTutorWeeklyAvailability = async (tutorProfileId: string, slotId: string, payload: TUpdateWeeklyAvailability) => {
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

//delete weekly availability slot for tutor dashboard.
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

//----------------------*-----------Exception Management-----------*----------------------*

//get all exceptions for a tutor dashboard.
const getAllTutorException = async (tutorProfileId: string) => {
    return await prisma.tutorAvailabilityException.findMany({
        where: { tutorProfileId },
        orderBy: {
            date: "asc"
        }
    });
}

//create exception on a special day for tutor dashboard.
const createTutorException = async (tutorProfileId: string, payload: TCreateException) => {
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

//delete tutor exception for tutor dashboard.
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

//----------------------*-----------Booking Management-----------*----------------------*

//Get All teaching sessions by tutor.
const getTutorAllSession = async (tutorProfileId: string, query: TGetAllSessionsQueryParams): Promise<TGetAllSessionsResponse> => {
    const { page, limit, sortBy, sortOrder, searchTerm, status } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions: Prisma.BookingWhereInput[] = [
        { tutorProfileId: tutorProfileId }
    ];

    andConditions.push({
        status: { notIn: ['CANCELLED', 'PENDING'] }
    });

    // search logic (Student Name, Category Name or Slot Date)
    if (searchTerm) {
        const orConditions: Prisma.BookingWhereInput[] = [
            {
                user: { // student user relation
                    name: { contains: searchTerm, mode: 'insensitive' }
                }
            },
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

        // Attempt to parse searchTerm as a date
        let parsedDate: Date | null = null;
        if (searchTerm.includes('/') || searchTerm.includes('-')) {
            const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})$/;
            if (dateRegex.test(searchTerm)) {
                if (searchTerm.includes('/')) {
                    parsedDate = parse(searchTerm, 'dd/MM/yyyy', new Date());
                } else {
                    parsedDate = new Date(searchTerm);
                }
            }
        }

        if (parsedDate && !isNaN(parsedDate.getTime())) {
            const start = startOfDay(parsedDate);
            const end = endOfDay(parsedDate);
            orConditions.push({
                availabilitySlot: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });
        }

        andConditions.push({ OR: orConditions });
    }

    // status filtering
    if (status) {
        andConditions.push({ status });
    }

    const whereConditions: Prisma.BookingWhereInput = { AND: andConditions };


    const [result, total] = await Promise.all([
        prisma.booking.findMany({
            where: whereConditions,
            skip,
            take: limitNumber,
            orderBy: [
                { availabilitySlot: { date: 'desc' } },
                { availabilitySlot: { startTime: 'desc' } }
            ],
            include: {
                user: { select: { name: true, image: true } }, // student info
                availabilitySlot: true,
                tutorProfile: {
                    include: {
                        tutorCategories: {
                            include: { category: { select: { name: true } } }
                        }
                    }
                }
            }
        }),
        prisma.booking.count({ where: whereConditions }),
    ]);

    const formattedData = result.map(booking => ({
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        studentImage: booking.user?.image || "",
        categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
        availabilitySlotDate: booking.availabilitySlot ? format(booking.availabilitySlot.date, 'MMMM dd, yyyy') : "N/A",
        availabilityStartTime: booking.availabilitySlot
            ? format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a")
            : "N/A",
        availabilityEndTime: booking.availabilitySlot
            ? format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a")
            : "N/A",
        status: booking.status as "CONFIRMED" | "COMPLETED",
        meetingLink: booking.meetingLink,
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

//Update booking status as 'COMPLETED' when it is complete by own session.
const updateBookingStatus = async (tutorProfileId: string, bookingId: string, meetingLink: string) => {
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

    // Update meeting link if it's null or empty
    if (!booking.meetingLink || booking.meetingLink.trim() === "") {
        return await prisma.booking.update({
            where: { id: bookingId },
            data: { meetingLink }
        });
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

//Update booking status as 'COMPLETED' and add meeting link when booking is confirmed or completed.
const updateBookingMeetingLink = async (tutorProfileId: string, bookingId: string, payload: { meetingLink?: string }) => {
    // 1. check if the booking exists 
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    // 2. check if the booking belongs to the tutor
    if (booking.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to update this booking", 403);
    }

    // 3. check booking status is "CONFIRMED" or not
    if (booking.status !== "CONFIRMED") {
        throw new AppError(`Cannot update meeting link for a booking that is currently ${booking.status}`, 400);
    }

    // 4. if all checks pass then update the meeting link
    return await prisma.booking.update({
        where: { id: bookingId },
        data: { meetingLink: payload.meetingLink as string }
    });
}

// Get session details by bookingId for tutor dashboard
const getSessionDetailsByBookingId = async (tutorProfileId: string, bookingId: string): Promise<TGetSessionDetailsByBookingIdResponse> => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            user: { select: { name: true, image: true } }, // student info
            availabilitySlot: true,
            tutorProfile: {
                include: {
                    tutorCategories: {
                        include: { category: { select: { name: true } } }
                    }
                }
            },
            review: {
                select: {
                    rating: true,
                    comment: true
                }
            }
        }
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    // Ownership check
    if (booking.tutorProfileId !== tutorProfileId) {
        throw new AppError("You are not authorized to view this booking", 403);
    }

    const { availabilitySlot } = booking;
    let duration = 0;

    if (availabilitySlot) {
        const start = parse(availabilitySlot.startTime, "HH:mm", new Date());
        const end = parse(availabilitySlot.endTime, "HH:mm", new Date());
        duration = differenceInMinutes(end, start);
    }

    return {
        bookingId: booking.id,
        studentName: booking.user?.name || "N/A",
        studentImage: booking.user?.image || "",
        categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
        availabilitySlotDate: availabilitySlot ? format(availabilitySlot.date, 'MMMM dd, yyyy') : "N/A",
        availabilityStartTime: availabilitySlot
            ? format(parse(availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a")
            : "N/A",
        availabilityEndTime: availabilitySlot
            ? format(parse(availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a")
            : "N/A",
        duration,
        status: booking.status as "CONFIRMED" | "COMPLETED",
        meetingLink: booking.meetingLink,
        review: booking.review ? {
            rating: booking.review.rating,
            comment: booking.review.comment || ""
        } : null
    };
}

//----------------------*-----------Dashboard Management-----------*----------------------*


// Helper: Fetch upcoming CONFIRMED sessions filtered by slotEndTime > now
const getUpcomingTutorSessions = async (tutorId: string, limit: number) => {
    const now = new Date();
    const todayStart = startOfDay(now);

    const result = await prisma.booking.findMany({
        where: {
            tutorProfileId: tutorId,
            status: "CONFIRMED",
            availabilitySlot: {
                date: { gte: todayStart }
            }
        },
        orderBy: [
            { availabilitySlot: { date: 'asc' } },
            { availabilitySlot: { startTime: 'asc' } }
        ],
        take: limit * 5, // fetch extra to account for in-progress slot filtering
        include: {
            user: { select: { name: true, image: true } },
            availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
            tutorProfile: {
                include: {
                    tutorCategories: {
                        include: { category: { select: { name: true } } }
                    }
                }
            }
        }
    });

    return result.filter(booking => {
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        return isAfter(endDateTime, now);
    }).slice(0, limit);
};

//Get Tutor Dashboard Stats and Upcoming Sessions
const getDashboardMeta = async (tutorProfileId: string): Promise<TGetDashboardMetaResponse> => {
    const now = new Date();

    // Create a date object that represents midnight UTC of the current local day
    // This ensures todayStart shows the correct local date even in UTC format (e.g. 2026-06-13T00:00:00.000Z)
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));

    // 1. Tutor Basic Info
    const tutor = await prisma.tutorProfile.findUniqueOrThrow({
        where: { id: tutorProfileId },
        include: { user: { select: { name: true } } }
    });

    // 2. Today's Upcoming Sessions Count (Non-cancelled bookings for today that haven't ended yet)
    const todaySessionsResult = await prisma.booking.findMany({
        where: {
            tutorProfileId,
            status: { not: "CANCELLED" },
            availabilitySlot: {
                date: todayStart
            }
        },
        include: { availabilitySlot: true }
    });

    const todayUpcomingSessionsCount = todaySessionsResult.filter(booking => {
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        return isAfter(endDateTime, now);
    }).length;

    // 3. Stats Calculations
    // Total Sessions (COMPLETED)
    const totalCompletedSessions = await prisma.booking.count({
        where: { tutorProfileId, status: "COMPLETED" }
    });

    const currentMonthCompleted = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: "COMPLETED",
            availabilitySlot: {
                date: { gte: currentMonthStart }
            }
        }
    });

    const lastMonthCompleted = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: "COMPLETED",
            availabilitySlot: {
                date: { gte: lastMonthStart, lte: lastMonthEnd }
            }
        }
    });

    const sessionGrowth = lastMonthCompleted === 0
        ? (currentMonthCompleted > 0 ? 100 : 0)
        : ((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100;

    // Total Earnings (COMPLETED)
    const totalEarningsResult = await prisma.booking.aggregate({
        where: { tutorProfileId, status: "COMPLETED" },
        _sum: { price: true }
    });
    const totalEarnings = totalEarningsResult._sum.price || 0;

    const currentMonthEarningsResult = await prisma.booking.aggregate({
        where: {
            tutorProfileId,
            status: "COMPLETED",
            availabilitySlot: {
                date: { gte: currentMonthStart }
            }
        },
        _sum: { price: true }
    });
    const currentMonthEarnings = currentMonthEarningsResult._sum.price || 0;

    const lastMonthEarningsResult = await prisma.booking.aggregate({
        where: {
            tutorProfileId,
            status: "COMPLETED",
            availabilitySlot: {
                date: { gte: lastMonthStart, lte: lastMonthEnd }
            }
        },
        _sum: { price: true }
    });
    const lastMonthEarnings = lastMonthEarningsResult._sum.price || 0;

    const earningGrowth = lastMonthEarnings === 0
        ? (currentMonthEarnings > 0 ? 100 : 0)
        : ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;

    // Avg Rating Status
    const currentMonthAvgRatingResult = await prisma.review.aggregate({
        where: {
            tutorProfileId,
            createdAt: { gte: currentMonthStart }
        },
        _avg: { rating: true }
    });
    const currentMonthAvgRating = currentMonthAvgRatingResult._avg.rating || 0;

    const lastMonthAvgRatingResult = await prisma.review.aggregate({
        where: {
            tutorProfileId,
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _avg: { rating: true }
    });
    const lastMonthAvgRating = lastMonthAvgRatingResult._avg.rating || 0;

    let ratingStatus: "Up" | "Down" | "Steady" = "Steady";
    if (currentMonthAvgRating > lastMonthAvgRating) ratingStatus = "Up";
    else if (currentMonthAvgRating < lastMonthAvgRating) ratingStatus = "Down";

    // New Bookings (Upcoming Confirmed)
    // 1. Confirmed today that haven't ended yet
    const todayConfirmedUpcomingCount = todaySessionsResult.filter(booking => {
        if (booking.status !== "CONFIRMED") return false;
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        return isAfter(endDateTime, now);
    }).length;

    // 2. Confirmed for future days
    const futureConfirmedCount = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: "CONFIRMED",
            availabilitySlot: {
                date: { gt: todayStart }
            }
        }
    });

    const newBookingsCount = todayConfirmedUpcomingCount + futureConfirmedCount;

    // Bookings with no meeting link (Today upcoming + Future)
    const todayConfirmedNoLinkCount = todaySessionsResult.filter(booking => {
        if (booking.status !== "CONFIRMED") return false;
        if (booking.meetingLink && booking.meetingLink !== "") return false;
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const endDateTime = parse(`${dateStr} ${booking.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        return isAfter(endDateTime, now);
    }).length;

    const futureConfirmedNoLinkCount = await prisma.booking.count({
        where: {
            tutorProfileId,
            status: "CONFIRMED",
            availabilitySlot: {
                date: { gt: todayStart },
            },
            OR: [
                { meetingLink: null },
                { meetingLink: "" }
            ]
        }
    });

    const bookingsWithNoLinkCount = todayConfirmedNoLinkCount + futureConfirmedNoLinkCount;

    // 5. Upcoming Sessions (via shared helper, slotEndTime-aware)
    const upcomingSessionsRaw = await getUpcomingTutorSessions(tutorProfileId, 3);

    const upcomingSessions = upcomingSessionsRaw.map(booking => {
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const startTimeISO = parse(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", new Date()).toISOString();

        return {
            bookingId: booking.id,
            studentName: booking.user.name,
            categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
            slotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
            slotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
            startTimeISO,
            meetingLink: booking.meetingLink,
        };
    });

    return {
        tutorName: tutor.user.name,
        todayUpcomingSessionsCount: todayUpcomingSessionsCount,
        stats: {
            totalSessions: {
                value: totalCompletedSessions,
                growth: Number(sessionGrowth.toFixed(2))
            },
            totalEarnings: {
                value: totalEarnings,
                growth: Number(earningGrowth.toFixed(2))
            },
            avgRating: {
                value: tutor.rating,
                status: ratingStatus
            },
            newBookings: {
                value: newBookingsCount,
                badge: String(bookingsWithNoLinkCount)
            }
        },
        upcomingSessions
    };
}

//Get Tutor Dashboard Revenue Trends
const getDashboardRevenueTrends = async (tutorProfileId: string, trendPeriod: TRevenueTrendPeriod): Promise<TGetDashboardRevenueTrendsResponse> => {
    const now = new Date();
    const revenueTrends = [];

    if (trendPeriod === "one-week" || trendPeriod === "one-month") {
        const daysToCount = trendPeriod === "one-week" ? 7 : 30;
        for (let i = daysToCount - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const start = startOfDay(date);
            const end = endOfDay(date);
            const label = trendPeriod === "one-week" ? format(date, "EEE") : format(date, "MMM dd");

            const dayRevenue = await prisma.booking.aggregate({
                where: {
                    tutorProfileId,
                    status: "COMPLETED",
                    availabilitySlot: {
                        date: { gte: start, lte: end }
                    }
                },
                _sum: { price: true }
            });

            revenueTrends.push({
                month: label,
                revenue: dayRevenue._sum.price || 0
            });
        }
    } else {
        let monthsToCount = 12;
        let startFrom = startOfMonth(subMonths(now, 11));

        if (trendPeriod === "three-month") {
            monthsToCount = 3;
            startFrom = startOfMonth(subMonths(now, 2));
        } else if (trendPeriod === "six-month") {
            monthsToCount = 6;
            startFrom = startOfMonth(subMonths(now, 5));
        } else if (trendPeriod === "this-year") {
            const currentYearStart = startOfYear(now);
            monthsToCount = differenceInMonths(now, currentYearStart) + 1;
            startFrom = currentYearStart;
        } else if (trendPeriod === "all-time") {
            const firstBooking = await prisma.booking.findFirst({
                where: { tutorProfileId, status: "COMPLETED" },
                orderBy: { availabilitySlot: { date: "asc" } },
                include: { availabilitySlot: true }
            });

            if (firstBooking?.availabilitySlot) {
                const tutorStartDate = startOfMonth(firstBooking.availabilitySlot.date);
                monthsToCount = differenceInMonths(now, tutorStartDate) + 1;
                startFrom = tutorStartDate;
            } else {
                monthsToCount = 6;
                startFrom = startOfMonth(subMonths(now, 5));
            }
        }

        for (let i = monthsToCount - 1; i >= 0; i--) {
            const monthDate = subMonths(now, i);
            if (isBefore(monthDate, startFrom)) continue;

            const start = startOfMonth(monthDate);
            const end = endOfMonth(monthDate);
            const monthName = format(monthDate, "MMMM");

            const monthlyRevenue = await prisma.booking.aggregate({
                where: {
                    tutorProfileId,
                    status: "COMPLETED",
                    availabilitySlot: {
                        date: { gte: start, lte: end }
                    }
                },
                _sum: { price: true }
            });

            revenueTrends.push({
                month: monthName,
                revenue: monthlyRevenue._sum.price || 0
            });
        }
    }

    return { revenueTrends };
}

//----------------------*-----------Schedule Management-----------*----------------------*

const getTutorScheduleMeta = async (tutorProfileId: string): Promise<TScheduleMetaResponse> => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));

    // 1. Fetch relevant bookings (CONFIRMED and COMPLETED)
    const bookings = await prisma.booking.findMany({
        where: {
            tutorProfileId,
            status: { in: ["CONFIRMED", "COMPLETED"] }
        },
        include: {
            availabilitySlot: true,
            user: { select: { name: true, image: true } },
            tutorProfile: {
                include: {
                    tutorCategories: {
                        include: { category: { select: { name: true } } }
                    }
                }
            }
        }
    });

    // 2. Fetch reviews for satisfaction rate
    const reviews = await prisma.review.findMany({
        where: { tutorProfileId }
    });

    // 3. Stats Calculation
    // todaySessions: only CONFIRMED sessions today where slotEndTime has NOT passed yet
    const todaySessions = bookings.filter(b => {
        if (b.status !== "CONFIRMED" || !isSameDay(b.availabilitySlot!.date, today)) return false;
        const dateStr = format(b.availabilitySlot!.date, "yyyy-MM-dd");
        const endDateTime = parse(`${dateStr} ${b.availabilitySlot!.endTime}`, "yyyy-MM-dd HH:mm", new Date());
        return isAfter(endDateTime, now);
    }).length;

    const upcomingSessionsCount = bookings.filter(b =>
        b.status === "CONFIRMED" &&
        isSameDay(b.availabilitySlot!.date, tomorrow)
    ).length;

    const uncompletedBookings = bookings.filter(b =>
        b.status === "CONFIRMED"
    ).length;

    const totalBookings = bookings.length;
    const completedBookingsCount = bookings.filter(b => b.status === "COMPLETED").length;

    // Satisfaction Rate Calculation (((positiveReviewsCount(>=4) / totalReviewsCount) * 100)
    let satisfactionRate = 100;
    if (reviews.length > 0) {
        const positiveReviews = reviews.filter(r => r.rating >= 4).length;
        satisfactionRate = (positiveReviews / reviews.length) * 100;
    }

    // 4. Format Data
    // startingSoon uses shared helper (slotEndTime-aware, all upcoming sessions)
    const startingSoonRaw = await getUpcomingTutorSessions(tutorProfileId, 3);

    const startingSoon: TScheduleStartingSoon[] = startingSoonRaw.map(b => {
        const dateStr = format(b.availabilitySlot.date, "yyyy-MM-dd");
        const startTimeISO = parse(`${dateStr} ${b.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", new Date()).toISOString();
        return {
            bookingId: b.id,
            categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
            startTime: format(parse(b.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
            endTime: format(parse(b.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
            studentName: b.user.name,
            studentImage: b.user.image || "",
            startTimeISO,
            bookingStatus: b.status as "CONFIRMED" | "COMPLETED",
            meetingLink: b.meetingLink,
        };
    });

    // 5. classLinkHub uses shared helper (slotEndTime-aware, all upcoming sessions)
    const classLinkHubRaw = await getUpcomingTutorSessions(tutorProfileId, 6);

    const classLinkHub: TScheduleClassLinkHub[] = classLinkHubRaw
        .filter(b => b.status === "CONFIRMED")
        .map(b => ({
            bookingId: b.id,
            categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
            studentName: b.user.name,
            bookingStatus: b.status as "CONFIRMED" | "COMPLETED",
            meetingLink: b.meetingLink,
        }));

    return {
        stats: {
            todaySessions,
            upcomingSessions: upcomingSessionsCount,
            uncompletedBookings,
            totalBookings,
            completedBookings: {
                count: completedBookingsCount,
                satisfactionRate: Number(satisfactionRate.toFixed(2))
            }
        },
        startingSoon,
        classLinkHub
    };
}

const getTutorScheduleEvents = async (tutorProfileId: string, startDate?: string, endDate?: string): Promise<TScheduleEventsResponse> => {
    const now = new Date();
    const start = startDate ? startOfDay(new Date(startDate)) : startOfMonth(now);
    const end = endDate ? endOfDay(new Date(endDate)) : endOfMonth(now);

    const whereConditions: Prisma.BookingWhereInput = {
        tutorProfileId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        availabilitySlot: {
            date: {
                gte: start,
                lte: end
            }
        }
    };

    const bookings = await prisma.booking.findMany({
        where: whereConditions,
        include: {
            availabilitySlot: true,
            user: { select: { name: true } },
            tutorProfile: {
                include: {
                    tutorCategories: {
                        include: { category: { select: { name: true } } }
                    }
                }
            }
        },
        orderBy: [
            { availabilitySlot: { date: 'asc' } },
            { availabilitySlot: { startTime: 'asc' } }
        ]
    });

    const calendarEvents: TScheduleCalendarEvent[] = bookings.map(b => ({
        bookingId: b.id,
        categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
        studentName: b.user.name,
        dateISO: b.availabilitySlot!.date.toISOString(),
        startTime: format(parse(b.availabilitySlot!.startTime, "HH:mm", new Date()), "hh:mm a"),
        endTime: format(parse(b.availabilitySlot!.endTime, "HH:mm", new Date()), "hh:mm a"),
        bookingStatus: b.status as "CONFIRMED" | "COMPLETED",
        meetingLink: b.meetingLink
    }));

    return { calendarEvents };
}


const tutorService = {
    getAllTutors,
    getTutorProfileByProfileId,
    getAvailableSlots,
    getTutorDetailsByUserId,
    updateTutorProfile,
    getTutorSelectedCategories,
    setTutorCategories,
    getTutorWeeklyAvailableSlots,
    createTutorWeeklyAvailability,
    updateTutorWeeklyAvailability,
    deleteTutorWeeklyAvailability,
    getAllTutorException,
    createTutorException,
    deleteTutorException,
    getTutorAllSession,
    updateBookingStatus,
    updateBookingMeetingLink,
    getSessionDetailsByBookingId,
    getDashboardMeta,
    getDashboardRevenueTrends,
    getTutorScheduleMeta,
    getTutorScheduleEvents,
    getTutorProfileByUserId,
}


export default tutorService;
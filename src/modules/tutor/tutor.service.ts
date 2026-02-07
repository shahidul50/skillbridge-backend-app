import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";


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
    const exceptionDate = new Date(payload.date);
    console.log(exceptionDate)

    // check if an exception already exists for the given date
    const existingException = await prisma.tutorAvailabilityException.findFirst({
        where: {
            tutorProfileId,
            date: exceptionDate
        }
    });

    if (existingException) {
        throw new AppError("An exception already exists for this date", 400, "DUPLICATE_ERROR");
    }

    // create a new exception
    return await prisma.tutorAvailabilityException.create({
        data: {
            tutorProfileId,
            date: exceptionDate,
            reason: payload.reason,
        },
    });
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
    getTutorProfileByUserId
}


export default tutorService;
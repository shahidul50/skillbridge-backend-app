import { format, formatDistanceToNow, parse } from "date-fns";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma"
import { UserRole } from "../../middleware/authMiddleware";
import { AppError } from "../../utils/AppError";


//Get total users, tutors, booking, pendingBooking etc.
const getDashboardStats = async () => {
    const [
        totalUsers,
        totalTutors,
        totalStudents,
        totalBannedUsers,
        recentBookings,
        recentPayments
    ] = await Promise.all([

        // total users (without Admin)
        prisma.user.count({ where: { role: { not: 'ADMIN' } } }),

        // total tutor count
        prisma.tutorProfile.count(),

        // total student count
        prisma.user.count({ where: { role: 'STUDENT' } }),

        // total banned users
        prisma.user.count({ where: { isActive: false } }),

        // Recent 5 Bookings
        prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true, image: true } },
                tutorProfile: {
                    include: {
                        user: { select: { name: true, email: true, image: true } },
                        tutorCategories: { include: { category: { select: { name: true } } } }
                    }
                },
                availabilitySlot: { select: { date: true, startTime: true, endTime: true } }
            }
        }),

        // Recent 5 payments for activity tracking
        prisma.payment.findMany({
            take: 5,
            orderBy: { submittedAt: 'desc' },
            include: { user: { select: { name: true } } }
        })
    ]);

    return {
        totalUsers,
        totalTutors,
        totalStudents,
        totalBannedUsers,
        recentBookings: recentBookings.map(booking => ({
            studentName: booking.user.name,
            studentEmail: booking.user.email,
            studentImage: booking.user.image,
            tutorName: booking.tutorProfile.user.name,
            tutorEmail: booking.tutorProfile.user.email,
            tutorImage: booking.tutorProfile.user.image,
            tutorCategories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
            availabilitySlotDate: format(booking.availabilitySlot.date, 'MMMM dd, yyyy'),
            availabilitySlotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
            availabilitySlotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
            price: booking.price,
            status: booking.status
        })),
        recentPayments: recentPayments.map(payment => ({
            transactionId: payment.transactionId,
            studentName: payment.user.name,
            amount: payment.amount,
            date: formatDistanceToNow(new Date(payment.submittedAt), { addSuffix: true }),
            status: payment.status
        }))
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
            totalPages: Math.ceil(total / limitNumber),
        },
    };
}

// get user by userId
const getUserByUserId = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            image: true,
            createdAt: true,
        }
    });
}

//get tutor profile details by user id
const getTutorProfileDetailsByUserId = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            tutorProfile: {
                include: {
                    bookings: {
                        where: {
                            status: { in: ['CONFIRMED', 'COMPLETED'] }
                        },
                        include: {
                            availabilitySlot: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (!user.tutorProfile) {
        throw new AppError("Tutor profile not found for this user", 404);
    }

    const tutorProfile = user.tutorProfile;

    // Calculate Total session (hours)
    let totalMinutes = 0;
    tutorProfile.bookings.forEach(booking => {
        if (booking.availabilitySlot) {
            const start = parse(booking.availabilitySlot.startTime, "HH:mm", new Date());
            const end = parse(booking.availabilitySlot.endTime, "HH:mm", new Date());
            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
            totalMinutes += diff;
        }
    });
    const totalHours = Math.floor(totalMinutes / 60);

    // Calculate totalStudentTaught (unique students)
    const uniqueStudents = new Set(tutorProfile.bookings.map(b => b.studentId));
    const totalStudentTaught = uniqueStudents.size;

    return {
        tutorName: user.name,
        tutorEmail: user.email,
        tutorImage: user.image,
        role: user.role,
        joiningDate: format(user.createdAt, "MMM dd, yyyy"),
        status: user.isActive ? 'Active' : 'Banned',
        tutorTitle: tutorProfile.title,
        experience: `${tutorProfile.experience} years`,
        phoneNumber: user.phoneNumber || "N/A",
        hourlyRate: tutorProfile.hourlyRate || 0,
        rating: tutorProfile.rating || 0,
        totalReviews: tutorProfile.totalReviews || 0,
        totalSession: `${totalHours} hours`,
        totalStudentTaught: `${totalStudentTaught} unique students`,
        bio: tutorProfile.bio
    };
}

//get student profile details by user id
const getStudentDetailsByUserId = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            bookings: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    tutorProfile: {
                        include: {
                            user: { select: { name: true } },
                            tutorCategories: { include: { category: { select: { name: true } } } }
                        }
                    },
                    payment: { select: { transactionId: true } }
                }
            },
            payments: {
                take: 5,
                orderBy: { submittedAt: 'desc' },
                include: {
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
            },
            _count: {
                select: { bookings: true }
            }
        }
    });

    if (!user) {
        throw new AppError("Student not found", 404);
    }

    return {
        studentName: user.name,
        studentEmail: user.email,
        studentImage: user.image,
        role: user.role,
        joiningDate: format(user.createdAt, "MMM dd, yyyy"),
        accountStatus: user.isActive ? "Active" : "Banned",
        phoneNumber: user.phoneNumber || "N/A",
        totalBookings: `${user._count.bookings} bookings`,
        recentBookings: user.bookings.map((booking) => ({
            date: format(booking.createdAt, "MMM dd, yyyy"),
            tutorName: booking.tutorProfile?.user?.name || "N/A",
            subject: booking.tutorProfile?.tutorCategories.map(tc => tc.category.name) || [],
            status: booking.status,
        })),
        recentPayments: user.payments.map((payment) => ({
            transactionId: payment.transactionId || "N/A",
            amount: payment.amount,
            submittedDate: format(payment.submittedAt, "MMM dd, yyyy"),
            status: payment.status,
        })),
    };
};

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



const adminService = {
    getDashboardStats,
    getAllPlatformUser,
    getUserByUserId,
    getTutorProfileDetailsByUserId,
    getStudentDetailsByUserId,
    bannedUserAccount,
}

export default adminService;
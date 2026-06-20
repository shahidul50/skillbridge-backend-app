import { differenceInMinutes, format, parse, addDays, isSameDay, startOfDay, isAfter, startOfMonth, endOfMonth, endOfDay } from "date-fns";
import { prisma } from "../../lib/prisma";
import { TGetDashboardMetaDataResponse, TGetUpcomingSessionsResponse, TRecentBookingsResponse, TSScheduleMetaDataResponse, TStudentScheduleCalendarEventResponse } from "../../types/student.type";
import { Prisma } from "../../../generated/prisma/client";

const getDashboardMetaData = async (studentId: string): Promise<TGetDashboardMetaDataResponse> => {
    const now = new Date();

    // Fetch all bookings for the student with their availability slots and reviews
    const bookings = await prisma.booking.findMany({
        where: {
            studentId,
        },
        include: {
            availabilitySlot: true,
            user: { select: { name: true } },
            review: true,
        },
    });

    // Student Basic Info
    const student = await prisma.user.findUniqueOrThrow({
        where: { id: studentId },
        select: { name: true },
    });

    // 1. stats.totalHoursLearned: Sum of durations of all COMPLETED bookings
    let totalMinutes = 0;
    const completedBookings = bookings.filter(b => b.status === "COMPLETED");
    for (const b of completedBookings) {
        if (b.availabilitySlot) {
            const start = parse(b.availabilitySlot.startTime, "HH:mm", new Date(b.availabilitySlot.date));
            const end = parse(b.availabilitySlot.endTime, "HH:mm", new Date(b.availabilitySlot.date));
            const diff = differenceInMinutes(end, start);
            if (!Number.isNaN(diff) && diff > 0) {
                totalMinutes += diff;
            }
        }
    }
    const totalLearningHours = Math.floor(totalMinutes / 60); // Convert minutes to Hours
    const totalLearningMunites = totalMinutes % 60;
    const totalHoursLearned = `${totalLearningHours}h ${totalLearningMunites}m`;

    // Filter out CANCELLED bookings for upcoming calculations
    const activeBookings = bookings.filter(b => b.status !== "CANCELLED" && b.status !== "PENDING");

    // Helper to get slotEndTime for a booking
    const getSlotEndTime = (b: any): Date => {
        const dateStr = format(b.availabilitySlot.date, "yyyy-MM-dd");
        return parse(`${dateStr} ${b.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
    };

    // 2. stats.upcomingSessionsCount.thisWeekCount: bookings in next 7 days from now (inclusive of today) where slotEndTime > now
    const endOfWeek = addDays(now, 7);
    const thisWeekBookings = activeBookings.filter(b => {
        if (!b.availabilitySlot) return false;
        const slotEndTime = getSlotEndTime(b);
        return slotEndTime > now && slotEndTime <= endOfWeek;
    });
    const thisWeekCount = thisWeekBookings.length;

    // 3. stats.upcomingSessionsCount.todayCount: bookings on today's date where slotEndTime > now
    const todayBookings = activeBookings.filter(b => {
        if (!b.availabilitySlot) return false;
        const isToday = isSameDay(new Date(b.availabilitySlot.date), now);
        if (!isToday) return false;
        const slotEndTime = getSlotEndTime(b);
        return slotEndTime > now;
    });
    const todayCount = todayBookings.length;

    // 4. stats.activeSessions.count: CONFIRMED bookings where slotEndTime > now
    const confirmedBookings = activeBookings.filter(b => {
        if (b.status !== "CONFIRMED") return false;
        if (!b.availabilitySlot) return false;
        const slotEndTime = getSlotEndTime(b);
        return slotEndTime > now;
    });
    const activeSessionsCount = confirmedBookings.length;

    // 5. stats.activeSessions.pendingModules: count of all PENDING bookings
    const pendingBookingsCount = bookings.filter(b => b.status === "PENDING").length;

    // 6. stats.unreviewedBookings.count & pendingFeedbackSessions: COMPLETED bookings where review is null
    const unreviewedBookings = completedBookings.filter(b => b.review === null);
    const unreviewedCount = unreviewedBookings.length;

    return {
        stats: {
            studentName: student.name || "",
            totalHoursLearned,
            upcomingSessionsCount: {
                thisWeekCount,
                todayCount,
            },
            activeSessions: {
                count: activeSessionsCount,
                pendingModules: pendingBookingsCount,
            },
            unreviewedBookings: {
                count: unreviewedCount,
                pendingFeedbackSessions: unreviewedCount,
            },
        },
    };
};

// Helper: Fetch upcoming CONFIRMED sessions filtered by slotEndTime > now
const getUpcomingStudentSessions = async (studentId: string, limit: number) => {
    const now = new Date();
    const todayStart = startOfDay(now);

    const result = await prisma.booking.findMany({
        where: {
            studentId,
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
            availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
            tutorProfile: {
                include: {
                    user: { select: { name: true, image: true } },
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

// get upcoming sessions data for student dashboard
const getDashboardUpcomingSessions = async (studentId: string): Promise<TGetUpcomingSessionsResponse> => {
    //Upcoming Sessions (via shared helper, slotEndTime-aware)
    const upcomingSessionsRaw = await getUpcomingStudentSessions(studentId, 3);

    const upcomingSessions = upcomingSessionsRaw.map(booking => {
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const startTimeISO = parse(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", new Date()).toISOString();

        return {
            bookingId: booking.id,
            tutorName: booking.tutorProfile.user.name,
            tutorImage: booking.tutorProfile.user.image ?? null,
            categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
            slotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
            slotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
            startTimeISO,
            meetingLink: booking.meetingLink ?? null,
        };
    });

    return upcomingSessions;
}

// get recent bookings data for student dashboard
const getDashboardRecentBookings = async (studentId: string): Promise<TRecentBookingsResponse> => {
    const recentBookings = await prisma.booking.findMany({
        where: {
            studentId,
        },
        take: 5,
        include: {
            availabilitySlot: true,
            tutorProfile: {
                include: {
                    user: { select: { name: true, image: true } },
                    tutorCategories: { include: { category: { select: { name: true } } } }
                }
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const formattedBookings: TRecentBookingsResponse = recentBookings.map((booking) => ({
        bookingId: booking.id,
        tutorName: booking.tutorProfile.user.name,
        tutorImage: booking.tutorProfile.user.image ?? null,
        tutorTitle: booking.tutorProfile.title,
        categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
        availabilitySlotDate: format(booking.availabilitySlot.date, 'MMMM dd, yyyy'),
        slotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
        slotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
        status: booking.status,
        amount: booking.price,
    }));

    return formattedBookings;
};

// get schedule calendar events for student dashboard
const getScheduleCalendarEvents = async (studentId: string, startDate?: string, endDate?: string) => {
    const now = new Date();
    const start = startDate ? startOfDay(new Date(startDate)) : startOfMonth(now);
    const end = endDate ? endOfDay(new Date(endDate)) : endOfMonth(now);

    const whereConditions: Prisma.BookingWhereInput = {
        studentId,
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
            tutorProfile: {
                include: {
                    user: { select: { name: true } },
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

    const calendarEvents: TStudentScheduleCalendarEventResponse = bookings.map(b => ({
        bookingId: b.id,
        categoryName: b.tutorProfile.tutorCategories[0]?.category.name || "N/A",
        tutorName: b.tutorProfile.user.name,
        dateISO: b.availabilitySlot!.date.toISOString(),
        startTime: format(parse(b.availabilitySlot!.startTime, "HH:mm", new Date()), "hh:mm a"),
        endTime: format(parse(b.availabilitySlot!.endTime, "HH:mm", new Date()), "hh:mm a"),
        bookingStatus: b.status as "CONFIRMED" | "COMPLETED",
        meetingLink: b.meetingLink
    }));

    return { calendarEvents };
}

// get schedule meta data for student dashboard
const getScheduleMetaData = async (studentId: string): Promise<TSScheduleMetaDataResponse> => {
      const now = new Date();
    // Fetch all bookings for the student with their availability slots and reviews
    const bookings = await prisma.booking.findMany({
        where: {
            studentId,
            status: { in: ["CONFIRMED", "COMPLETED"] }
        },
        include: {
            availabilitySlot: true,
        },
    });

     // Helper to get slotEndTime for a booking
    const getSlotEndTime = (b: any): Date => {
        const dateStr = format(b.availabilitySlot.date, "yyyy-MM-dd");
        return parse(`${dateStr} ${b.availabilitySlot.endTime}`, "yyyy-MM-dd HH:mm", new Date());
    };
    
    const todayBookings = bookings.filter(b => {
        if (!b.availabilitySlot) return false;
        const isToday = isSameDay(new Date(b.availabilitySlot.date), now);
        if (!isToday) return false;
        const slotEndTime = getSlotEndTime(b);
        return slotEndTime > now;
    });
    const todayCount = todayBookings.length;

        //Upcoming Sessions (via shared helper, slotEndTime-aware)
    const upcomingSessionsRaw = await getUpcomingStudentSessions(studentId, 5);

    const upcomingSessions = upcomingSessionsRaw.map(booking => {
        const dateStr = format(booking.availabilitySlot.date, "yyyy-MM-dd");
        const startTimeISO = parse(`${dateStr} ${booking.availabilitySlot.startTime}`, "yyyy-MM-dd HH:mm", new Date()).toISOString();

        return {
            bookingId: booking.id,
            tutorName: booking.tutorProfile.user.name,
            tutorImage: booking.tutorProfile.user.image ?? null,
            categories: booking.tutorProfile.tutorCategories.map(tc => tc.category.name),
            slotStartTime: format(parse(booking.availabilitySlot.startTime, "HH:mm", new Date()), "hh:mm a"),
            slotEndTime: format(parse(booking.availabilitySlot.endTime, "HH:mm", new Date()), "hh:mm a"),
            startTimeISO,
            meetingLink: booking.meetingLink ?? null,
        };
    });

    return {
        todaySessionCount: todayCount,
        upcomingSessions: upcomingSessions
    }
}


const studentService = {
    getDashboardMetaData,
    getDashboardUpcomingSessions,
    getDashboardRecentBookings,
    getScheduleCalendarEvents,
    getScheduleMetaData
};

export default studentService;

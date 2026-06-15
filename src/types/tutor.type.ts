export type UpdatableDataInput = {
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

export type QueryParams = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  searchTerm?: string;
}

export type GetAllTutorQueryParams = QueryParams & {
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday"
}

export type TCreateWeeklyAvailability = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export type TUpdateWeeklyAvailability = {
  isActive: boolean;
}

export type TCreateException = {
  date: string;
  reason: string;
}

export type TGetAvailableSlotsQuery = {
  tutorProfileId: string;
  startDate?: string;
}

type TUpcommingSession = {
  bookingId: string;
  categories: string[];
  studentName: string;
  slotStartTime: string;
  slotEndTime: string;
  startTimeISO: string;
  meetingLink: string | null;
}

type TRevenueTrend = {
  month: string;
  revenue: number;
}

type TStats = {
  totalSessions: {
    value: number;
    growth: number;
  }
  totalEarnings: {
    value: number;
    growth: number;
  }
  avgRating: {
    value: number;
    status: "Up" | "Down" | "Steady";
  }
  newBookings: {
    value: number;
    badge: string;
  }
}

export type TGetDashboardMetaResponse = {
  tutorName: string;
  todayUpcomingSessionsCount: number;
  stats: TStats;
  upcomingSessions: TUpcommingSession[];
}

export type TGetDashboardRevenueTrendsResponse = {
  revenueTrends: TRevenueTrend[];
}

export type TGetDashboardRevenueTrendsQueryParams = {
  trendPeriod: TRevenueTrendPeriod;
}

export type TRevenueTrendPeriod = "one-week" | "one-month" | "three-month" | "six-month" | "this-year" | "all-time";

export type TGetAllSession = {
  bookingId: string;
  studentName: string;
  studentImage: string;
  categories: string[];
  availabilitySlotDate: string;
  availabilityStartTime: string;
  availabilityEndTime: string;
  status: "CONFIRMED" | "COMPLETED";
  meetingLink: string | null;
}

export type TGetAllSessionsResponse = {
  data: TGetAllSession[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export type TGetAllSessionsQueryParams = QueryParams & {
  status?: "CONFIRMED" | "COMPLETED";
}


export type TUpdateBookingStatusByTutor = {
  meetingLink?: string;
  status: "CONFIRMED" | "COMPLETED";
}


type TScheduleStats = {
  todaySessions: number;
  upcomingSessions: number;
  uncompletedBookings: number;
  totalBookings: number;
  completedBookings: {
    count: number;
    satisfactionRate: number;
  }
}

export type TScheduleCalendarEvent = {
  bookingId: string;
  categoryName: string;
  studentName: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  bookingStatus: "CONFIRMED" | "COMPLETED";
  meetingLink: string | null;
}

export type TScheduleStartingSoon = {
  bookingId: string;
  categoryName: string;
  startTime: string;
  endTime: string;
  studentName: string;
  studentImage: string;
  startTimeISO: string;
  bookingStatus: "CONFIRMED" | "COMPLETED";
  meetingLink: string | null;
}

export type TScheduleClassLinkHub = {
  bookingId: string;
  categoryName: string;
  studentName: string;
  bookingStatus: "CONFIRMED" | "COMPLETED";
  meetingLink: string | null;
}



export type TScheduleMetaResponse = {
  stats: TScheduleStats;
  startingSoon: TScheduleStartingSoon[];
  classLinkHub: TScheduleClassLinkHub[];
}

export type TScheduleEventsQueryParams = {
  startDate?: string;
  endDate?: string;
}

export type TScheduleEventsResponse = {
  calendarEvents: TScheduleCalendarEvent[];
}


export type TGetBookingMeetingLinkAndStatusResponse = {
  bookingId: string;
  meetingLink: string | null;
  status: "CONFIRMED" | "COMPLETED";
}


export type TGetSessionDetailsByBookingIdResponse = {
  bookingId: string;
  studentName: string;
  studentImage: string;
  categories: string[];
  availabilitySlotDate: string;
  availabilityStartTime: string;
  availabilityEndTime: string;
  duration: number;
  status: "CONFIRMED" | "COMPLETED";
  meetingLink: string | null;
  review: {
    rating: number;
    comment: string;
  } | null;
}
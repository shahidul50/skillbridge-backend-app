type TBooking = {
    id: string
    tutorName: string;
    tutorTitle: string
    TutorImage: string | null;
    categories: string[]
    availabilitySlotDate: string
    availabilityStartTime: string
    availabilityEndTime: string
    price: number;
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING"
}


export type TAllBookingByStudentIdQueryParams = {
    page: string
    limit: string
    sortBy: string
    sortOrder: "asc" | "desc"
    searchTerm: string
    bookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
}

export type TGetAllBookingByStudentIdResponse = {
    bookings: TBooking[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export type TGetAllBookingByStudentIdMetaResponse = {
    totalInvestment: number;
    learningHours: string;
    completedSessions: string
}

export type TGetBookingReciptByBookingIdResponse = {
    bookingId: string;
    invoiceId: string;
    tutorName: string;
    categories: string[];
    availabilitySlotDate: string;
    availabilitySlotStartTime: string;
    availabilityEndTime: string;
    duration: number;
    status: "CONFIRMED" | "COMPLETED";
    price: number;
    platformServiceFee: number;
    total: number;
    trancationId: string;
    paymentMethod: string;
}

//about-us stats type
export type TGetAboutUsStatsResponse = {
    activeStudent: number;
    expertTutors: number;
    totalSessions: number;
    successRate: number;
}
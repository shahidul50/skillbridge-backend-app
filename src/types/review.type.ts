export type TGetAllBookingWithReview = {
    id: string,
    tutorName: string,
    tutorTitle: string,
    TutorImage: string | null,
    categories: string[],
    availabilitySlotDate: string,
    availabilityStartTime: string,
    availabilityEndTime: string,
    status: "COMPLETED",
    review: {
        rating: number,
        comment: string
    } | null
}

export type TGetAllBookingWithReviewResponse = {
    data: TGetAllBookingWithReview[],
    pagination: {
        total: number
        page: number,
        limit: number,
        totalPages: number
    }
}

export type TGetAllBookingWithReviewQueryParams = {
    limit: number,
    page: number,
    sortBy: string,
    sortOrder: string,
    searchTerm?: string | undefined,
    reviewStatus?: "Reviewed" | "Unreviewed"
}

export type TCreateReviewBodyData = {
    bookingId: string,
    rating: number,
    comment: string | null 
}
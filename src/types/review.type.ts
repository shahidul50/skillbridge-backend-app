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

export type TGetAllReviewStatsByTutorProfileIdResponse = {
    tutor:{
        profileId: string
        name: string
        avatar: string | null,
        pricePerSession: number
        averageRating: number
        totalReviewsCount: number
    },
    ratingBreakdown: {
        fiveStars: { count: number, percentage: number },
        fourStars: { count: number, percentage: number },
        threeStars: { count: number, percentage: number },
        twoStars: { count: number, percentage: number },
        oneStars: { count: number, percentage: number },
    },
}

export type TGetAllReviewByTutorProfileIdResponse = {
    reviews: {
        id: string,
        studentName: string,
        studentAvatar: string | null,
        rating: number,
        comment: string,
        time: string
    }[],
    pagination: {
        total: number
        page: number,
        limit: number,
        totalPages: number
    }
}

export type TGetAllReviewByTutorProfileIdQueryParams = {
    limit: string,
    page: string,
    sortBy: string,
    sortOrder: "most-recent" | "highest-rated" | "lowest-rated",
}

// features review type
export type TFeaturesReviewResponse = {
    id: string,
    studentName: string,
    studentTitle: "Verified Student",
    studentAvatar: string | null,
    rating: number,
    comment: string,
}

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";


//Create new review by booking Id
const createReview = async (studentId: string, payload: any) => {
    const { bookingId, rating, comment } = payload;

    // get booking details 
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.studentId !== studentId) throw new AppError("You can only review your own sessions", 403);
    if (booking.status !== "COMPLETED") throw new AppError("Review is only allowed after completion", 400);

    // check this booking has a review or not
    const existingReview = await prisma.review.findUnique({ where: { bookingId } });
    if (existingReview) throw new AppError("Review already exists for this booking", 400);

    // new review create and tutor average rating update)
    const result = await prisma.$transaction(async (tx) => {
        const newReview = await tx.review.create({
            data: {
                bookingId,
                studentId,
                tutorProfileId: booking.tutorProfileId,
                rating,
                comment
            }
        });

        // get tutor rating average and total Review
        const stats = await tx.review.aggregate({
            where: { tutorProfileId: booking.tutorProfileId },
            _avg: { rating: true },
            _count: { id: true }
        });

        // tutor profile update
        await tx.tutorProfile.update({
            where: { id: booking.tutorProfileId },
            data: {
                rating: stats._avg.rating || 0,
                totalReviews: stats._count.id || 0
            }
        });

        return newReview;
    });

    return result;
}


const reviewService = {
    createReview
}


export default reviewService;
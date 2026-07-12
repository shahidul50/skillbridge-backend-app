import { format, formatDistanceToNow, parse } from "date-fns";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Prisma } from "../../../generated/prisma/client";
import { TCreateReviewBodyData, TGetAllBookingWithReviewQueryParams, TGetAllBookingWithReviewResponse, TGetAllReviewByTutorProfileIdQueryParams, TGetAllReviewByTutorProfileIdResponse, TGetAllReviewStatsByTutorProfileIdResponse } from '../../types/review.type';


//Get all booking with review summary for a student
const getAllBookingWithReview = async (query: any, studentId: string): Promise<TGetAllBookingWithReviewResponse> => {
  const { page, limit, sortBy, sortOrder, searchTerm, reviewStatus } = query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const andConditions: Prisma.BookingWhereInput[] = [{ studentId }];
  andConditions.push({ status: 'COMPLETED' });

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          tutorProfile: {
            user: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        },
        {
          tutorProfile: {
            title: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ],
    });
  }

  if (reviewStatus === 'Reviewed') {
    andConditions.push({ review: { isNot: null } });
  }

  if (reviewStatus === 'Unreviewed') {
    andConditions.push({ review: { is: null } });
  }

  const whereConditions: Prisma.BookingWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
  const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'price', 'id'];
  const orderBy = allowedSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder as Prisma.SortOrder }
    : { createdAt: sortOrder as Prisma.SortOrder };

  const [result, total] = await Promise.all([
    prisma.booking.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy,
      include: {
        tutorProfile: {
          include: {
            user: { select: { name: true, image: true } },
            tutorCategories: { include: { category: { select: { name: true } } } },
          },
        },
        availabilitySlot: { select: { date: true, startTime: true, endTime: true } },
        review: { select: { rating: true, comment: true } },
      },
    }),
    prisma.booking.count({ where: whereConditions }),
  ]);

  const data = result.map((booking) => ({
    id: booking.id,
    tutorName: booking.tutorProfile.user.name,
    tutorTitle: booking.tutorProfile.title,
    TutorImage: booking.tutorProfile.user.image ?? null,
    categories: booking.tutorProfile.tutorCategories.map((item) => item.category.name),
    availabilitySlotDate: format(booking.availabilitySlot.date, 'MMM dd, yyyy'),
    availabilityStartTime: format(parse(booking.availabilitySlot.startTime, 'HH:mm', new Date()), 'hh:mm a'),
    availabilityEndTime: format(parse(booking.availabilitySlot.endTime, 'HH:mm', new Date()), 'hh:mm a'),
    status: booking.status as "COMPLETED",
    review: booking.review
      ? {
          rating: booking.review.rating,
          comment: booking.review.comment ?? '',
        }
      : null,
  }));

  return {
    data,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};


//Create new review by booking Id
const createReview = async (studentId: string, payload: TCreateReviewBodyData) => {
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

        // Round average rating to 2 decimal places before saving
        const avgRating = stats._avg.rating ?? 0;
        const roundedAvg = Number(avgRating.toFixed(2));

        // tutor profile update
        await tx.tutorProfile.update({
          where: { id: booking.tutorProfileId },
          data: {
            rating: roundedAvg,
            totalReviews: stats._count.id || 0
          }
        });

        return newReview;
    });

    return result;
}

const getAllReviewStatsByTutorProfileId = async (tutorProfileId: string): Promise<TGetAllReviewStatsByTutorProfileIdResponse> => {
    const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
        select: {
            id: true,
            hourlyRate: true,
            rating: true,
            totalReviews: true,
            user: {
                select: {
                    name: true,
                    image: true,
                },
            },
        },
    });

    if (!tutorProfile) {
        throw new AppError("Tutor profile not found", 404);
    }

    const reviewGroups = await prisma.review.groupBy({
        by: ["rating"],
        where: { tutorProfileId },
        _count: { id: true },
    });

    const countMap = new Map<number, number>(
        reviewGroups.map((item) => [item.rating, item._count.id])
    );

    const totalReviews = reviewGroups.reduce((sum, item) => sum + item._count.id, 0);

    const buildBreakdown = (star: number) => {
        const count = countMap.get(star) ?? 0;
        const percentage = totalReviews > 0 ? Number(((count / totalReviews) * 100).toFixed(2)) : 0;

        return { count, percentage };
    };

    return {
        tutor: {
            profileId: tutorProfile.id,
            name: tutorProfile.user.name,
            avatar: tutorProfile.user.image ?? null,
            pricePerSession: tutorProfile.hourlyRate,
            averageRating: Number(tutorProfile.rating.toFixed(2)),
            totalReviewsCount: totalReviews,
        },
        ratingBreakdown: {
            fiveStars: buildBreakdown(5),
            fourStars: buildBreakdown(4),
            threeStars: buildBreakdown(3),
            twoStars: buildBreakdown(2),
            oneStars: buildBreakdown(1),
        },
    };
}

const getAllReviewByTutorProfileId = async (
    tutorProfileId: string,
    query: TGetAllReviewByTutorProfileIdQueryParams
): Promise<TGetAllReviewByTutorProfileIdResponse> => {
    const pageNumber = Number(query.page) || 1;
    const limitNumber = Number(query.limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const sortOrderMap: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
        'most-recent': { createdAt: 'desc' },
        'highest-rated': { rating: 'desc' },
        'lowest-rated': { rating: 'asc' },
    };

    const orderBy = sortOrderMap[query.sortOrder] ?? { createdAt: 'desc' };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { tutorProfileId },
            skip,
            take: limitNumber,
            orderBy,
            include: {
                user: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
            },
        }),
        prisma.review.count({ where: { tutorProfileId } }),
    ]);

    return {
        reviews: reviews.map((review) => ({
            id: review.id,
            studentName: review.user.name,
            studentAvatar: review.user.image ?? null,
            rating: review.rating,
            comment: review.comment ?? '',
            time: formatDistanceToNow(review.createdAt, { addSuffix: true }),
        })),
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
}

const reviewService = {
    getAllBookingWithReview,
    createReview,
    getAllReviewStatsByTutorProfileId,
    getAllReviewByTutorProfileId,
}


export default reviewService;
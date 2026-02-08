import { differenceInMinutes, parse } from "date-fns";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";


//Get all booking by author Id.
const getAllBookingByAuthorId = async () => {
    console.log("Get All Booking By Author Id Function from booking.service.ts")
}

//Create new booking
const createBooking = async (studentId: string, payload: any) => {
    const { tutorProfileId, date, startTime, endTime } = payload;
    const bookingDate = new Date(date);

    // find tutor to get hourly rate for price calculation
    const tutor = await prisma.tutorProfile.findUnique({
        where: { id: tutorProfileId },
        select: { hourlyRate: true }
    });

    if (!tutor) {
        throw new AppError("Tutor not found", 404, "NOT_FOUND");
    }

    // Dynamic price calculation logic
    // format startTime and endTime of 'HH:mm' to minute
    const start = parse(startTime, "HH:mm", new Date());
    const end = parse(endTime, "HH:mm", new Date());

    const totalMinutes = differenceInMinutes(end, start);

    if (totalMinutes <= 0) {
        throw new AppError("End time must be after start time", 400, "INVALID_TIME");
    }

    // Calculation (hourlyRate / 60) * total minute
    const calculatedPrice = (tutor.hourlyRate / 60) * totalMinutes;

    // To make decimal numbers look neat (for example: turning 12.505 into 12.51),
    const finalPrice = parseFloat(calculatedPrice.toFixed(2));

    return await prisma.$transaction(async (tx) => {
        // Check slot isExist or not
        const existingSlot = await tx.availabilitySlot.findFirst({
            where: { tutorProfileId, date: bookingDate, startTime, endTime }
        });

        if (existingSlot?.isBooked) {
            throw new AppError("This slot is already booked", 400, "SLOT_TAKEN");
        }

        // Slot make or update (isBooked = true)
        const slot = await tx.availabilitySlot.upsert({
            where: { id: existingSlot?.id || '00000000-0000-0000-0000-000000000000' },
            create: { tutorProfileId, date: bookingDate, startTime, endTime, isBooked: true },
            update: { isBooked: true }
        });

        // create final booking
        return await tx.booking.create({
            data: {
                studentId,
                tutorProfileId,
                availabilitySlotId: slot.id,
                price: finalPrice,
                status: 'PENDING'
            },
            include: {
                availabilitySlot: true,
                tutorProfile: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });
    });
}

// Update booking status as ’CANCELLED’ of your own bookings.
const updateBookingStatus = async () => {
    console.log("Update Booking Status Function from booking.service.ts")
}

const bookingService = {
    getAllBookingByAuthorId,
    createBooking,
    updateBookingStatus
}


export default bookingService;
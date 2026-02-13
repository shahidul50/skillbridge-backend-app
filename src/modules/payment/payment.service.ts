import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

//get payment account details 
const getAccountDetails = async () => {

    return await prisma.platformPaymentAccount.findFirst({
        where: { isActive: true },
        select: {
            method: true,
            accountNumber: true
        }
    });
}

const createPaymentAccountDetails = async (payload: any) => {
    const { method, accountNumber } = payload;

    // check account exist or not by this method and accountNumber
    const existingAccount = await prisma.platformPaymentAccount.findFirst({
        where: {
            method,
            accountNumber
        }
    });

    if (existingAccount) {
        throw new AppError("This payment account already exists", 400, "DUPLICATE_ACCOUNT");
    }

    //new account create
    return await prisma.platformPaymentAccount.create({
        data: {
            method,
            accountNumber
        }
    });
}



//Submit payment details (Transaction ID)
const submitPayment = async (studentId: string, payload: any) => {
    const { bookingId, paymentMethod, transactionId } = payload;

    //find booking in DB by booking ID
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
    });

    // checking booking isExist or not 
    if (!booking) {
        throw new AppError("Booking not found", 404, "NOT_FOUND");
    }
    // checking booking is own or not
    if (booking.studentId !== studentId) {
        throw new AppError("Unauthorized booking access", 403, "FORBIDDEN");
    }

    //check booking status cancelled or not
    if (booking.status === 'CANCELLED') {
        throw new AppError("Sorry, you can't pay because this booking was cancelled by you.", 403, "FORBIDDEN");
    }

    //checking 'PENDING' or not
    if (booking.status !== "PENDING") {
        throw new AppError("Sorry, this booking is already paid", 403, "FORBIDDEN");
    }

    // create payment record
    return await prisma.$transaction(async (tx) => {
        // check transaction ID unique or not
        const existingPayment = await tx.payment.findUnique({
            where: { transactionId }
        });

        if (existingPayment) {
            throw new AppError("This Transaction ID has already been used", 400, "DUPLICATE_TRANSACTION");
        }

        //finally create new payment by booking ID
        const payment = await tx.payment.create({
            data: {
                bookingId,
                studentId,
                paymentMethod,
                transactionId,
                amount: booking.price,
                status: "PENDING",
            },
        });

        return payment;
    });
}


const paymentService = {
    submitPayment,
    getAccountDetails,
    createPaymentAccountDetails
}


export default paymentService;


//Get all booking by author Id.
const getAllBookingByAuthorId = async () => {
    console.log("Get All Booking By Author Id Function from booking.service.ts")
}

//Create new booking
const createBooking = async () => {
    console.log("Create Booking Function from booking.service.ts")
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
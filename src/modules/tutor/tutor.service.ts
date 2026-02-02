//get all tutors with pagination, search and filtering.
const getAllTutors = async () => {
    console.log("Get All Tutors Function from tutor.service.ts")
}

//get all tutor by id with tutor profile, review, availability.
const getTutorById = async () => {
    console.log("Get Tutor By Id Function from tutor.service.ts")
}

//update tutor profile
const updateTutor = async () => {
    console.log("Update Tutor Function from tutor.service.ts")
}

//Get All teaching sessions by tutor.
const getTutorAllSession = async () => {
    console.log("Get Tutor All Session Function from tutor.service.ts")
}

//Update booking status as 'COMPLETED' when it is complete by own session.
const updateBookingStatus = async () => {
    console.log("Update Booking Status Function from tutor.service.ts")
}

//Create weekly availability slot.
const createTutorAvailableSlot = async () => {
    console.log("Create Tutor Available Slot Function from tutor.service.ts")
}

//delete weekly availability slot.
const deleteTutorAvailableSlot = async () => {
    console.log("Delete Tutor Available Slot Function from tutor.service.ts")
}

//create exception on a special day.
const createTutorException = async () => {
    console.log("Create Tutor Exception Function from tutor.service.ts")
}



const tutorService = {
    getAllTutors,
    getTutorById,
    updateTutor,
    getTutorAllSession,
    updateBookingStatus,
    createTutorAvailableSlot,
    deleteTutorAvailableSlot,
    createTutorException
}


export default tutorService;
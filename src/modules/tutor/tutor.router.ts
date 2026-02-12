import { Router } from "express";
import tutorController from "./tutor.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";
import uploadHandler from "../../middleware/uploadHandler";

const router = Router();

//  / route for getting categories
router.get('/', tutorController.getAllTutors);

//  /sessions route for getting all teaching sessions by tutor
router.get('/sessions', auth(UserRole.TUTOR), tutorController.getTutorAllSession);

//  /available-slot route for getting available slots
router.get('/available-slots', tutorController.getAvailableSlots);

//  /:id route for getting tutor by id
router.get('/:id', tutorController.getTutorProfileById);

//  /add-categories route for creating tutors categories
router.post('/add-categories', auth(UserRole.TUTOR), tutorController.setTutorCategories);

//  /weekly-available route for creating weekly availability slot
router.post('/weekly-available', auth(UserRole.TUTOR), tutorController.createTutorWeeklyAvailability);

//  /exception route for creating exception on a special day
router.post('/exception', auth(UserRole.TUTOR), tutorController.createTutorException);

//  /session/:bookingId route for updating session status to 'COMPLETED'
router.patch('/sessions/:bookingId', auth(UserRole.TUTOR), tutorController.updateBookingStatus);

//  / route for updating tutor information
router.put('/', auth(UserRole.TUTOR), uploadHandler.single('avatar'), tutorController.updateTutorProfile);

//  /weekly-available/:id route for deleting single weekly availability slot
router.delete('/weekly-available/:id', auth(UserRole.TUTOR), tutorController.deleteTutorWeeklyAvailability);



export const tutorRouter: Router = router;
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

//  /weekly-available-slots route for get all weekly available slot
router.get('/weekly-available-slots', auth(UserRole.TUTOR), tutorController.getTutorWeeklyAvailableSlots);

//  /profile route for getting tutor details by userId
router.get('/profile', auth(UserRole.TUTOR), tutorController.getTutorProfileByUserId);

//  /categories route for getting tutor selected categories
router.get('/my-categories', auth(UserRole.TUTOR), tutorController.getTutorSelectedCategories);

//  /add-categories route for creating tutors categories
router.post('/add-categories', auth(UserRole.TUTOR), tutorController.setTutorCategories);

//  /weekly-available-slots route for create weekly availability slot
router.post('/weekly-available-slots', auth(UserRole.TUTOR), tutorController.createTutorWeeklyAvailableSlots);

//  /exception route for getting all tutor availability exceptions
router.get('/exception', auth(UserRole.TUTOR), tutorController.getAllTutorException);

//  /:profileId route for getting tutor details by tutorProfileId
router.get('/:profileId', tutorController.getTutorProfileByProfileId);

//  /exception route for create exception on a special day
router.post('/exception', auth(UserRole.TUTOR), tutorController.createTutorException);

//  /session/:bookingId route for update session status to 'COMPLETED'
router.patch('/sessions/:bookingId', auth(UserRole.TUTOR), tutorController.updateBookingStatus);

//  / route for update tutor information
router.put('/', auth(UserRole.TUTOR), uploadHandler.single('avatar'), tutorController.updateTutorProfile);

//  /weekly-available-slots/:id route for update single weekly availability slot
router.patch('/weekly-available-slots/:id', auth(UserRole.TUTOR), tutorController.updateTutorWeeklyAvailableSlots);

//  /weekly-available-slots/:id route for delete single weekly availability slot
router.delete('/weekly-available-slots/:id', auth(UserRole.TUTOR), tutorController.deleteTutorWeeklyAvailableSlots);

//  /exception/:id route for delete single tutor availability exception
router.delete('/exception/:id', auth(UserRole.TUTOR), tutorController.deleteTutorException);

export const tutorRouter: Router = router;
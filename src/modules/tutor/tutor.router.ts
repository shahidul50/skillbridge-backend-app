import { Router } from "express";
import tutorController from "./tutor.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";
import uploadHandler from "../../middleware/uploadHandler";

const router = Router();

//  / route for getting categories
router.get('/', tutorController.getAllTutors);

//  /sessions route for getting all teaching sessions by tutor
router.get('/sessions', tutorController.getTutorAllSession);

//  /:id route for getting tutor by id
router.get('/:id', tutorController.getTutorById);

router.post('/add-categories', auth(UserRole.TUTOR), tutorController.setTutorCategories);

//  /available-slot route for creating weekly availability slot
router.post('/available-slot', tutorController.createTutorAvailableSlot);

//  /exception route for creating exception on a special day
router.post('/exception', auth(UserRole.TUTOR), tutorController.createTutorException);

//  /session/:bookingId route for updating session status to 'COMPLETED'
router.patch('/sessions/:bookingId', tutorController.updateBookingStatus);

//  / route for updating tutor information
router.put('/', auth(UserRole.TUTOR), uploadHandler.single('avatar'), tutorController.updateTutorProfile);

//  /available-slot/:id route for deleting weekly availability slot
router.delete('/available-slot/:id', tutorController.deleteTutorAvailableSlot);



export const tutorRouter: Router = router;
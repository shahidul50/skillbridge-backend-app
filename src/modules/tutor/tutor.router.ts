import { Router } from "express";
import tutorController from "./tutor.controller";

const router = Router();

//  / route for getting categories
router.get('/', tutorController.getAllTutors);

//  /sessions route for getting all teaching sessions by tutor
router.get('/sessions', tutorController.getTutorAllSession);

//  /:id route for getting tutor by id
router.get('/:id', tutorController.getTutorById);

//  /available-slot route for creating weekly availability slot
router.post('/available-slot', tutorController.createTutorAvailableSlot);

//  /exception route for creating exception on a special day
router.post('/exception', tutorController.createTutorException);

//  /session/:bookingId route for updating session status to 'COMPLETED'
router.patch('/sessions/:bookingId', tutorController.updateBookingStatus);

//  / route for updating tutor information
router.put('/', tutorController.updateTutor);

//  /available-slot/:id route for deleting weekly availability slot
router.delete('/available-slot/:id', tutorController.deleteTutorAvailableSlot);



export const tutorRouter: Router = router;
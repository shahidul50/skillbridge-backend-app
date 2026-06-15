import { Router } from "express";
import tutorController from "./tutor.controller";
import auth, { UserRole } from "../../middleware/authMiddleware";
import uploadHandler from "../../middleware/uploadHandler";

const router = Router();

//this route: localhost:5000/api/v1/tutor
/**
 * localhost:5000/api/v1/tutor = (GET)get all tutors for public tutor page.
 * localhost:5000/api/v1/tutor/available-slots = (GET)get available slots by tutorProfileId for public tutor profile page.
 * localhost:5000/api/v1/tutor/:profileId = (GET)get tutor details(user + tutor profile + tutor categories + recent 5 tutor reviews) by tutorProfileId for public tutor profile page.
 * 
 * localhost:5000/api/v1/tutor/profile = (GET)get tutor details by userId for tutor dashboard.
 * localhost:5000/api/v1/tutor/profile = (PUT)update tutor profile info for tutor dashboard
 * 
 * localhost:5000/api/v1/tutor/categories = (GET)get tutor categories for tutor dashboard.
 * localhost:5000/api/v1/tutor/categories = (POST)create tutor categories for tutor dashboard.
 * 
 * localhost:5000/api/v1/tutor/weekly-available-slots = (GET)get all weekly available slot for tutor dashboard.
 * localhost:5000/api/v1/tutor/weekly-available-slots = (POST)create weekly availability slot for tutor dashboard.
 * localhost:5000/api/v1/tutor/weekly-available-slots/:id = (PATCH)update single weekly availability slot for tutor dashboard
 * localhost:5000/api/v1/tutor/weekly-available-slots/:id = (DELETE)delete single weekly availability slot for tutor dashboard
 * 
 * localhost:5000/api/v1/tutor/exceptions = (GET)get all tutor availability exceptions for tutor dashboard.
 * localhost:5000/api/v1/tutor/exceptions = (POST)create exception on a special day for tutor dashboard.
 * localhost:5000/api/v1/tutor/exceptions/:id = (DELETE)delete single tutor availability exception for tutor dashboard
 * 
 * localhost:5000/api/v1/tutor/sessions = (GET)get all booking by tutor for tutor dashboard.
 * localhost:5000/api/v1/tutor/sessions/:bookingId = (PUT)update session mettingLink and status to 'COMPLETED' for tutor dashboard
 * localhost:5000/api/v1/tutor/sessions-details/:bookingId = (GET)get single session details by bookingId for tutor dashboard
 * 
 * localhost:5000/api/v1/tutor/dashboard/meta = (GET)get tutor dashboard meta data for tutor dashboard
 * localhost:5000/api/v1/tutor/dashboard/revenue-trends = (GET)get tutor dashboard revenue data for tutor dashboard
 * 
 * localhost:5000/api/v1/tutor/schedule/meta = (GET)get tutor schedule meta info for tutor dashboard
 * localhost:5000/api/v1/tutor/schedule/events = (GET)get tutor schedule events info for tutor dashboard
 */

//  "/" route is getting all tutors for public tutor page.
router.get('/', tutorController.getAllTutors);

//  "/available-slot" route is getting available slots for public tutor profile page.
router.get('/available-slots', tutorController.getAvailableSlots);

//  /weekly-available-slots route is getting all weekly available slot for tutor dashboard.
router.get('/weekly-available-slots', auth(UserRole.TUTOR), tutorController.getTutorWeeklyAvailableSlots);

//  /profile route is getting tutor details by userId for tutor dashboard.
router.get('/profile', auth(UserRole.TUTOR), tutorController.getTutorProfileByUserId);

//  /my-categories route is getting tutor selected categories for tutor dashboard.
router.get('/categories', auth(UserRole.TUTOR), tutorController.getTutorSelectedCategories);

//  /exception route is getting all tutor availability exceptions for tutor dashboard.
router.get('/exceptions', auth(UserRole.TUTOR), tutorController.getAllTutorException);

//  "/sessions" route is getting all booking by tutor for tutor dashboard. 
router.get('/sessions', auth(UserRole.TUTOR), tutorController.getTutorAllSession);

//  "/dashboard/meta" route is getting tutor dashboard data for tutor dashboard 
router.get('/dashboard/meta', auth(UserRole.TUTOR), tutorController.getDashboardMeta);

//  "/dashboard/revenue-trends" route is getting tutor revenue trends for tutor dashboard 
router.get('/dashboard/revenue-trends', auth(UserRole.TUTOR), tutorController.getDashboardRevenueTrends);

//  "/schedule/meta" route is getting tutor schedule info for tutor dashboard 
router.get('/schedule/meta', auth(UserRole.TUTOR), tutorController.getTutorScheduleMeta);

//  "/schedule/events" route is getting tutor schedule events for tutor dashboard 
router.get('/schedule/events', auth(UserRole.TUTOR), tutorController.getTutorScheduleEvents);

//  "/session-details/:bookingId" route is getting booking and student review by bookingId for tutor dashboard 
router.get('/session-details/:bookingId', auth(UserRole.TUTOR), tutorController.getSessionDetailsByBookingId);

//  /:profileId route is getting tutor details by tutorProfileId for public tutor profile page.
router.get('/:profileId', tutorController.getTutorProfileByProfileId);

//  /add-categories route is creating tutor categories for tutor dashboard.
router.post('/categories', auth(UserRole.TUTOR), tutorController.setTutorCategories);

//  /weekly-available-slots route is creating weekly availability slot for tutor dashboard.
router.post('/weekly-available-slots', auth(UserRole.TUTOR), tutorController.createTutorWeeklyAvailableSlots);

//  /exception route is creating exception on a special day for tutor dashboard.
router.post('/exceptions', auth(UserRole.TUTOR), tutorController.createTutorException);

//  /session/:bookingId route is updating session status to 'COMPLETED' for tutor dashboard
router.put('/sessions/:bookingId', auth(UserRole.TUTOR), tutorController.updateBookingStatusOrMeetingLink);

//  / route is updating tutor profile info for tutor dashboard
router.put('/profile', auth(UserRole.TUTOR), uploadHandler.single('avatar'), tutorController.updateTutorProfile);

//  /weekly-available-slots/:id route is updating single weekly availability slot for tutor dashboard
router.patch('/weekly-available-slots/:id', auth(UserRole.TUTOR), tutorController.updateTutorWeeklyAvailableSlots);

//  /weekly-available-slots/:id route is deleting single weekly availability slot for tutor dashboard
router.delete('/weekly-available-slots/:id', auth(UserRole.TUTOR), tutorController.deleteTutorWeeklyAvailableSlots);

//  /exception/:id route is deleting single tutor availability exception for tutor dashboard
router.delete('/exceptions/:id', auth(UserRole.TUTOR), tutorController.deleteTutorException);

export const tutorRouter: Router = router;
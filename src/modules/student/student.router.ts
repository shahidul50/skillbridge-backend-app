import { Router } from "express";
import auth, { UserRole } from "../../middleware/authMiddleware";
import studentController from "./student.controller";

const router = Router();

//  "/dashboard/meta" route is for getting meta data for student dashboard
router.get('/dashboard/meta', auth(UserRole.STUDENT), studentController.getDashboardMetaData);

//  "/dashboard/upcoming-sessions" route is for getting upcoming sessions for student dashboard
router.get('/dashboard/upcoming-sessions', auth(UserRole.STUDENT), studentController.getDashboardUpcomingSessions);

//  "/dashboard/recent-bookings" route is for getting recent bookings for student dashboard
router.get('/dashboard/recent-bookings', auth(UserRole.STUDENT), studentController.getDashboardRecentBookings);

//  "/schedule/meta" route is for getting schedule meta data for student dashboard
router.get('/schedule/meta', auth(UserRole.STUDENT), studentController.getScheduleMetaData);

//  "/schedule/events" route is for getting schedule events data for student dashboard
router.get('/schedule/events', auth(UserRole.STUDENT), studentController.getScheduleCalendarEvents);




export const studentRouter: Router = router;
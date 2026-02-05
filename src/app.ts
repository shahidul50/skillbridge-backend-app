import express, { Application } from 'express';
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import NotFound from './middleware/notFound';
import errorHandler from './middleware/globalErrorHandler';
import { categoryRouter } from './modules/category/category.router';
import { tutorRouter } from './modules/tutor/tutor.router';
import { bookingRouter } from './modules/booking/booking.router';
import { reviewRouter } from './modules/review/review.router';
const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.APP_URL,
        credentials: true,
    })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.get('/', (req, res) => {
    res.send('Welcome to SkillBridge Backend App');
});

app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/tutors', tutorRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

app.use(NotFound);
app.use(errorHandler)

export default app;
import { Router } from "express";
import { contactController } from "./contact.controller";

const router = Router();

//  / route for creating contact message
router.post('/', contactController.createContactMessage);



export const contactRouter: Router = router;
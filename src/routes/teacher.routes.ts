import { Router } from "express";
import { TeacherController } from "../controllers/TeacherController";
import { TeacherService } from "../services/TeacherService";
import { TeacherRepository } from "../repositories/TeacherRepository";
import { authMiddleware, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// Dependency Injection
const teacherRepository = new TeacherRepository();
const teacherService = new TeacherService(teacherRepository);
const teacherController = new TeacherController(teacherService);

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Routes
router.get("/", teacherController.getAllTeachers);
router.get("/:id", teacherController.getTeacherById);
router.get("/:id/scenarios/:scenarioId", teacherController.getTeacherScenario);

export default router;


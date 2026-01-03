import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { TeacherRepository } from "../repositories/TeacherRepository";

const router = Router();

// Dependency Injection
const teacherRepository = new TeacherRepository();
const authService = new AuthService(teacherRepository);
const authController = new AuthController(authService);

router.post("/login", authController.login);

export default router;










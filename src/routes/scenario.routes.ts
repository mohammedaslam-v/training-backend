import { Router } from "express";
import { ScenarioController } from "../controllers/ScenarioController";
import { ScenarioService } from "../services/ScenarioService";
import { ScenarioRepository } from "../repositories/ScenarioRepository";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Initialize dependencies
const scenarioRepository = new ScenarioRepository();
const scenarioService = new ScenarioService(scenarioRepository);
const scenarioController = new ScenarioController(scenarioService);

// All routes require authentication
router.use(authMiddleware);

// Routes
router.post("/submit", scenarioController.submitScenario);
router.get("/", scenarioController.getScenarios);
router.get("/:scenarioId/access", scenarioController.checkAccess);
router.put("/:id/status", scenarioController.updateScenarioStatus);

export default router;


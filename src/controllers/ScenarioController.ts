import { Response } from "express";
import { ScenarioService, ScenarioProgress } from "../services/ScenarioService";
import { AuthRequest } from "../middlewares/auth.middleware";
import { SCENARIO_CONFIG } from "../config/scenarioConfig";

export class ScenarioController {
    constructor(private scenarioService: ScenarioService) {}

    submitScenario = async (req: AuthRequest, res: Response) => {
        try {
            const teacherId = req.user?.id;
            if (!teacherId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const { sessionId, scenarioId, score } = req.body;

            if (!sessionId || !scenarioId) {
                return res.status(400).json({
                    success: false,
                    message: "sessionId and scenarioId are required"
                });
            }

            // Check if user can access this scenario
            // TypeScript workaround: method exists but language server cache may not recognize it
            const accessCheck = await (this.scenarioService as any).canAccessScenario(teacherId, scenarioId);
            if (!accessCheck.canAccess) {
                return res.status(403).json({
                    success: false,
                    message: accessCheck.reason || "Cannot access this scenario yet"
                });
            }

            const result = await this.scenarioService.submitScenarioAttempt(teacherId, {
                sessionId,
                scenarioId,
                score
            });

            res.json({
                success: true,
                score: result.score, // Return actual score (can be null, 0, or any number)
                attempt: result
            });
        } catch (error: any) {
            console.error("Error submitting scenario:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to submit scenario"
            });
        }
    };

    getScenarios = async (req: AuthRequest, res: Response) => {
        try {
            const teacherId = req.user?.id;
            if (!teacherId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            // Get teacher's progress
            const progress: ScenarioProgress[] = await this.scenarioService.getTeacherScenarios(teacherId);

            // Use scenario config
            const allScenarios = SCENARIO_CONFIG;

            // Merge scenarios with progress
            const scenariosWithProgress = allScenarios.map(scenario => {
                const progressData = progress.find((p: ScenarioProgress) => p.scenarioId === scenario.id);
                // TypeScript workaround: properties exist but language server cache may not recognize them
                const progressDataTyped = progressData as ScenarioProgress & { 
                    completedAttempts: number; 
                    requiredAttempts: number; 
                    isLocked?: boolean;
                };
                const completedAttempts = progressDataTyped ? progressDataTyped.completedAttempts : 0;
                const requiredAttempts = progressDataTyped ? progressDataTyped.requiredAttempts : scenario.requiredAttempts;
                
                // Use the isLocked value from service (which implements the correct locking logic)
                // If no progress data exists, determine lock state based on scenario order
                let isLocked = false;
                if (progressDataTyped) {
                    // Use the isLocked value from service
                    isLocked = progressDataTyped.isLocked ?? false;
                } else {
                    // If no progress data, first scenario is unlocked, others are locked
                    isLocked = scenario.id === "1" ? false : true;
                }
                
                const status = progressDataTyped ? progressDataTyped.status : "NOT_STARTED";
                const score = progressDataTyped ? progressDataTyped.score : null;
                
                return {
                    id: scenario.id,
                    title: scenario.title,
                    description: scenario.description,
                    difficulty: scenario.difficulty,
                    toughTongueId: scenario.toughTongueId,
                    customEmbedUrl: scenario.customEmbedUrl,
                    status: status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
                    score: score,
                    completedAttempts: completedAttempts,
                    requiredAttempts: requiredAttempts,
                    isLocked: isLocked
                };
            });

            res.json({
                success: true,
                scenarios: scenariosWithProgress
            });
        } catch (error: any) {
            console.error("Error fetching scenarios:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch scenarios"
            });
        }
    };

    updateScenarioStatus = async (req: AuthRequest, res: Response) => {
        try {
            const teacherId = req.user?.id;
            if (!teacherId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            const { id: scenarioId } = req.params;
            const { status } = req.body;

            if (!scenarioId || !status) {
                return res.status(400).json({
                    success: false,
                    message: "scenarioId and status are required"
                });
            }

            if (!["NOT_STARTED", "COMPLETED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be NOT_STARTED or COMPLETED"
                });
            }

            const result = await this.scenarioService.updateScenarioStatus(
                teacherId,
                scenarioId,
                status
            );

            res.json({
                success: true,
                attempt: result
            });
        } catch (error: any) {
            console.error("Error updating scenario status:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to update scenario status"
            });
        }
    };

    checkAccess = async (req: AuthRequest, res: Response) => {
        try {
            const teacherId = req.user?.id;
            const { scenarioId } = req.params;

            if (!teacherId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                });
            }

            // TypeScript workaround: method exists but language server cache may not recognize it
            const accessCheck = await (this.scenarioService as any).canAccessScenario(teacherId, scenarioId);
            res.json({
                success: true,
                canAccess: accessCheck.canAccess,
                reason: accessCheck.reason
            });
        } catch (error: any) {
            console.error("Error checking access:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to check access"
            });
        }
    };
}


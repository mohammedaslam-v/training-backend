import { Response } from "express";
import { ScenarioService } from "../services/ScenarioService";
import { AuthRequest } from "../middlewares/auth.middleware";

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

            const result = await this.scenarioService.submitScenarioAttempt(teacherId, {
                sessionId,
                scenarioId,
                score
            });

            res.json({
                success: true,
                score: result.score || 85, // Default score if not provided
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
            const progress = await this.scenarioService.getTeacherScenarios(teacherId);

            // Define all available scenarios
            const allScenarios = [
                {
                    id: "1",
                    title: "PTM Assessment: Handling Parent Concerns",
                    description: "Navigate a challenging Parent-Teacher Meeting where a parent is concerned about their child's progress. Practice active listening and evidence-based feedback.",
                    difficulty: "Intermediate",
                    toughTongueId: "693877e7b8892d3f7b91eb31",
                    customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/693877e7b8892d3f7b91eb31?skipPrecheck=true"
                },
                {
                    id: "2",
                    title: "PTM Coach: Framework Mastery",
                    description: "Master the structural framework for conducting effective PTMs. Focus on the \"Sandwich Method\" of feedback and setting actionable goals.",
                    difficulty: "Advanced",
                    toughTongueId: "6939d23e07d90d92fea80199",
                    customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/6939d23e07d90d92fea80199?skipPrecheck=true"
                },
                {
                    id: "3",
                    title: "Renewal Roleplay: Hesitant Parent (English Communication)",
                    description: "Roleplay a renewal conversation with a parent hesitant due to perceived lack of improvement in English communication skills. Address objections convincingly.",
                    difficulty: "Advanced",
                    toughTongueId: "693a7c1507d90d92fea80744",
                    customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/693a7c1507d90d92fea80744?skipPrecheck=true"
                },
                {
                    id: "4",
                    title: "Coach: The Perfect Renewal Call",
                    description: "Learn the best practices for a renewal call. Focus on value proposition, celebrating student wins, and closing the renewal effectively.",
                    difficulty: "Intermediate",
                    toughTongueId: "6942c17a25f8fcc9bc250d03",
                    customEmbedUrl: "https://bambinos.app.toughtongueai.com/embed/6942c17a25f8fcc9bc250d03?skipPrecheck=true"
                }
            ];

            // Merge scenarios with progress
            const scenariosWithProgress = allScenarios.map(scenario => {
                const progressData = progress.find(p => p.scenarioId === scenario.id);
                return {
                    ...scenario,
                    status: progressData?.status || "NOT_STARTED",
                    score: progressData?.score || null
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

            if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be NOT_STARTED, IN_PROGRESS, or COMPLETED"
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
}


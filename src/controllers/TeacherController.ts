import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { TeacherService } from "../services/TeacherService";

export class TeacherController {
    constructor(private teacherService: TeacherService) {}

    getAllTeachers = async (req: AuthRequest, res: Response) => {
        try {
            const teachers = await this.teacherService.getAllTeachers();
            
            return res.status(200).json({
                success: true,
                data: teachers
            });
        } catch (error: any) {
            console.error("Error fetching teachers:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch teachers"
            });
        }
    };

    getTeacherById = async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const teacherId = parseInt(id, 10);

            if (isNaN(teacherId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid teacher ID"
                });
            }

            const teacher = await this.teacherService.getTeacherById(teacherId);

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: "Teacher not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: teacher
            });
        } catch (error: any) {
            console.error("Error fetching teacher:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch teacher"
            });
        }
    };

    getTeacherScenario = async (req: AuthRequest, res: Response) => {
        try {
            const { id, scenarioId } = req.params;
            const teacherId = parseInt(id, 10);

            if (isNaN(teacherId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid teacher ID"
                });
            }

            if (!scenarioId) {
                return res.status(400).json({
                    success: false,
                    message: "Scenario ID is required"
                });
            }

            const attempt = await this.teacherService.getTeacherScenario(teacherId, scenarioId);

            if (!attempt) {
                return res.status(404).json({
                    success: false,
                    message: "Scenario attempt not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    id: attempt.id,
                    scenarioId: attempt.scenario_id,
                    status: attempt.status,
                    score: attempt.score,
                    session_id: attempt.session_id,
                    evaluation: attempt.evaluation,
                    created_at: attempt.created_at.toISOString(),
                    updated_at: attempt.updated_at.toISOString()
                }
            });
        } catch (error: any) {
            console.error("Error fetching scenario:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch scenario"
            });
        }
    };
}




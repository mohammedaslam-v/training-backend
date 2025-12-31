import { IScenarioRepository } from "../repositories/ScenarioRepository";

export interface SubmitScenarioDTO {
    sessionId: string;
    scenarioId: string;
    score?: number;
}

export interface ScenarioProgress {
    scenarioId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    score?: number | null;
}

export class ScenarioService {
    constructor(private scenarioRepository: IScenarioRepository) {}

    async submitScenarioAttempt(teacherId: number, data: SubmitScenarioDTO): Promise<ScenarioProgress> {
        const attempt = await this.scenarioRepository.createOrUpdateAttempt({
            teacher_id: teacherId,
            scenario_id: data.scenarioId,
            status: "COMPLETED",
            score: data.score || null,
            session_id: data.sessionId
        });

        return {
            scenarioId: attempt.scenario_id,
            status: attempt.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
            score: attempt.score
        };
    }

    async updateScenarioStatus(
        teacherId: number,
        scenarioId: string,
        status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
    ): Promise<ScenarioProgress> {
        const attempt = await this.scenarioRepository.createOrUpdateAttempt({
            teacher_id: teacherId,
            scenario_id: scenarioId,
            status: status
        });

        return {
            scenarioId: attempt.scenario_id,
            status: attempt.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
            score: attempt.score
        };
    }

    async getTeacherScenarios(teacherId: number): Promise<ScenarioProgress[]> {
        const attempts = await this.scenarioRepository.findTeacherAttempts(teacherId);
        
        return attempts.map(attempt => ({
            scenarioId: attempt.scenario_id,
            status: attempt.status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
            score: attempt.score
        }));
    }
}


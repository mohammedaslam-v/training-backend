import { IScenarioRepository } from "../repositories/ScenarioRepository";
import { ToughTongueService } from "./ToughTongueService";

export interface SubmitScenarioDTO {
    sessionId: string;
    scenarioId: string;
    score?: number;
    evaluation?: Record<string, any>;
}

export interface ScenarioProgress {
    scenarioId: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    score?: number | null;
}

export class ScenarioService {
    private toughTongueService: ToughTongueService;

    constructor(private scenarioRepository: IScenarioRepository) {
        this.toughTongueService = new ToughTongueService();
    }

    async submitScenarioAttempt(teacherId: number, data: SubmitScenarioDTO): Promise<ScenarioProgress> {
        let finalScore = data.score || null;
        let evaluation: Record<string, any> | null = null;
        let validSessionId: string | null = null; // Only store valid session IDs

        // After onSubmit, poll until evaluation results are ready
        if (data.sessionId) {
            try {
                console.log(`🔄 ScenarioService: Fetching evaluation results for session: ${data.sessionId}`);
                
                // Poll until evaluation_results are available (not just status = completed)
                const sessionData = await this.toughTongueService.pollUntilEvaluationReady(data.sessionId);
                
                // Session exists and is valid - store the sessionId
                validSessionId = data.sessionId;
                
                // Parse evaluation data
                const parsed = this.toughTongueService.parseEvaluationData(sessionData);
                finalScore = parsed.score || finalScore;
                evaluation = parsed.evaluation;

                // Log evaluation data
                console.log('🎯 ScenarioService: Tough Tongue Evaluation Results:');
                console.log('   📊 Final Score:', finalScore);
                console.log('   📝 Has Evaluation:', !!evaluation && Object.keys(evaluation).length > 0);
                if (evaluation?.strengths) console.log('   💪 Strengths:', evaluation.strengths);
                if (evaluation?.weaknesses) console.log('   ⚠️  Weaknesses:', evaluation.weaknesses);
            } catch (error: any) {
                console.error('❌ ScenarioService: Error fetching from Tough Tongue:', error);
                
                // Check if session doesn't exist (404 error)
                if (error?.message?.includes('Session not found') || 
                    error?.response?.status === 404) {
                    console.warn(`⚠️  Session ${data.sessionId} not found in Tough Tongue. Not storing invalid sessionId.`);
                    // validSessionId remains null - don't store invalid reference
                } else {
                    // For other errors (timeout, network, etc.), we might want to store it
                    // but mark it as unvalidated. For now, we'll not store it to maintain data integrity.
                    console.warn('⚠️  Failed to validate session. Not storing sessionId to maintain data integrity.');
                }
                
                // Continue with provided score if API call fails
                console.warn('⚠️  Continuing with provided score:', finalScore);
            }
        }

        // Store in database - only store valid sessionId (or null if invalid/missing)
        const attempt = await this.scenarioRepository.createOrUpdateAttempt({
            teacher_id: teacherId,
            scenario_id: data.scenarioId,
            status: "COMPLETED",
            score: finalScore,
            session_id: validSessionId, // Only valid sessionId or null
            evaluation: evaluation || data.evaluation || null
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


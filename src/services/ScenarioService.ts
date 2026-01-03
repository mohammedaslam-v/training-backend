import { IScenarioRepository } from "../repositories/ScenarioRepository";
import { ToughTongueService } from "./ToughTongueService";
import { getRequiredAttempts, getAllScenariosInOrder, getScenarioConfigById } from "../config/scenarioConfig";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

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
    completedAttempts: number;
    requiredAttempts: number;
    currentAttemptNumber?: number;
    isLocked?: boolean; // For sequential flow
}

export class ScenarioService {
    private toughTongueService: ToughTongueService;

    constructor(private scenarioRepository: IScenarioRepository) {
        this.toughTongueService = new ToughTongueService();
    }

    async submitScenarioAttempt(teacherId: number, data: SubmitScenarioDTO): Promise<ScenarioProgress> {
        let finalScore = data.score || null;
        let evaluation: Record<string, any> | null = null;
        let validSessionId: string | null = null;

        // Fetch evaluation from Tough Tongue
        if (data.sessionId) {
            try {
                console.log(`🔄 ScenarioService: Fetching evaluation results for session: ${data.sessionId}`);
                const sessionData = await this.toughTongueService.pollUntilEvaluationReady(data.sessionId);
                validSessionId = data.sessionId;
                const parsed = this.toughTongueService.parseEvaluationData(sessionData);
                finalScore = parsed.score || finalScore;
                evaluation = parsed.evaluation;
            } catch (error: any) {
                console.error('❌ ScenarioService: Error fetching from Tough Tongue:', error);
            }
        }

        // Get next attempt number
        const attemptNumber = await this.scenarioRepository.getNextAttemptNumber(teacherId, data.scenarioId);
        const requiredAttempts = getRequiredAttempts(data.scenarioId);

        // Create new attempt
        const attempt = await this.scenarioRepository.createAttempt({
            teacher_id: teacherId,
            scenario_id: data.scenarioId,
            attempt_number: attemptNumber,
            status: "COMPLETED",
            score: finalScore,
            session_id: validSessionId,
            evaluation: evaluation || data.evaluation || null
        });

        const completedAttempts = await this.scenarioRepository.countCompletedAttempts(teacherId, data.scenarioId);
        const isFullyCompleted = completedAttempts >= requiredAttempts;

        return {
            scenarioId: attempt.scenario_id,
            status: isFullyCompleted ? "COMPLETED" : "IN_PROGRESS",
            score: attempt.score,
            completedAttempts,
            requiredAttempts,
            currentAttemptNumber: attempt.attempt_number
        };
    }

    async getTeacherScenarios(teacherId: number): Promise<ScenarioProgress[]> {
        const allScenarios = getAllScenariosInOrder();
        const attempts = await this.scenarioRepository.findTeacherAttempts(teacherId);
        
        // Group attempts by scenario ID
        const attemptsByScenario = new Map<string, ScenarioAttempt[]>();
        attempts.forEach(attempt => {
            const key = attempt.scenario_id;
            if (!attemptsByScenario.has(key)) {
                attemptsByScenario.set(key, []);
            }
            attemptsByScenario.get(key)!.push(attempt);
        });

        // Get completion counts for all scenarios
        const scenario1Attempts = attemptsByScenario.get("1") || [];
        const scenario1Completed = scenario1Attempts.filter(a => a.status === "COMPLETED").length;
        
        const scenario2Attempts = attemptsByScenario.get("4") || []; // ID "4" is Renewal Call
        const scenario2Completed = scenario2Attempts.filter(a => a.status === "COMPLETED").length;
        
        const scenario3Attempts = attemptsByScenario.get("2") || []; // ID "2" is Framework
        const scenario3Completed = scenario3Attempts.filter(a => a.status === "COMPLETED").length;
        
        const scenario4Attempts = attemptsByScenario.get("3") || []; // ID "3" is Roleplay
        const scenario4Completed = scenario4Attempts.filter(a => a.status === "COMPLETED").length;

        // Build progress for each unique scenario
        const scenarioProgressMap = new Map<string, ScenarioProgress>();
        
        // Process each scenario to determine locking and status
        allScenarios.forEach((scenario, index) => {
            const scenarioAttempts = attemptsByScenario.get(scenario.id) || [];
            const completedAttempts = scenarioAttempts.filter(a => a.status === "COMPLETED").length;
            const requiredAttempts = getRequiredAttempts(scenario.id);
            
            // Calculate average score
            const avgScore = scenarioAttempts.length > 0 
                ? Math.round(scenarioAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / scenarioAttempts.length)
                : null;
            
            // Check if fully completed
            const isFullyCompleted = completedAttempts >= requiredAttempts;
            
            // Determine locking based on user's requirements:
            // 1. Scenario 1: After 1 attempt → lock it, unlock Scenario 2
            // 2. Scenario 2: After 2 attempts → lock it, unlock Scenario 3
            // 3. Scenario 3: After 2 attempts → lock it, unlock Scenario 4
            // 4. Scenario 4: After 2 attempts → unlock Scenario 1 again (final flow)
            let isLocked = false;
            
            if (scenario.id === "1") {
                // Scenario 1: Lock after 1 attempt, unlock again after Scenario 4 completes 2 attempts
                if (scenario4Completed >= 2) {
                    // Scenario 4 is done, unlock Scenario 1 for final attempt
                    isLocked = false;
                } else if (scenario1Completed >= 1) {
                    // Scenario 1 has 1 attempt, lock it until Scenario 4 is done
                    isLocked = true;
                } else {
                    // Scenario 1 not started yet, unlock it
                    isLocked = false;
                }
            } else if (scenario.id === "4") {
                // Scenario 2 (Renewal Call): Lock after 2 attempts
                // Unlock when Scenario 1 has 1 attempt
                if (scenario2Completed >= 2) {
                    isLocked = true;
                } else if (scenario1Completed >= 1) {
                    isLocked = false;
                } else {
                    isLocked = true;
                }
            } else if (scenario.id === "2") {
                // Scenario 3 (Framework): Lock after 2 attempts
                // Unlock when Scenario 2 has 2 attempts
                if (scenario3Completed >= 2) {
                    isLocked = true;
                } else if (scenario2Completed >= 2) {
                    isLocked = false;
                } else {
                    isLocked = true;
                }
            } else if (scenario.id === "3") {
                // Scenario 4 (Roleplay): Lock after 2 attempts
                // Unlock when Scenario 3 has 2 attempts
                if (scenario4Completed >= 2) {
                    isLocked = true;
                } else if (scenario3Completed >= 2) {
                    isLocked = false;
                } else {
                    isLocked = true;
                }
            }
            
            if (!scenarioProgressMap.has(scenario.id)) {
                scenarioProgressMap.set(scenario.id, {
                    scenarioId: scenario.id,
                    status: isFullyCompleted ? "COMPLETED" : (completedAttempts > 0 ? "IN_PROGRESS" : "NOT_STARTED"),
                    score: avgScore,
                    completedAttempts,
                    requiredAttempts,
                    isLocked: isLocked
                });
            } else {
                // Update existing progress
                const existing = scenarioProgressMap.get(scenario.id)!;
                existing.completedAttempts = Math.max(existing.completedAttempts, completedAttempts);
                existing.requiredAttempts = Math.max(existing.requiredAttempts, requiredAttempts);
                existing.status = isFullyCompleted ? "COMPLETED" : (completedAttempts > 0 ? "IN_PROGRESS" : "NOT_STARTED");
                existing.isLocked = isLocked;
                
                if (avgScore !== null) {
                    existing.score = avgScore;
                }
            }
        });

        return Array.from(scenarioProgressMap.values());
    }

    async updateScenarioStatus(
        teacherId: number,
        scenarioId: string,
        status: "NOT_STARTED" | "COMPLETED"
    ): Promise<ScenarioProgress> {
        // For backward compatibility - this creates/updates a single attempt
        // In the new system, use submitScenarioAttempt instead
        const attempts = await this.scenarioRepository.findTeacherAttempts(teacherId, scenarioId);
        const completedAttempts = attempts.filter(a => a.status === "COMPLETED").length;
        const requiredAttempts = getRequiredAttempts(scenarioId);
        
        return {
            scenarioId,
            status: status === "COMPLETED" && completedAttempts >= requiredAttempts 
                ? "COMPLETED" 
                : (completedAttempts > 0 ? "IN_PROGRESS" : "NOT_STARTED"),
            completedAttempts,
            requiredAttempts
        };
    }

    async canAccessScenario(teacherId: number, scenarioId: string): Promise<{ canAccess: boolean; reason?: string }> {
        const attempts = await this.scenarioRepository.findTeacherAttempts(teacherId);
        const attemptsByScenario = new Map<string, any[]>();
        
        attempts.forEach(attempt => {
            const key = attempt.scenario_id;
            if (!attemptsByScenario.has(key)) {
                attemptsByScenario.set(key, []);
            }
            attemptsByScenario.get(key)!.push(attempt);
        });

        // Get completion counts
        const scenario1Attempts = attemptsByScenario.get("1") || [];
        const scenario1Completed = scenario1Attempts.filter((a: any) => a.status === "COMPLETED").length;
        
        const scenario2Attempts = attemptsByScenario.get("4") || [];
        const scenario2Completed = scenario2Attempts.filter((a: any) => a.status === "COMPLETED").length;
        
        const scenario3Attempts = attemptsByScenario.get("2") || [];
        const scenario3Completed = scenario3Attempts.filter((a: any) => a.status === "COMPLETED").length;
        
        const scenario4Attempts = attemptsByScenario.get("3") || [];
        const scenario4Completed = scenario4Attempts.filter((a: any) => a.status === "COMPLETED").length;

        if (scenarioId === "1") {
            // Scenario 1: Accessible initially, locked after 1 attempt, unlocked again after Scenario 4 completes
            if (scenario4Completed >= 2) {
                return { canAccess: true };
            } else if (scenario1Completed >= 1) {
                return { 
                    canAccess: false, 
                    reason: "Complete all other scenarios first (Renewal Call, Framework, Roleplay)" 
                };
            } else {
                return { canAccess: true };
            }
        } else if (scenarioId === "4") {
            // Scenario 2 (Renewal Call): Unlock after Scenario 1 has 1 attempt, lock after 2 attempts
            if (scenario1Completed < 1) {
                return { 
                    canAccess: false, 
                    reason: "Complete 'PTM Assessment: Handling Parent Concerns' first" 
                };
            }
            if (scenario2Completed >= 2) {
                return { 
                    canAccess: false, 
                    reason: "You have completed all required attempts for this scenario" 
                };
            }
            return { canAccess: true };
        } else if (scenarioId === "2") {
            // Scenario 3 (Framework): Unlock after Scenario 2 has 2 attempts, lock after 2 attempts
            if (scenario2Completed < 2) {
                return { 
                    canAccess: false, 
                    reason: `Complete 'Coach: The Perfect Renewal Call' first (${scenario2Completed}/2 attempts)` 
                };
            }
            if (scenario3Completed >= 2) {
                return { 
                    canAccess: false, 
                    reason: "You have completed all required attempts for this scenario" 
                };
            }
            return { canAccess: true };
        } else if (scenarioId === "3") {
            // Scenario 4 (Roleplay): Unlock after Scenario 3 has 2 attempts, lock after 2 attempts
            if (scenario3Completed < 2) {
                return { 
                    canAccess: false, 
                    reason: `Complete 'PTM Coach: Framework Mastery' first (${scenario3Completed}/2 attempts)` 
                };
            }
            if (scenario4Completed >= 2) {
                return { 
                    canAccess: false, 
                    reason: "You have completed all required attempts for this scenario" 
                };
            }
            return { canAccess: true };
        }

        return { canAccess: false, reason: "Scenario not found" };
    }
}

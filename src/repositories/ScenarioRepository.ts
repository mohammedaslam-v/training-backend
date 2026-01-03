import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

export interface IScenarioRepository {
    findByTeacherAndScenario(teacherId: number, scenarioId: string, attemptNumber?: number): Promise<ScenarioAttempt | null>;
    createAttempt(attempt: Partial<ScenarioAttempt>): Promise<ScenarioAttempt>;
    findTeacherAttempts(teacherId: number, scenarioId?: string): Promise<ScenarioAttempt[]>;
    countCompletedAttempts(teacherId: number, scenarioId: string): Promise<number>;
    getNextAttemptNumber(teacherId: number, scenarioId: string): Promise<number>;
}

export class ScenarioRepository implements IScenarioRepository {
    private repository: Repository<ScenarioAttempt>;

    constructor() {
        this.repository = AppDataSource.getRepository(ScenarioAttempt);
    }

    async findByTeacherAndScenario(
        teacherId: number, 
        scenarioId: string, 
        attemptNumber?: number
    ): Promise<ScenarioAttempt | null> {
        const where: any = {
            teacher_id: teacherId,
            scenario_id: scenarioId
        };
        
        if (attemptNumber !== undefined) {
            where.attempt_number = attemptNumber;
        }
        
        return await this.repository.findOne({
            where,
            order: { attempt_number: 'DESC' }
        });
    }

    async createAttempt(attempt: Partial<ScenarioAttempt>): Promise<ScenarioAttempt> {
        const newAttempt = this.repository.create(attempt);
        return await this.repository.save(newAttempt);
    }

    async findTeacherAttempts(teacherId: number, scenarioId?: string): Promise<ScenarioAttempt[]> {
        const where: any = { teacher_id: teacherId };
        if (scenarioId) {
            where.scenario_id = scenarioId;
        }
        
        return await this.repository.find({
            where,
            order: {
                scenario_id: "ASC",
                attempt_number: "ASC"
            }
        });
    }

    async countCompletedAttempts(teacherId: number, scenarioId: string): Promise<number> {
        return await this.repository.count({
            where: {
                teacher_id: teacherId,
                scenario_id: scenarioId,
                status: "COMPLETED"
            }
        });
    }

    async getNextAttemptNumber(teacherId: number, scenarioId: string): Promise<number> {
        const lastAttempt = await this.repository.findOne({
            where: {
                teacher_id: teacherId,
                scenario_id: scenarioId
            },
            order: { attempt_number: 'DESC' }
        });
        
        return lastAttempt ? lastAttempt.attempt_number + 1 : 1;
    }
}


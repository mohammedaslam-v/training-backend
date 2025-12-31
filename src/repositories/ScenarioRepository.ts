import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

export interface IScenarioRepository {
    findByTeacherAndScenario(teacherId: number, scenarioId: string): Promise<ScenarioAttempt | null>;
    createOrUpdateAttempt(attempt: Partial<ScenarioAttempt>): Promise<ScenarioAttempt>;
    findTeacherAttempts(teacherId: number): Promise<ScenarioAttempt[]>;
}

export class ScenarioRepository implements IScenarioRepository {
    private repository: Repository<ScenarioAttempt>;

    constructor() {
        this.repository = AppDataSource.getRepository(ScenarioAttempt);
    }

    async findByTeacherAndScenario(teacherId: number, scenarioId: string): Promise<ScenarioAttempt | null> {
        return await this.repository.findOne({
            where: {
                teacher_id: teacherId,
                scenario_id: scenarioId
            }
        });
    }

    async createOrUpdateAttempt(attempt: Partial<ScenarioAttempt>): Promise<ScenarioAttempt> {
        const existing = await this.findByTeacherAndScenario(
            attempt.teacher_id!,
            attempt.scenario_id!
        );

        if (existing) {
            // Update existing attempt
            Object.assign(existing, attempt);
            return await this.repository.save(existing);
        } else {
            // Create new attempt
            const newAttempt = this.repository.create(attempt);
            return await this.repository.save(newAttempt);
        }
    }

    async findTeacherAttempts(teacherId: number): Promise<ScenarioAttempt[]> {
        return await this.repository.find({
            where: {
                teacher_id: teacherId
            },
            order: {
                scenario_id: "ASC"
            }
        });
    }
}


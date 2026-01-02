import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Teacher } from "../entities/Teacher";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

export interface ITeacherRepository {
    findByEmail(email: string): Promise<Teacher | null>;
    findAllWithAttempts(): Promise<(Teacher & { scenarioAttempts: ScenarioAttempt[] })[]>;
    findByIdWithAttempts(id: number): Promise<(Teacher & { scenarioAttempts: ScenarioAttempt[] }) | null>;
    findById(id: number): Promise<Teacher | null>;
}

export class TeacherRepository implements ITeacherRepository {
    private repository: Repository<Teacher>;
    private attemptRepository: Repository<ScenarioAttempt>;

    constructor() {
        this.repository = AppDataSource.getRepository(Teacher);
        this.attemptRepository = AppDataSource.getRepository(ScenarioAttempt);
    }

    async findByEmail(email: string): Promise<Teacher | null> {
        return await this.repository.findOne({ 
            where: { 
                email, 
                status: 'ACTIVE' 
            } 
        });
    }

    async findById(id: number): Promise<Teacher | null> {
        return await this.repository.findOne({ 
            where: { id } 
        });
    }

    async findAllWithAttempts(): Promise<(Teacher & { scenarioAttempts: ScenarioAttempt[] })[]> {
        const teachers = await this.repository.find({
            where: { status: 'ACTIVE' },
            order: { created_at: 'DESC' }
        });

        const teachersWithAttempts = await Promise.all(
            teachers.map(async (teacher) => {
                const attempts = await this.attemptRepository.find({
                    where: { teacher_id: teacher.id },
                    order: { scenario_id: 'ASC' }
                });
                return { ...teacher, scenarioAttempts: attempts };
            })
        );

        return teachersWithAttempts;
    }

    async findByIdWithAttempts(id: number): Promise<(Teacher & { scenarioAttempts: ScenarioAttempt[] }) | null> {
        const teacher = await this.repository.findOne({ 
            where: { id } 
        });

        if (!teacher) {
            return null;
        }

        const attempts = await this.attemptRepository.find({
            where: { teacher_id: id },
            order: { scenario_id: 'ASC' }
        });

        return { ...teacher, scenarioAttempts: attempts };
    }
}








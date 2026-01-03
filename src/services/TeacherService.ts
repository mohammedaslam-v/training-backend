import { ITeacherRepository } from "../repositories/TeacherRepository";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

export interface TeacherWithAttempts {
    id: number;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: Date;
    scenarioAttempts: ScenarioAttempt[];
}

export interface TeacherResponse {
    id: number;
    email: string;
    full_name: string;
    role: string;
    status: string;
    created_at: string;
    scenarioAttempts: {
        id: number;
        scenarioId: string;
        attemptNumber: number;
        status: string;
        score: number | null;
        session_id: string | null;
        evaluation: Record<string, any> | null;
        created_at: string;
        updated_at: string;
    }[];
}

export class TeacherService {
    constructor(private teacherRepository: ITeacherRepository) {}

    private transformTeacher(teacher: TeacherWithAttempts): TeacherResponse {
        return {
            id: teacher.id,
            email: teacher.email,
            full_name: teacher.full_name,
            role: teacher.role,
            status: teacher.status,
            created_at: teacher.created_at.toISOString(),
            scenarioAttempts: teacher.scenarioAttempts.map(attempt => ({
                id: attempt.id,
                scenarioId: attempt.scenario_id,
                attemptNumber: attempt.attempt_number,
                status: attempt.status,
                score: attempt.score,
                session_id: attempt.session_id,
                evaluation: attempt.evaluation,
                created_at: attempt.created_at.toISOString(),
                updated_at: attempt.updated_at.toISOString()
            }))
        };
    }

    async getAllTeachers(): Promise<TeacherResponse[]> {
        const teachers = await this.teacherRepository.findAllWithAttempts();
        return teachers.map(teacher => this.transformTeacher(teacher));
    }

    async getTeacherById(id: number): Promise<TeacherResponse | null> {
        const teacher = await this.teacherRepository.findByIdWithAttempts(id);
        if (!teacher) {
            return null;
        }
        return this.transformTeacher(teacher);
    }

    async getTeacherScenario(teacherId: number, scenarioId: string): Promise<ScenarioAttempt | null> {
        const teacher = await this.teacherRepository.findByIdWithAttempts(teacherId);
        if (!teacher) {
            return null;
        }
        return teacher.scenarioAttempts.find(a => a.scenario_id === scenarioId) || null;
    }
}




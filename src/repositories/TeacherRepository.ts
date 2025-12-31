import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Teacher } from "../entities/Teacher";

export interface ITeacherRepository {
    findByEmail(email: string): Promise<Teacher | null>;
}

export class TeacherRepository implements ITeacherRepository {
    private repository: Repository<Teacher>;

    constructor() {
        this.repository = AppDataSource.getRepository(Teacher);
    }

    async findByEmail(email: string): Promise<Teacher | null> {
        return await this.repository.findOne({ 
            where: { 
                email, 
                status: 'ACTIVE' 
            } 
        });
    }
}






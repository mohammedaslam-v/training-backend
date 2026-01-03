import jwt from "jsonwebtoken";
import { ITeacherRepository } from "../repositories/TeacherRepository";
import { LoginDTO, AuthResponse, TokenPayload } from "../interfaces/auth.interface";

export class AuthService {
    private readonly jwtSecret: string;
    private readonly defaultPassword: string;

    constructor(private teacherRepository: ITeacherRepository) {
        this.jwtSecret = process.env.JWT_SECRET || "fallback_secret";
        this.defaultPassword = process.env.DEFAULT_PASSWORD || "bambinos10";
    }

    async login(data: LoginDTO): Promise<AuthResponse> {
        const { email, password } = data;

        // 1. Check default password
        if (password !== this.defaultPassword) {
            throw new Error("Invalid password");
        }

        // 2. Check if teacher exists in DB
        const teacher = await this.teacherRepository.findByEmail(email);
        if (!teacher) {
            throw new Error("User not found or account is inactive");
        }

        // 3. Generate JWT Token
        const payload: TokenPayload = {
            id: teacher.id,
            email: teacher.email,
            role: teacher.role
        };

        const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });

        return {
            token,
            user: {
                id: teacher.id,
                email: teacher.email,
                name: teacher.full_name,
                role: teacher.role
            }
        };
    }
}










import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
    constructor(private authService: AuthService) {}

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required"
                });
            }

            const result = await this.authService.login({ email, password });

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: result
            });
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: error.message || "Authentication failed"
            });
        }
    };
}










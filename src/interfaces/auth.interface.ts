export interface LoginDTO {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: string;
    };
}

export interface TokenPayload {
    id: number;
    email: string;
    role: string;
}








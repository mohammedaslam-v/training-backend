import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Teacher } from "../entities/Teacher";
import { ScenarioAttempt } from "../entities/ScenarioAttempt";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ai_teacher",
    synchronize: false, // Set to false in production, use migrations
    logging: process.env.NODE_ENV === "development",
    entities: [Teacher, ScenarioAttempt],
    migrations: [],
    subscribers: [],
});


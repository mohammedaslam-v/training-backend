import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { AppDataSource } from "./config/database";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Error during Data Source initialization", err);
        process.exit(1);
    }
};

startServer();


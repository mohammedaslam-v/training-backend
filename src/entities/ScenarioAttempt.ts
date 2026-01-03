import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("teacher_aiscenario_attempts")
@Index(["teacher_id", "scenario_id", "attempt_number"], { unique: true })
export class ScenarioAttempt {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "teacher_id" })
    teacher_id!: number;

    @Column({ name: "scenario_id", type: "varchar", length: 50 })
    scenario_id!: string;

    @Column({ name: "attempt_number", type: "int", default: 1 })
    attempt_number!: number;

    @Column({
        type: "enum",
        enum: ["NOT_STARTED", "COMPLETED"],
        default: "NOT_STARTED"
    })
    status!: string;

    @Column({ type: "int", nullable: true })
    score!: number | null;

    @Column({ name: "session_id", type: "varchar", length: 255, nullable: true })
    session_id!: string | null;

    @Column({ type: "json", nullable: true })
    evaluation!: Record<string, any> | null;

    @CreateDateColumn({ name: "created_at" })
    created_at!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at!: Date;
}


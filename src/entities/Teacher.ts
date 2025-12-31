import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("teachers_hiring")
export class Teacher {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    full_name!: string;

    @Column()
    role!: string;

    @Column({ default: 'ACTIVE' })
    status!: string;

    @CreateDateColumn()
    created_at!: Date;
}


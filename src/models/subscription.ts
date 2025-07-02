import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { User } from "./user";

@Entity("SubscriptionPlan")
export class SubscriptionPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string; // e.g., "Basic", "Standard", "Premium"

  @Column({ nullable: false })
  duration: "monthly" | "yearly";

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ nullable: true })
  description: string; // Optional description of the plan

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()" })
  updatedAt: Date;

  @OneToMany(() => UserSubscription, (subscription) => subscription.plan)
  subscriptions: UserSubscription[];
}

@Entity("UserSubscription")
export class UserSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.subscriptions, { nullable: false })
  @JoinColumn()
  user: User;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, { nullable: false })
  @JoinColumn()
  plan: SubscriptionPlan;

  @Column({ type: "timestamptz", nullable: false })
  startDate: Date;

  @Column({ type: "timestamptz", nullable: false })
  endDate: Date;

  @Column({
    type: "enum",
    enum: ["active", "expired", "cancelled", "pending"],
    default: "pending"
  })
  status: "active" | "expired" | "cancelled" | "pending";

  @Column({ type: "varchar", length: 20, nullable: true }) // 'crypto' or 'payoneer'
  paymentMethod: string;

  @Column({ nullable: true })
  paymentId: string; // Store payment reference (e.g., Cryptomus or Payoneer ID)

  @Column({ nullable: true })
  paymentStatus: string;

  @CreateDateColumn({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "NOW()", onUpdate: "NOW()" })
  updatedAt: Date;
} 
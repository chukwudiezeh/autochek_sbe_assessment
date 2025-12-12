import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LoanApplication } from './loan-application.entity';

@Entity()
export class LoanApplicationOffer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loanApplicationId: number;

  @ManyToOne(() => LoanApplication, (loan) => loan.offers)
  @JoinColumn({ name: 'loanApplicationId' })
  loanApplication: LoanApplication;

  @Column('decimal', { precision: 12, scale: 2 })
  approvedAmount: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number; // Annual percentage rate

  @Column()
  termMonths: number;

  @Column('decimal', { precision: 12, scale: 2 })
  monthlyPayment: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalRepayment: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { LoanApplicationOffer } from './loan-application-offer.entity';

export enum LoanStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
}

export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SELF_EMPLOYED = 'self_employed',
  UNEMPLOYED = 'unemployed',
}

@Entity()
export class LoanApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vehicleId: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.loanApplications)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column()
  applicantName: string;

  @Column()
  applicantEmail: string;

  @Column()
  applicantPhone: string;

  @Column('decimal', { precision: 12, scale: 2 })
  requestedAmount: number;

  @Column({
    type: 'text',
    default: EmploymentStatus.EMPLOYED,
  })
  employmentStatus: EmploymentStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  monthlyIncome: number;

  @Column({
    type: 'text',
    default: LoanStatus.PENDING,
  })
  status: LoanStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  eligibilityScore: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => LoanApplicationOffer, (offer) => offer.loanApplication)
  offers: LoanApplicationOffer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
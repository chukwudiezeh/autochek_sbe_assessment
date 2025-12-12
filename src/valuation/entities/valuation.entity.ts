import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity('valuations')
export class Valuation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vehicleId: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.valuations)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column('decimal', { precision: 12, scale: 2 })
  estimatedValue: number;

  @Column()
  source: string; // 'rapidapi', 'manual', 'simulated'

  @Column('decimal', { precision: 5, scale: 2, default: 0.85 })
  confidenceScore: number;

  @Column({ type: 'simple-json', nullable: true })
  additionalData: any;

  @CreateDateColumn()
  valuationDate: Date;
}
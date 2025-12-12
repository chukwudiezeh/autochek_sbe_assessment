import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// import { VehicleImage } from '../../vehicle/entities/vehicle-image.entity';
import { Valuation } from '../../valuation/entities/valuation.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 17 })
  vin: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  mileage: number;

  @Column()
  condition: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'simple-json', array: true, nullable: true })
  images?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => VehicleImage, (image) => image.vehicle)
  // images: VehicleImage[];

  @OneToMany(() => Valuation, (valuation) => valuation.vehicle)
  valuations: Valuation[];

  @OneToMany(() => LoanApplication, (LoanApplication) => LoanApplication.vehicle)
  loanApplications: LoanApplication[];

}

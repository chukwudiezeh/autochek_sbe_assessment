import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity('vehicleImages')
export class VehicleImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vehicleId: number;

  @Column()
  imageUrl: string;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.images)
  vehicle: Vehicle;
}

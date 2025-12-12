import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ValuationService } from '../valuation/valuation.service';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private valuationService: ValuationService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Check if VIN already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { vin: createVehicleDto.vin },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle with this VIN already exists');
    }

    const vehicle = this.vehicleRepository.create(createVehicleDto);
    const savedVehicle = await this.vehicleRepository.save(vehicle);

    this.logger.log(`Vehicle created with ID: ${savedVehicle.id}`);

    // Automatically trigger valuation after creation
    try {
      await this.valuationService.createValuation(savedVehicle.id);
    } catch (error) {
      this.logger.warn(`Failed to auto-valuate vehicle ${savedVehicle.id}: ${error.message}`);
    }

    return savedVehicle;
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      relations: ['valuations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['valuations', 'loanApplications'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async requestValuation(id: number) {
    const vehicle = await this.findOne(id);
    const valuation = await this.valuationService.createValuation(vehicle.id);
    
    return {
      vehicle,
      valuation,
      message: 'Valuation completed successfully',
    };
  }
}
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { Vehicle } from './entities/vehicle.entity';
import { ValuationModule } from '../valuation/valuation.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    forwardRef(() => ValuationModule)
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})

export class VehicleModule {}
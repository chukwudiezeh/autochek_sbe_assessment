import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValuationService } from './valuation.service';
import { Valuation } from './entities/valuation.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Valuation, Vehicle])],
  providers: [ValuationService],
  exports: [ValuationService],
})
export class ValuationModule {}
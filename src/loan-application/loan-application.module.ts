import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanApplicationController } from './loan-application.controller';
import { LoanApplicationService } from './loan-application.service';
import { LoanApplication } from './entities/loan-application.entity';
import { LoanApplicationOffer } from './entities/loan-application-offer.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { ValuationModule } from '../valuation/valuation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, LoanApplicationOffer, Vehicle]),
    ValuationModule,
  ],
  controllers: [LoanApplicationController],
  providers: [LoanApplicationService],
})
export class LoanApplicationModule {}
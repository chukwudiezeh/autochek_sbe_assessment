// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { LoanApplicationsController } from './loan-applications.controller';
// import { LoanApplicationsService } from './loan-applications.service';
// import { LoanApplication } from './entities/loan-application.entity';
// import { LoanApplicationOffer } from './entities/loan-application-offer.entity';
// import { Vehicle } from '../vehicles/entities/vehicle.entity';
// import { ValuationsModule } from '../valuation/valuation.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([LoanApplication, LoanApplicationOffer, Vehicle]),
//     ValuationsModule,
//   ],
//   controllers: [LoanApplicationsController],
//   providers: [LoanApplicationsService],
// })
// export class LoansModule {}
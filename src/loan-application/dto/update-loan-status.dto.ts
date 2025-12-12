import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanStatus } from '../entities/loan-application.entity';

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  status: LoanStatus;
}
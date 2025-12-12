import { IsString, IsNumber, IsEmail, IsEnum, IsPhoneNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentStatus } from '../entities/loan-application.entity';

export class CreateLoanApplicationDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  vehicleId: number;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  applicantName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  applicantEmail: string;

  @ApiProperty({ example: '+234-803-123-4567' })
  @IsString()
  applicantPhone: string;

  @ApiProperty({ example: 5000000, description: 'Requested loan amount in Naira' })
  @IsNumber()
  @Min(100000)
  requestedAmount: number;

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.EMPLOYED })
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;

  @ApiProperty({ example: 500000, description: 'Monthly income in Naira' })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;
}

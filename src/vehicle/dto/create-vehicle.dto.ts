import { IsArray, IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateVehicleDto {
  @ApiProperty({ example: '1HGCM82633A123456', description: 'The VIN of the vehicle' })
  @IsString()
  @Length(17, 17, { message: 'VIN must be exactly 17 characters long' })
  vin: string;

  @ApiProperty({ example: 'Honda', description: 'The make of the vehicle' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Accord', description: 'The model of the vehicle' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2020, description: 'The year of the vehicle' })
  @IsNumber()
  @Min(1900, { message: 'Year must be no earlier than 1900' })
  @Max(new Date().getFullYear(), { message: 'Year cannot be in the future' })
  year: number;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: 'good', enum: ['excellent', 'good', 'fair', 'poor'] })
  @IsString()
  @IsIn(['excellent', 'good', 'fair', 'poor'])
  condition: string;

  @ApiProperty({ example: 'Black', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: ['image1.jpg', 'image2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ example: 22000 })
  @IsNumber()
  @Min(0)
  price: number;
}
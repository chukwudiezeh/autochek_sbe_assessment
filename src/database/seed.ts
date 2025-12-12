import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VehicleService } from '../vehicle/vehicle.service';
import { LoanApplicationService } from '../loan-application/loan-application.service';
import { EmploymentStatus } from '../loan-application/entities/loan-application.entity';

async function seed() {
  console.log('🌱 Seeding database...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const vehicleService = app.get(VehicleService);
  const loanApplicationService = app.get(LoanApplicationService);

  try {
    // Seed vehicles
    console.log('Creating vehicles...');
    
    const vehicle1 = await vehicleService.create({
      vin: '1HGBH41JXMN109186',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      mileage: 35000,
      condition: 'good',
      color: 'Silver',
      price: 30000,
    });

    const vehicle2 = await vehicleService.create({
      vin: 'WBADT43452G123456',
      make: 'BMW',
      model: 'X5',
      year: 2019,
      mileage: 45000,
      condition: 'excellent',
      color: 'Black',
      price: 55000,
    });

    const vehicle3 = await vehicleService.create({
      vin: 'JN1AZ4EH8DM123456',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      mileage: 25000,
      condition: 'excellent',
      color: 'White',
      price: 240000,
    });

    console.log(`✅ Created ${3} vehicles`);

    // Seed loan applications
    console.log('Creating loan applications...');

    const loan1 = await loanApplicationService.create({
      vehicleId: vehicle1.id,
      applicantName: 'John Doe',
      applicantEmail: 'john.doe@example.com',
      applicantPhone: '+2348031234567',
      requestedAmount: 5000000,
      employmentStatus: EmploymentStatus.EMPLOYED,
      monthlyIncome: 500000,
    });

    const loan2 = await loanApplicationService.create({
      vehicleId: vehicle2.id,
      applicantName: 'Jane Smith',
      applicantEmail: 'jane.smith@example.com',
      applicantPhone: '+2348059876543',
      requestedAmount: 8000000,
      employmentStatus: EmploymentStatus.SELF_EMPLOYED,
      monthlyIncome: 800000,
    });

    console.log(`✅ Created ${2} loan applications`);

    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
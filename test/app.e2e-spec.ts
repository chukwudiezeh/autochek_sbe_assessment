import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Autochek API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Vehicles', () => {
    let vehicleId: number;

    it('/vehicles (POST) - should create a vehicle', () => {
      return request(app.getHttpServer())
        .post('/vehicles')
        .send({
          vin: '1HGBH41JXMN109999',
          make: 'Toyota',
          model: 'Corolla',
          year: 2022,
          mileage: 15000,
          condition: 'excellent',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.make).toBe('Toyota');
          vehicleId = response.body.id;
        });
    });

    it('/vehicles (GET) - should return all vehicles', () => {
      return request(app.getHttpServer())
        .get('/vehicles')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });

    it('/vehicles/:id (GET) - should return vehicle by id', () => {
      return request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(vehicleId);
        });
    });

    it('/vehicles/:id/valuate (POST) - should valuate vehicle', () => {
      return request(app.getHttpServer())
        .post(`/vehicles/${vehicleId}/valuate`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('valuation');
          expect(response.body.valuation).toHaveProperty('estimatedValue');
        });
    });
  });

  describe('Loan Applications', () => {
    let loanId: number;
    let testVehicleId: number;

    beforeAll(async () => {
      // Create a vehicle for loan testing
      const vehicleResponse = await request(app.getHttpServer())
        .post('/vehicles')
        .send({
          vin: '1HGBH41JXMN108888',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          mileage: 20000,
          condition: 'good',
        });
      testVehicleId = vehicleResponse.body.id;
    });

    it('/loan-applications (POST) - should create loan application', () => {
      return request(app.getHttpServer())
        .post('/loan-applications')
        .send({
          vehicleId: testVehicleId,
          applicantName: 'Test User',
          applicantEmail: 'test@example.com',
          applicantPhone: '+234-800-000-0000',
          requestedAmount: 4000000,
          employmentStatus: 'employed',
          monthlyIncome: 450000,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('application');
          expect(response.body.application).toHaveProperty('id');
          loanId = response.body.application.id;
        });
    });

    it('/loan-applications (GET) - should return all applications', () => {
      return request(app.getHttpServer())
        .get('/loan-applications')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });

    it('/loan-applications/:id (GET) - should return application by id', () => {
      return request(app.getHttpServer())
        .get(`/loan-applications/${loanId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(loanId);
        });
    });

    it('/loan-applications/:id/offers (GET) - should return offers', () => {
      return request(app.getHttpServer())
        .get(`/loan-applications/${loanId}/offers`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
        });
    });
  });
});
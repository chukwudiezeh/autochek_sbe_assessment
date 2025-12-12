import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Valuation } from './entities/valuation.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import axios from 'axios';

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);
  private readonly rapidApiKey = process.env.RAPIDAPI_KEY;

  constructor(
    @InjectRepository(Valuation)
    private valuationRepository: Repository<Valuation>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async createValuation(vehicleId: number): Promise<Valuation> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    let estimatedValue: number;
    let source: string;
    let confidenceScore: number;
    let additionalData: any = {};

    // Try to fetch from RapidAPI if key is available
    if (this.rapidApiKey) {
      try {
        const apiValue = await this.fetchFromRapidAPI(vehicle.vin);
        estimatedValue = apiValue.value;
        source = 'rapidapi';
        confidenceScore = apiValue.confidence || 0.85;
        additionalData = apiValue.data;
      } catch (error) {
        this.logger.warn(`RapidAPI fetch failed: ${error.message}. Using simulation.`);
        const simulated = this.simulateValuation(vehicle);
        estimatedValue = simulated.value;
        source = 'simulated';
        confidenceScore = simulated.confidence;
      }
    } else {
      // Use simulated valuation
      const simulated = this.simulateValuation(vehicle);
      estimatedValue = simulated.value;
      source = 'simulated';
      confidenceScore = simulated.confidence;
    }

    const valuation = this.valuationRepository.create({
      vehicleId: vehicle.id,
      estimatedValue,
      source,
      confidenceScore,
      additionalData,
    });

    const saved = await this.valuationRepository.save(valuation);
    this.logger.log(`Valuation created for vehicle ${vehicleId}: ₦${estimatedValue}`);

    return saved;
  }

  private async fetchFromRapidAPI(vin: string): Promise<any> {
    // VIN Lookup API integration
    const options = {
      method: 'GET',
      url: 'https://vin-lookup-by-api-ninjas.p.rapidapi.com/v1/vinlookup',
      params: { vin },
      headers: {
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': 'vin-lookup-by-api-ninjas.p.rapidapi.com',
      },
    };

    const response = await axios.request(options);
    
    // Parse the response and estimate value based on vehicle data
    const data = response.data;
    const baseValue = this.estimateBaseValue(data);

    return {
      value: baseValue,
      confidence: 0.85,
      data: data,
    };
  }

  private estimateBaseValue(apiData: any): number {
    // Simple estimation logic based on API data
    // In production, this would use more sophisticated pricing models
    let baseValue = 5000000; // Default base value in Naira

    if (apiData.make && apiData.model) {
      // Adjust based on make/model (simplified)
      const premiumBrands = ['mercedes-benz', 'bmw', 'audi', 'lexus'];
      if (premiumBrands.includes(apiData.make.toLowerCase())) {
        baseValue *= 1.5;
      }
    }

    return baseValue;
  }

  private simulateValuation(vehicle: Vehicle): { value: number; confidence: number } {
    // Simulated valuation based on vehicle attributes
    let baseValue = 8000000; // Base value in Naira

    // Adjust for make (brand premium)
    const premiumBrands = ['mercedes', 'bmw', 'audi', 'lexus', 'toyota', 'honda'];
    const make = vehicle.make.toLowerCase();
    
    if (premiumBrands.includes(make)) {
      baseValue *= 1.3;
    }

    // Adjust for year (depreciation)
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.year;
    const depreciationRate = 0.85; // 15% per year
    baseValue *= Math.pow(depreciationRate, age);

    // Adjust for mileage
    const avgMileagePerYear = 15000;
    const expectedMileage = age * avgMileagePerYear;
    const excessMileage = Math.max(0, vehicle.mileage - expectedMileage);
    const mileageAdjustment = 1 - (excessMileage / 200000) * 0.2; // 20% reduction for 200k excess miles
    baseValue *= Math.max(0.5, mileageAdjustment);

    // Adjust for condition
    const conditionMultipliers = {
      excellent: 1.1,
      good: 1.0,
      fair: 0.85,
      poor: 0.65,
    };
    baseValue *= conditionMultipliers[vehicle.condition] || 1.0;

    // Round to nearest 50,000
    const finalValue = Math.round(baseValue / 50000) * 50000;

    return {
      value: finalValue,
      confidence: 0.80,
    };
  }

  async findByVehicle(vehicleId: number): Promise<Valuation[]> {
    return this.valuationRepository.find({
      where: { vehicleId },
      order: { valuationDate: 'DESC' },
    });
  }

  async getLatestValuation(vehicleId: number): Promise<Valuation | null> {
    return this.valuationRepository.findOne({
      where: { vehicleId },
      order: { valuationDate: 'DESC' },
    });
  }
}
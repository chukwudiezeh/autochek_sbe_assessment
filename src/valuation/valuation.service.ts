import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Valuation } from './entities/valuation.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { RapidAPIResponse } from '../common/interfaces';

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);
  private readonly rapidApiHost:string;
  private readonly rapidApiKey:string;

  constructor(
    @InjectRepository(Valuation)
    private valuationRepository: Repository<Valuation>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private configService: ConfigService,
  ) {
    this.rapidApiHost = this.configService.get<string>('RAPIDAPI_HOST') || '';
    this.rapidApiKey = this.configService.get<string>('RAPIDAPI_KEY') || '';
  }

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
      url: 'https://' + this.rapidApiHost + '/vehicle-lookup',
      params: { vin },
      headers: {
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': this.rapidApiHost,
      },
    };

    const response = await axios.request(options);
    this.logger.log(`RapidAPI response status: ${response.status}`);
    this.logger.debug(`RapidAPI response data: ${JSON.stringify(response.data)}`);
    if (response.status !== 200) {
      throw new Error(`RapidAPI request failed with status ${response.status}`);
    }

    // Parse the response and estimate value based on vehicle data
    const data: RapidAPIResponse = response.data;
    const baseValue = this.estimateBaseValue(data);
    const confidence = this.calculateAPIConfidence(data);
    return {
      value: baseValue,
      confidence,
      data: data,
    };
  }

  private estimateBaseValue(apiData: RapidAPIResponse): number {
    // Convert USD to Naira (approximate rate)
    const usdToNairaRate = this.configService.get<number>('USD_TO_NAIRA_RATE', 1400);

    let estimatedValue = 0;

    // Priority order for value selection based on data reliability
    if (apiData.retail_value && apiData.retail_value > 0) {
      // Use retail value as primary estimate
      estimatedValue = apiData.retail_value * usdToNairaRate;
      this.logger.log(`Using retail_value: $${apiData.retail_value}`);
      
    } else if (apiData.adjusted_trade_in_value && apiData.adjusted_trade_in_value > 0) {
      // Use adjusted trade-in value with markup for retail
      const retailMarkup = this.configService.get<number>('RETAIL_MARKUP', 1.15); // 15% markup
      estimatedValue = apiData.adjusted_trade_in_value * usdToNairaRate * retailMarkup;
      this.logger.log(`Using adjusted_trade_in_value: $${apiData.adjusted_trade_in_value}`);
      
    } else if (apiData.trade_in_value && apiData.trade_in_value > 0) {
      // Use trade-in value with retail markup
      const retailMarkup = this.configService.get<number>('RETAIL_MARKUP', 1.15);
      estimatedValue = apiData.trade_in_value * usdToNairaRate * retailMarkup;
      this.logger.log(`Using trade_in_value: $${apiData.trade_in_value}`);
      
    } else if (apiData.loan_value && apiData.loan_value > 0) {
      // Use loan value with adjustment
      const loanAdjustment = this.configService.get<number>('LOAN_VALUE_ADJUSTMENT', 1.1); // 10% adjustment
      estimatedValue = apiData.loan_value * usdToNairaRate * loanAdjustment;
      this.logger.log(`Using loan_value: $${apiData.loan_value}`);
      
    } else if (apiData.average_trade_in && apiData.average_trade_in > 0) {
      // Use average trade-in with markup
      const retailMarkup = this.configService.get<number>('RETAIL_MARKUP', 1.15);
      estimatedValue = apiData.average_trade_in * usdToNairaRate * retailMarkup;
      this.logger.log(`Using average_trade_in: $${apiData.average_trade_in}`);
      
    } else {
      // Fallback to default calculation
      const defaultValue = this.configService.get<number>('DEFAULT_BASE_VALUE', 5000000);
      estimatedValue = defaultValue;
      this.logger.warn('No valid price data from API, using default value');
    }

    // Apply mileage adjustment if available
    if (apiData.mileage_adjustment && apiData.mileage_adjustment !== 0) {
      const mileageAdjustmentFactor = 1 + (apiData.mileage_adjustment / 100);
      estimatedValue *= mileageAdjustmentFactor;
      this.logger.log(`Applied mileage adjustment: ${apiData.mileage_adjustment}%`);
    }

    // Apply market adjustments for Nigerian context
    const marketAdjustment = this.configService.get<number>('NIGERIA_MARKET_ADJUSTMENT', 0.85); // 15% discount for local market
    estimatedValue *= marketAdjustment;

    // Round to nearest configured amount
    const roundingFactor = this.configService.get<number>('VALUE_ROUNDING', 50000);
    const finalValue = Math.round(estimatedValue / roundingFactor) * roundingFactor;

    // Ensure minimum value
    const minimumValue = this.configService.get<number>('MINIMUM_VALUE', 1000000);
    return Math.max(finalValue, minimumValue);
  }

  private calculateAPIConfidence(apiData: RapidAPIResponse): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available data quality
    if (apiData.retail_value && apiData.retail_value > 0) confidence += 0.25;
    if (apiData.trade_in_value && apiData.trade_in_value > 0) confidence += 0.15;
    if (apiData.loan_value && apiData.loan_value > 0) confidence += 0.1;
    if (apiData.make && apiData.model) confidence += 0.1;
    if (apiData.year && apiData.year > 1990) confidence += 0.1;
    if (apiData.trim) confidence += 0.05;
    if (apiData.msrp_value && apiData.msrp_value > 0) confidence += 0.05;

    // Higher confidence if multiple value sources are available
    const valueCount = [
      apiData.retail_value,
      apiData.trade_in_value,
      apiData.loan_value,
      apiData.average_trade_in
    ].filter(v => v && v > 0).length;

    if (valueCount >= 3) confidence += 0.1;
    else if (valueCount >= 2) confidence += 0.05;

    return Math.min(confidence, 0.90); // Cap at 90%
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
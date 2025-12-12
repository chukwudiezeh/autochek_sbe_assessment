import { Injectable, NotFoundException, BadRequestException, Logger} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication, LoanStatus, EmploymentStatus } from './entities/loan-application.entity';
import { LoanApplicationOffer } from './entities/loan-application-offer.entity';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { ValuationService } from '../valuation/valuation.service';

@Injectable()
export class LoanApplicationService {
  private readonly logger = new Logger(LoanApplicationService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanApplicationOffer)
    private loanOfferRepository: Repository<LoanApplicationOffer>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private valuationService: ValuationService,
  ) {}

  async create(createLoanDto: CreateLoanApplicationDto): Promise<any> {
    // Verify vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: createLoanDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${createLoanDto.vehicleId} not found`);
    }

    // Get latest valuation
    let valuation = await this.valuationService.getLatestValuation(vehicle.id);
    
    // Create valuation if it doesn't exist
    if (!valuation) {
      valuation = await this.valuationService.createValuation(vehicle.id);
    }

    // Check eligibility
    const eligibilityResult = await this.checkEligibility(
      createLoanDto,
      vehicle,
      valuation.estimatedValue,
    );

    if (!eligibilityResult.eligible) {
      const application = this.loanApplicationRepository.create({
        ...createLoanDto,
        status: LoanStatus.REJECTED,
        rejectionReason: eligibilityResult.reasons.join('; '),
        eligibilityScore: eligibilityResult.score,
      });
      await this.loanApplicationRepository.save(application);

      return {
        application,
        eligible: false,
        reasons: eligibilityResult.reasons,
        message: 'Loan application rejected due to eligibility criteria',
      };
    }

    // Create approved application
    const application = this.loanApplicationRepository.create({
      ...createLoanDto,
      status: LoanStatus.APPROVED,
      eligibilityScore: eligibilityResult.score,
    });
    const savedApplication = await this.loanApplicationRepository.save(application);

    // Generate loan offers
    const offers = await this.generateLoanOffers(
      savedApplication,
      valuation.estimatedValue,
    );

    this.logger.log(`Loan application ${savedApplication.id} approved with ${offers.length} offers`);

    return {
      application: savedApplication,
      offers,
      eligible: true,
      vehicleValue: valuation.estimatedValue,
      message: 'Loan application approved successfully',
    };
  }

  private async checkEligibility(
    dto: CreateLoanApplicationDto,
    vehicle: Vehicle,
    vehicleValue: number,
  ): Promise<{ eligible: boolean; reasons: string[]; score: number }> {
    const reasons: string[] = [];
    let score = 100;

    // 1. Minimum income requirement (₦200,000/month)
    if (dto.monthlyIncome < 200000) {
      reasons.push('Monthly income below minimum requirement of ₦200,000');
      score -= 30;
    }

    // 2. Employment status check
    if (dto.employmentStatus === EmploymentStatus.UNEMPLOYED) {
      reasons.push('Applicant must be employed or self-employed');
      score -= 40;
    }

    // 3. Loan-to-Value (LTV) ratio - Max 80%
    const ltvRatio = dto.requestedAmount / vehicleValue;
    if (ltvRatio > 0.8) {
      reasons.push(`Loan-to-value ratio (${(ltvRatio * 100).toFixed(1)}%) exceeds maximum 80%`);
      score -= 25;
    }

    // 4. Vehicle age restriction (Max 10 years old)
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicle.year;
    if (vehicleAge > 10) {
      reasons.push(`Vehicle is ${vehicleAge} years old, maximum age is 10 years`);
      score -= 20;
    }

    // 5. Debt-to-Income (DTI) ratio - Estimated monthly payment should be < 40% of income
    const estimatedMonthlyPayment = this.calculateMonthlyPayment(
      dto.requestedAmount,
      12, // 12% annual interest
      48, // 48 months term
    );
    const dtiRatio = estimatedMonthlyPayment / dto.monthlyIncome;
    
    if (dtiRatio > 0.4) {
      reasons.push(`Debt-to-income ratio (${(dtiRatio * 100).toFixed(1)}%) exceeds maximum 40%`);
      score -= 15;
    }

    // 6. Minimum loan amount
    if (dto.requestedAmount < 500000) {
      reasons.push('Minimum loan amount is ₦500,000');
      score -= 10;
    }

    const eligible = reasons.length === 0;
    return { eligible, reasons, score: Math.max(0, score) };
  }

  private async generateLoanOffers(
    application: LoanApplication,
    vehicleValue: number,
  ): Promise<LoanApplicationOffer[]> {
    const offers: LoanApplicationOffer[] = [];
    
    // Calculate maximum loan amount based on LTV
    const maxLoanAmount = Math.min(application.requestedAmount, vehicleValue * 0.8);

    // Offer 1: Standard 48-month loan at 12% APR
    const offer1 = this.createOffer(
      application.id,
      maxLoanAmount,
      12.0,
      48,
    );
    offers.push(offer1);

    // Offer 2: Shorter 36-month loan at 10% APR (lower rate, higher payment)
    const offer2 = this.createOffer(
      application.id,
      maxLoanAmount,
      10.0,
      36,
    );
    offers.push(offer2);

    // Offer 3: Longer 60-month loan at 14% APR (lower payment, higher rate)
    const offer3 = this.createOffer(
      application.id,
      maxLoanAmount,
      14.0,
      60,
    );
    offers.push(offer3);

    // Save all offers
    return this.loanOfferRepository.save(offers);
  }

  private createOffer(
    loanApplicationId: number,
    amount: number,
    annualRate: number,
    termMonths: number,
  ): LoanApplicationOffer {
    const monthlyPayment = this.calculateMonthlyPayment(amount, annualRate, termMonths);
    const totalRepayment = monthlyPayment * termMonths;

    return this.loanOfferRepository.create({
      loanApplicationId,
      approvedAmount: amount,
      interestRate: annualRate,
      termMonths,
      monthlyPayment,
      totalRepayment,
      isActive: true,
    });
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    
    if (monthlyRate === 0) {
      return principal / termMonths;
    }

    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    return Math.round(payment * 100) / 100;
  }

  async findAll(): Promise<LoanApplication[]> {
    return this.loanApplicationRepository.find({
      relations: ['vehicle', 'offers'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LoanApplication> {
    const application = await this.loanApplicationRepository.findOne({
      where: { id },
      relations: ['vehicle', 'offers', 'vehicle.valuations'],
    });

    if (!application) {
      throw new NotFoundException(`Loan application with ID ${id} not found`);
    }

    return application;
  }

  async updateStatus(id: number, status: LoanStatus): Promise<LoanApplication> {
    const application = await this.findOne(id);
    application.status = status;
    application.updatedAt = new Date();
    
    return this.loanApplicationRepository.save(application);
  }

  async getOffers(id: number): Promise<LoanApplicationOffer[]> {
    const application = await this.findOne(id);
    
    return this.loanOfferRepository.find({
      where: { loanApplicationId: application.id, isActive: true },
      order: { monthlyPayment: 'ASC' },
    });
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoanApplicationService } from './loan-application.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';

@ApiTags('loan-applications')
@Controller('loan-applications')
export class LoanApplicationController {
  constructor(private readonly loanApplicationService: LoanApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a loan application' })
  @ApiResponse({ status: 201, description: 'Loan application created' })
  @ApiResponse({ status: 400, description: 'Invalid input or eligibility failed' })
  async create(@Body() createLoanDto: CreateLoanApplicationDto) {
    return this.loanApplicationService.create(createLoanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loan applications' })
  @ApiResponse({ status: 200, description: 'List of loan applications' })
  async findAll() {
    return this.loanApplicationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan application by ID' })
  @ApiResponse({ status: 200, description: 'Loan application details' })
  @ApiResponse({ status: 404, description: 'Loan application not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loanApplicationService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update loan application status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Loan application not found' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateLoanStatusDto,
  ) {
    return this.loanApplicationService.updateStatus(id, updateStatusDto.status);
  }

  @Get(':id/offers')
  @ApiOperation({ summary: 'Get loan offers for an application' })
  @ApiResponse({ status: 200, description: 'List of loan offers' })
  @ApiResponse({ status: 404, description: 'Loan application not found' })
  async getOffers(@Param('id', ParseIntPipe) id: number) {
    return this.loanApplicationService.getOffers(id);
  }
}
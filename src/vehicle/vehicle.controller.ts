import { Controller, Get, Post, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle with VIN lookup' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Vehicle with this VIN already exists' })
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'List of all vehicles' })
  async findAll() {
    return this.vehicleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.findOne(id);
  }

  @Post(':id/valuate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request vehicle valuation' })
  @ApiResponse({ status: 200, description: 'Valuation completed' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async valuate(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.requestValuation(id);
  }
}

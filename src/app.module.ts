import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VehicleModule } from './vehicle/vehicle.module';
import { ValuationModule } from './valuation/valuation.module';
import { LoanApplicationModule } from './loan-application/loan-application.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DB_NAME', 'autochek.db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    VehicleModule,
    ValuationModule,
    LoanApplicationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

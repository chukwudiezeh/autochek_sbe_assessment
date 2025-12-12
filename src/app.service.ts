import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Autochek Vehicle Valuation & Financing API is running smooooth!';
  }
}

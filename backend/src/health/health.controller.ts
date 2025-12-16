import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('/')
  root() {
    return {
      name: 'StudyMonkey Backend',
      status: 'running',
      docs: '/docs',
      health: '/healthz',
      time: new Date().toISOString(),
    };
  }

  @Get('/healthz')
  async healthz() {
    return this.health.check();
  }
}

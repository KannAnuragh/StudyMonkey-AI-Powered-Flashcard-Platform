import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('PrismaService');
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.warn('Failed to connect to database - continuing without database connection');
      this.logger.debug(`Connection error: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        await this.$disconnect();
      } catch (error) {
        this.logger.warn(`Error disconnecting from database: ${error.message}`);
      }
    }
  }
}

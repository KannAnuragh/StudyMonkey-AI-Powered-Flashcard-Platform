import { Module } from '@nestjs/common';
import { StudyService } from './study.service';
import { StudyController } from './study.controller';
import { ImportModule } from '../import/import.module';

@Module({
  imports: [ImportModule],
  providers: [StudyService],
  controllers: [StudyController],
})
export class StudyModule {}

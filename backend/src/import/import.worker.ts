import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImportProcessor } from './import.processor';

@Processor('import-queue')
export class ImportWorker extends WorkerHost {
  constructor(private readonly processor: ImportProcessor) {
    super();
  }

  async process(job: Job) {
    return this.processor.process(job);
  }
}

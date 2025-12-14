import { IsOptional, IsString } from 'class-validator';

export class ImportFileDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  deckId?: string;
}

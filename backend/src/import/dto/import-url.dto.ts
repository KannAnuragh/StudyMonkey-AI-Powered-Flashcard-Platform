import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ImportUrlDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  deckId?: string;
}

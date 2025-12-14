import { IsNotEmpty, IsObject, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateCardDto {
  @IsString()
  front: string;

  @IsString()
  back: string;

  @IsOptional()
  @IsString()
  type?: string; // basic, cloze, etc.

  @IsOptional()
  sourceUrl?: string;

  @IsOptional()
  sourceExcerpt?: string;

  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;
}

export class BulkCreateCardsDto {
  @IsArray()
  cards: CreateCardDto[];
}

export class ImportCardsDto {
  @IsString()
  format: 'csv' | 'markdown' | 'json';

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  delimiter?: string; // for CSV
}

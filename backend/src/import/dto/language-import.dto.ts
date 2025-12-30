import { IsArray, IsOptional, IsString } from 'class-validator';

export class LanguageImportDto {
  @IsString()
  languageCode: string; // ISO code, e.g., 'es', 'fr'

  @IsString()
  @IsOptional()
  deckId?: string; // Use existing deck

  @IsString()
  @IsOptional()
  topic?: string; // Optional deck title/topic

  @IsString()
  text: string; // Raw text content extracted from book/article

  @IsArray()
  @IsOptional()
  cardTypes?: string[]; // ['vocab','sentence','cloze','grammar']

  @IsString()
  @IsOptional()
  level?: string; // beginner | intermediate | advanced
}

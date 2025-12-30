import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  visibility?: string;

  @IsString()
  @IsOptional()
  mode?: string; // standard | language

  @IsString()
  @IsOptional()
  languageCode?: string; // e.g., 'es', 'fr'
}

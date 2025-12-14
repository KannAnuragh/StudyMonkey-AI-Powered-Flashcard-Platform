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
}

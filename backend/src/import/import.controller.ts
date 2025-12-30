import { Controller, Post, Body, Get, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ImportService } from './import.service';
import { OllamaService } from './ollama.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportUrlDto } from './dto/import-url.dto';
import { ImportFileDto } from './dto/import-file.dto';
import { LanguageImportDto } from './dto/language-import.dto';

@Controller('import')
export class ImportController {
  constructor(
    private importService: ImportService,
    private ollamaService: OllamaService,
  ) {}

  @Post('url')
  @UseGuards(AuthGuard('jwt'))
  importUrl(@Request() req, @Body() body: ImportUrlDto) {
    console.log('[Import Controller] Received URL import request:', {
      user: req.user,
      body,
      headers: req.headers.authorization ? 'Bearer token present' : 'No token',
    });
    return this.importService.importUrl(req.user.userId, body);
  }

  @Post('file')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  importFile(@Request() req, @UploadedFile() file: Express.Multer.File, @Body() body: ImportFileDto) {
    return this.importService.importFile(req.user.userId, file, body);
  }

  @Get('jobs/:id')
  @UseGuards(AuthGuard('jwt'))
  getJobStatus(@Request() req, @Param('id') id: string) {
    return this.importService.getJobStatus(req.user.userId, id);
  }

  @Get('ollama/status')
  async getOllamaStatus() {
    return this.ollamaService.getStatus();
  }

  @Post('language')
  @UseGuards(AuthGuard('jwt'))
  importLanguage(@Request() req, @Body() body: LanguageImportDto) {
    return this.importService.importLanguageText(req.user.userId, body);
  }
}

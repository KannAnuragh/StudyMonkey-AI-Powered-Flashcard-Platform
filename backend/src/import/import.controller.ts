import { Controller, Post, Body, Get, Param, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ImportService } from './import.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportUrlDto } from './dto/import-url.dto';
import { ImportFileDto } from './dto/import-file.dto';

@Controller('import')
export class ImportController {
  constructor(private importService: ImportService) {}

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
}

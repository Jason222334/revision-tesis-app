import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GeneratedThesisService } from './generated-thesis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('generated-thesis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeneratedThesisController {
  constructor(
    private readonly generatedThesisService: GeneratedThesisService,
  ) {}

  @Post()
  generate(@Body() body: { title: string }, @Request() req) {
    return this.generatedThesisService.generate(body.title, req.user.id);
  }
}

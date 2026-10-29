import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

// Định nghĩa interface cho Request có chứa user từ JWT payload
interface AuthenticatedRequest {
  user: {
    id: string;
    email?: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  // 1. Cho phép lấy danh sách khối lớp mà không cần token
  @Public()
  @Get('grades')
  getGrades() {
    return this.lessonService.getGrades();
  }

  // 2. Cho phép lấy danh sách chủ đề theo khối mà không cần token
  @Public()
  @Get('topics')
  getTopics(@Query('gradeId') gradeId?: string) {
    return this.lessonService.getTopics(gradeId);
  }

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.lessonService.create(req.user.id, createLessonDto);
  }

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryLessonDto,
  ) {
    return this.lessonService.findAll(req.user.id, req.user.role, query);
  }

  @Get(':id')
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.lessonService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    return this.lessonService.update(id, req.user.id, req.user.role, updateLessonDto);
  }

  @Patch(':id/publish')
  publish(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.lessonService.publish(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.lessonService.remove(id, req.user.id, req.user.role);
  }
}
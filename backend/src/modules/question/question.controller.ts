import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import {
  CreateQuestionDto,
  BatchCreateQuestionsDto,
} from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';

@Controller('questions')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll(@Query() query: QueryQuestionDto) {
    return this.questionService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    if (body.questions && Array.isArray(body.questions)) {
      return this.questionService.createBatch(body as BatchCreateQuestionsDto);
    }
    return this.questionService.create(body as CreateQuestionDto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() dto: BatchCreateQuestionsDto) {
    return this.questionService.createBatch(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.questionService.remove(id);
  }
}
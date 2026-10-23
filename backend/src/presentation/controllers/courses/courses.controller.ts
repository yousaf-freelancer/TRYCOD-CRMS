import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { Course } from '../../../domain/courses/course.entity';
import { CoursesService } from '../../../domain/courses/courses.service';
import { RequirePermissions } from '../../middleware/auth.decorators';
import { CourseQueryDto } from './dto/course-query.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

/** No DELETE: deactivate with `PATCH { isActive: false }`. */
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @RequirePermissions('courses.view')
  list(@Query() query: CourseQueryDto): Promise<Course[]> {
    return this.courses.list(query);
  }

  @Get(':id')
  @RequirePermissions('courses.view')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Course> {
    return this.courses.get(id);
  }

  @Post()
  @RequirePermissions('courses.manage')
  create(@Body() dto: CreateCourseDto): Promise<Course> {
    return this.courses.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('courses.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.courses.update(id, dto);
  }
}

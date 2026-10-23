import { Module } from '@nestjs/common';
import { PrismaCourseRepository } from '../../../data/repositories/prisma-course.repository';
import { CourseRepository } from '../../../domain/courses/course.repository';
import { CoursesService } from '../../../domain/courses/courses.service';
import { CoursesController } from './courses.controller';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService,
    { provide: CourseRepository, useClass: PrismaCourseRepository },
  ],
})
export class CoursesModule {}

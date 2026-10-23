import {
  Course,
  CourseFilter,
  CreateCourseInput,
  UpdateCourseInput,
} from './course.entity';

/** Persistence for courses. Also the DI token. */
export abstract class CourseRepository {
  abstract findMany(filter: CourseFilter): Promise<Course[]>;
  abstract findById(id: string): Promise<Course | null>;
  abstract create(input: CreateCourseInput): Promise<Course>;
  abstract update(id: string, input: UpdateCourseInput): Promise<Course>;
}

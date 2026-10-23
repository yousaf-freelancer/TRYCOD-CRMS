import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Course,
  CourseFilter,
  CreateCourseInput,
  UpdateCourseInput,
} from './course.entity';
import { CourseRepository } from './course.repository';

const NOT_FOUND = 'Course not found.';
const DUPLICATE_CODE = 'Course code already exists';

@Injectable()
export class CoursesService {
  constructor(private readonly repo: CourseRepository) {}

  list(filter: CourseFilter): Promise<Course[]> {
    return this.repo.findMany(filter);
  }

  async get(id: string): Promise<Course> {
    const course = await this.repo.findById(id);
    if (!course) throw new NotFoundException(NOT_FOUND);
    return course;
  }

  async create(input: CreateCourseInput): Promise<Course> {
    try {
      return await this.repo.create({
        ...input,
        code: normalizeCode(input.code),
      });
    } catch (error) {
      throw mapError(error);
    }
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    await this.get(id);
    const data =
      input.code === undefined
        ? input
        : { ...input, code: normalizeCode(input.code) };
    try {
      return await this.repo.update(id, data);
    } catch (error) {
      throw mapError(error);
    }
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Prisma unique-constraint violation (P2002) means a duplicate code. */
function mapError(error: unknown): unknown {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'P2002' ? new ConflictException(DUPLICATE_CODE) : error;
}

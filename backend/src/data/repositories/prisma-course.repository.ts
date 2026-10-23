import { Injectable } from '@nestjs/common';
import {
  Course,
  CourseFilter,
  CreateCourseInput,
  UpdateCourseInput,
} from '../../domain/courses/course.entity';
import { CourseRepository } from '../../domain/courses/course.repository';
import type { Course as CourseRow, Prisma } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaCourseRepository extends CourseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findMany(filter: CourseFilter): Promise<Course[]> {
    const where: Prisma.CourseWhereInput = {};
    const search = filter.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    const rows = await this.prisma.course.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<Course | null> {
    const row = await this.prisma.course.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async create(input: CreateCourseInput): Promise<Course> {
    return toEntity(await this.prisma.course.create({ data: input }));
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    return toEntity(
      await this.prisma.course.update({ where: { id }, data: input }),
    );
  }
}

function toEntity(row: CourseRow): Course {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    durationMonths: row.durationMonths,
    baseFee: row.baseFee.toNumber(),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

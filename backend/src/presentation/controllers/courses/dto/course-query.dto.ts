import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CourseQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Query strings arrive as "true"/"false"; anything else fails validation. */
  @IsOptional()
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj.isActive;
    if (raw === 'true' || raw === true) return true;
    if (raw === 'false' || raw === false) return false;
    return raw;
  })
  @IsBoolean()
  isActive?: boolean;
}

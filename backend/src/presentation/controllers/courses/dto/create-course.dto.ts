import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter a course code.' })
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter a course name.' })
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseFee: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

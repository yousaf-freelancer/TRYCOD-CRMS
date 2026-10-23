import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class LoginDto {
  /** Email or phone number. */
  @IsString()
  @IsNotEmpty({ message: 'Enter your email or phone number.' })
  @MaxLength(254)
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter your password.' })
  @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Enter your current password.' })
  currentPassword: string;

  @IsString()
  @MaxLength(200)
  @Matches(/^(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
    message:
      'New password needs at least 8 characters, including a number and a symbol.',
  })
  newPassword: string;
}

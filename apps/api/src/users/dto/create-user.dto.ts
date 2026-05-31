import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Role } from '@revision-tesis/database';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  @Matches(/^[\d-]{16,19}$|^[\d-]{15,18}[Xx]$/, {
    message:
      'El código ORCID debe tener un formato válido (Ej. 0000-0000-0000-0000)',
  })
  orcid?: string;
}

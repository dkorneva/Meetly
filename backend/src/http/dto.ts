import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDivisibleBy,
  ValidateBy,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
/**
 * Проверяет, что сериализованный список кухонь помещается в поле SQL Server на 2000 символов.
 */
function FitsCuisineStorage() {
  return ValidateBy({name:"fitsCuisineStorage", validator:{
    validate: (value: unknown) => Array.isArray(value) && JSON.stringify(value).length <= 2000,
    defaultMessage: () => "Список кухонь слишком длинный",
  }});
}
/**
 * Параметры загрузки файла: необязательная встреча для вложения.
 */
export class UploadDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() meetingId?: string;
}
/**
 * Проверяемые данные входа: email и пароль.
 */
export class LoginDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty() @IsString() @Length(1, 128) password!: string;
}
/**
 * Фильтры каталога с поддержкой нескольких кухонь, бюджета, текста и открытости.
 */
export class PlaceFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) q?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  budget?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 80)
  cuisine?: string;
  @ApiPropertyOptional({type:[String]})
  @IsOptional()
  @Transform(({value})=>typeof value === "string" ? [value] : value)
  @IsArray() @ArrayMaxSize(100) @ArrayUnique()
  @IsString({each:true}) @Length(1,80,{each:true})
  cuisines?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === true || value === "true"
      ? true
      : value === false || value === "false"
        ? false
        : value,
  )
  @IsBoolean()
  openNow?: boolean;
}
/**
 * Границы и шаг бюджета встречи, а также известные средние чеки каталога.
 */
class CatalogBudgetDto {
  @ApiProperty() min!: number;
  @ApiProperty() max!: number;
  @ApiProperty() step!: number;
  @ApiProperty({type:[Number]}) prices!: number[];
}
/**
 * Ответ со всеми доступными вариантами фильтров текущего каталога.
 */
export class CatalogFiltersDto {
  @ApiProperty({type:[String]}) cuisines!: string[];
  @ApiProperty({type:CatalogBudgetDto}) budget!: CatalogBudgetDto;
  @ApiProperty({type:[String]}) formats!: string[];
}
/**
 * Данные регистрации с ограничениями имени и сложности пароля.
 */
export class RegisterDto extends LoginDto {
  @ApiProperty() @Matches(/^[\p{L}][\p{L} -]{0,28}[\p{L}]$/u) name!: string;
  @ApiProperty({ type: String })
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
  declare password: string;
}
/**
 * Тело запроса обновления или отзыва сессии.
 */
export class RefreshDto {
  @ApiProperty() @IsString() @Length(40, 200) refreshToken!: string;
}
/**
 * Разрешённые для изменения поля собственного профиля.
 */
export class ProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 30)
  @Matches(/^[\p{L}][\p{L} -]*[\p{L}]$/u)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dark?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() calendar?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() avatarId?: string;
}
/**
 * Проверяемые параметры создания и редактирования встречи по московскому времени.
 */
export class MeetingDto {
  @ApiProperty()
  @IsString()
  @Length(2, 100)
  @Matches(/^[^\p{Cc}\p{Zl}\p{Zp}]*[\p{L}\p{N}][^\p{Cc}\p{Zl}\p{Zp}]*$/u)
  title!: string;
  @ApiProperty() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @ApiProperty() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time!: string;
  @ApiProperty()
  @IsInt()
  @Min(500)
  @Max(100000)
  @IsDivisibleBy(100)
  budget!: number;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(100)
  @FitsCuisineStorage()
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  cuisines!: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;
  @ApiProperty() @IsIn(["В помещении", "На улице", "Не важно"]) format!: string;
}
/**
 * Предпочтения участника: бюджет и уникальные кухни в пределах размера поля БД.
 */
export class PreferenceDto {
  @ApiProperty()
  @IsInt()
  @Min(500)
  @Max(100000)
  @IsDivisibleBy(100)
  budget!: number;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @FitsCuisineStorage()
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  cuisines!: string[];
}
/**
 * Идентификатор заведения для голоса, предложения или бронирования.
 */
export class RestaurantIdDto {
  @ApiProperty() @IsUUID() restaurantId!: string;
}
/**
 * Email существующего аккаунта, добавляемого во встречу.
 */
export class EmailDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
}
/**
 * Случайный токен приглашения из ссылки.
 */
export class AcceptInviteDto {
  @ApiProperty() @IsString() @Length(40, 200) token!: string;
}
/**
 * Текст сообщения и необязательное ID вложения.
 */
export class MessageDto {
  @ApiProperty() @IsString() @MaxLength(4000) text!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() fileId?: string;
}
/**
 * Желаемое состояние реакции на сообщение.
 */
export class ReactionDto {
  @ApiProperty() @IsBoolean() liked!: boolean;
}
/**
 * Проверяемые данные пользовательского заведения.
 */
export class RestaurantDto {
  @ApiProperty() @IsString() @Length(1, 150) name!: string;
  @ApiProperty() @IsString() @Length(1, 500) address!: string;
  @ApiProperty() @IsString() @Length(1, 100) city!: string;
  @ApiProperty() @IsString() @Length(1, 100) district!: string;
  @ApiProperty() @IsNumber() @Min(-90) @Max(90) latitude!: number;
  @ApiProperty() @IsNumber() @Min(-180) @Max(180) longitude!: number;
  @ApiProperty() @IsString() @Length(1, 150) cuisine!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  price?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\+?[\d ()-]{5,50}$/)
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^https:\/\/[^\s]+$/)
  @MaxLength(1000)
  website?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() outdoor?: boolean;
}

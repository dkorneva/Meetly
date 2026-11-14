import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiOkResponse, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { AuthService } from "../application/auth.service";
import { MeetingsService } from "../application/meetings.service";
import { ChatService } from "../application/chat.service";
import { FilesService } from "../application/files.service";
import { RestaurantsService } from "../application/restaurants.service";
import { DiscoveryService } from "../application/discovery.service";
import { UsersService } from "../application/users.service";
import { CalendarService } from "../application/calendar.service";
import { Realtime } from "../infrastructure/realtime";
import { AuthGuard, CurrentUser } from "./auth.guard";
import {
  AcceptInviteDto,
  EmailDto,
  LoginDto,
  MeetingDto,
  MessageDto,
  PreferenceDto,
  ProfileDto,
  ReactionDto,
  RefreshDto,
  RegisterDto,
  RestaurantDto,
  RestaurantIdDto,
  PlaceFiltersDto,
  CatalogFiltersDto,
  UploadDto,
} from "./dto";
import { Throttle } from "@nestjs/throttler";
const uuid = new ParseUUIDPipe();
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  /**
   * Нормализует email, создаёт аккаунт с хешем пароля и выдаёт первую сессию.
   * @param d Входные данные или дата форматирования.
   * @throws ConflictException, если email уже занят.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } }) @Post("register") register(
    @Body() d: RegisterDto,
  ) {
    return this.auth.register(d);
  }
  /**
   * Проверяет пароль аккаунта и выдаёт новую независимую сессию.
   * @param d Входные данные или дата форматирования.
   * @throws UnauthorizedException при неверной паре email/пароль.
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } }) @Post("login") login(
    @Body() d: LoginDto,
  ) {
    return this.auth.login(d);
  }
  /**
   * Однократно потребляет действующий refresh-токен и заменяет сессию. При конкурентных запросах продолжить может только один.
   * @param d Входные данные или дата форматирования.
   * @throws UnauthorizedException для истёкшего, отозванного или уже потреблённого токена.
   */
  @Post("refresh") refresh(@Body() d: RefreshDto) {
    return this.auth.refresh(d.refreshToken);
  }
  /**
   * Идемпотентно отзывает сессию указанного refresh-токена.
   * @param d Входные данные или дата форматирования.
   */
  @Post("logout") logout(@Body() d: RefreshDto) {
    return this.auth.logout(d.refreshToken);
  }
}
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  /**
   * Возвращает публичные поля собственного профиля и временную ссылку на аватар.
   * @param id ID запрашиваемой записи.
   */
  @Get("me") me(@CurrentUser() id: string) {
    return this.users.me(id);
  }
  /**
   * Проверяет владение аватаром, нормализует email и сохраняет настройки собственного профиля.
   * @param id ID запрашиваемой записи.
   * @param input Данные операции после проверки HTTP-слоем.
   */
  @Patch("me") update(@CurrentUser() id: string, @Body() input: ProfileDto) {
    return this.users.update(id, input);
  }
}
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("meetings")
@UseGuards(AuthGuard)
export class MeetingsController {
  constructor(
    private readonly meetings: MeetingsService,
    private readonly calendarService: CalendarService,
    private readonly discovery: DiscoveryService,
    private readonly realtime: Realtime,
  ) {}
  /**
   * Дожидается результата изменения и уведомляет актуальных участников через Socket.IO.
   * @param id ID запрашиваемой записи.
   * @param result Ожидаемый результат изменения.
   * @param extra Дополнительные кухни источника либо дополнительный получатель события.
   */
  private async changed<T>(id: string, result: Promise<T>, extra?: string) {
    const value = await result;
    await this.realtime.changed(id, extra);
    return value;
  }
  /**
   * Возвращает встречи пользователя с участниками, вариантами, голосами и последним видимым сообщением.
   * @param u ID текущего пользователя.
   */
  @Get() list(@CurrentUser() u: string) {
    return this.meetings.list(u);
  }
  /**
   * Возвращает встречи пользователя с участниками, вариантами, голосами и последним видимым сообщением.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param filters Необязательные ограничения каталога.
   */
  @Get(":id/recommendations") recommendations(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Query() filters: PlaceFiltersDto,
  ) {
    return this.discovery.list(u, id, filters);
  }
  /**
   * Обновляет автоматические варианты встречи и уведомляет участников при изменении.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param filters Необязательные ограничения каталога.
   */
  @Post(":id/recommendations/apply") async applyRecommendations(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Query() filters: PlaceFiltersDto,
  ) {
    const result = await this.discovery.apply(u, id, filters);
    if (result.changed) await this.realtime.changed(id);
    return result;
  }
  /**
   * Создаёт будущую встречу, предпочтения организатора и системное сообщение в одной транзакции.
   * @param u ID текущего пользователя.
   * @param d Входные данные или дата форматирования.
   */
  @Post() create(@CurrentUser() u: string, @Body() d: MeetingDto) {
    return this.meetings.create(u, d);
  }
  /**
   * Меняет общие параметры встречи и предпочтения организатора, пока голосование открыто.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Patch(":id") edit(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: MeetingDto,
  ) {
    return this.changed(id, this.meetings.edit(u, id, d));
  }
  /**
   * Обновляет только предпочтения текущего участника открытого голосования.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Put(":id/preferences") preferences(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: PreferenceDto,
  ) {
    return this.changed(id, this.meetings.preferences(u, id, d));
  }
  /**
   * Добавляет доступное заведение или возвращает исключённый вариант как ручной выбор участника.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Post(":id/candidates") propose(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: RestaurantIdDto,
  ) {
    return this.changed(id, this.meetings.propose(u, id, d.restaurantId));
  }
  /**
   * Создаёт или заменяет единственный голос участника за предложенный доступный вариант.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Put(":id/vote") vote(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: RestaurantIdDto,
  ) {
    return this.changed(id, this.meetings.vote(u, id, d.restaurantId));
  }
  /**
   * Снимает вариант и его голоса; сохраняет исключение, чтобы автоподбор не восстановил его молча.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param restaurantId ID заведения, участвующего в голосовании.
   */
  @Delete(":id/candidates/:restaurantId")
  @ApiOperation({ summary: "Исключить вариант из голосования", description: "Только организатор и только статус voting. Удаляет голоса за вариант; автоподбор не возвращает его. Явное POST candidates может вернуть вариант." })
  @ApiOkResponse({ schema: { type: "object", properties: { ok: { type: "boolean", example: true } }, required: ["ok"] } })
  @ApiResponse({ status: 403, description: "Пользователь не организатор встречи" })
  @ApiResponse({ status: 404, description: "Вариант не найден" })
  @ApiResponse({ status: 409, description: "Голосование завершено" })
  removeCandidate(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Param("restaurantId", uuid) restaurantId: string,
  ) {
    return this.changed(id, this.meetings.removeCandidate(u, id, restaurantId));
  }
  /**
   * Организатором фиксирует единственного лидера и закрывает голосование; ничья не допускается.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   */
  @Post(":id/select") select(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
  ) {
    return this.changed(id, this.meetings.select(u, id));
  }
  /**
   * Подтверждает бронь выбранного места или отменяет подтверждение. Повторное подтверждение того же места идемпотентно.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Post(":id/booking") book(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: RestaurantIdDto,
  ) {
    return this.changed(id, this.meetings.booking(u, id, d.restaurantId));
  }
  /**
   * Подтверждает бронь выбранного места или отменяет подтверждение. Повторное подтверждение того же места идемпотентно.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   */
  @Delete(":id/booking") cancel(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
  ) {
    return this.changed(id, this.meetings.booking(u, id, "", true));
  }
  /**
   * Добавляет существующий аккаунт по нормализованному email в открытое голосование.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Post(":id/members") add(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Body() d: EmailDto,
  ) {
    return this.changed(id, this.meetings.addMember(u, id, d.email));
  }
  /**
   * Удаляет участника и его голос; организатор не может удалить самого себя.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   * @param target ID удаляемого участника.
   */
  @Delete(":id/members/:target") remove(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Param("target", uuid) target: string,
  ) {
    return this.changed(id, this.meetings.removeMember(u, id, target), target);
  }
  /**
   * Создаёт приглашение на семь дней, сохраняя только хеш случайного токена.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   */
  @Post(":id/invitations") invite(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
  ) {
    return this.meetings.invite(u, id);
  }
  /**
   * Проверяет срок и отзыв приглашения и идемпотентно добавляет пользователя в открытую встречу.
   * @param u ID текущего пользователя.
   * @param d Входные данные или дата форматирования.
   */
  @Post("invitations/accept") async accept(
    @CurrentUser() u: string,
    @Body() d: AcceptInviteDto,
  ) {
    const r = await this.meetings.accept(u, d.token);
    await this.realtime.changed(r.meetingId);
    return r;
  }
  /**
   * Проверяет участие и настройку экспорта, подставляет адрес выбранного заведения и формирует ICS без напоминаний.
   * @param u ID текущего пользователя.
   * @param id ID запрашиваемой записи.
   */
  @Get(":id/calendar.ics") async calendar(
    @CurrentUser() u: string,
    @Param("id", uuid) id: string,
    @Res() res: Response,
  ) {
    const text = await this.calendarService.export(u, id);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="meetly-${id}.ics"`,
    );
    res.send(text);
  }
}
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("meetings/:meetingId/messages")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly realtime: Realtime,
  ) {}
  /**
   * Возвращает до 50 сообщений в хронологическом порядке и курсор предыдущей страницы; скрывает устаревшее служебное уведомление.
   * @param u ID текущего пользователя.
   * @param m ID встречи.
   * @param before Курсор сообщения для загрузки более ранней страницы.
   */
  @Get() async list(
    @CurrentUser() u: string,
    @Param("meetingId", uuid) m: string,
    @Query("before") before?: string,
  ) {
    return this.chat.list(u, m, before);
  }
  /**
   * Атомарно сохраняет непустое сообщение или вложение, принадлежащее отправителю и этой встрече.
   * @param u ID текущего пользователя.
   * @param m ID встречи.
   * @param d Входные данные или дата форматирования.
   */
  @Post() async send(
    @CurrentUser() u: string,
    @Param("meetingId", uuid) m: string,
    @Body() d: MessageDto,
  ) {
    const r = await this.chat.send(u, m, d);
    await this.realtime.changed(m);
    return r;
  }
  /**
   * Идемпотентно ставит или снимает реакцию пользователя на обычное сообщение доступной встречи.
   * @param u ID текущего пользователя.
   * @param m ID встречи.
   * @param id ID запрашиваемой записи.
   * @param d Входные данные или дата форматирования.
   */
  @Put(":id/reaction") async react(
    @CurrentUser() u: string,
    @Param("meetingId", uuid) m: string,
    @Param("id", uuid) id: string,
    @Body() d: ReactionDto,
  ) {
    const r = await this.chat.react(u, m, id, d.liked);
    await this.realtime.changed(m);
    return r;
  }
}
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("restaurants")
@UseGuards(AuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}
  /**
   * Строит варианты кухонь и среднего чека по активным записям БД; диапазон бюджета покрывает весь каталог.
   */
  @Get("filters")
  @ApiOkResponse({type:CatalogFiltersDto})
  filters() { return this.restaurants.filters(); }
  /**
   * Возвращает отфильтрованный каталог, число результатов и центр отображения карты.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param filters Необязательные ограничения каталога.
   */
  @Get("discovery") discover(@CurrentUser() userId:string, @Query() filters:PlaceFiltersDto) {
    return this.restaurants.discover(userId,filters);
  }
  /**
   * Возвращает активные заведения, при необходимости ограниченные указанным городом.
   * @param userId ID текущего аутентифицированного пользователя.
   * @param city Город для ограничения каталога.
   */
  @Get() list(@CurrentUser() userId: string, @Query("city") city?: string) {
    return this.restaurants.list(userId, city);
  }
  /**
   * Сохраняет пользовательскую запись заведения с указанием создавшего аккаунта.
   * @param u ID текущего пользователя.
   * @param d Входные данные или дата форматирования.
   */
  @Post() create(@CurrentUser() u: string, @Body() d: RestaurantDto) {
    return this.restaurants.create(u, d);
  }
  /**
   * Возвращает сведения существующего заведения либо ошибку отсутствия записи.
   * @param id ID запрашиваемой записи.
   */
  @Get(":id/details") details(@Param("id", uuid) id: string) {
    return this.restaurants.details(id);
  }
  /**
   * Выполняет текстовый поиск по локальному каталогу.
   * @param u ID текущего пользователя.
   */
  @Throttle({ default: { limit: 6, ttl: 60000 } }) @Get("search") search(
    @CurrentUser() u: string,
    @Query("q") q = "рестораны",
  ) {
    if (
      q.length > 200
    )
      throw new BadRequestException("Некорректные параметры поиска");
    return this.restaurants.search(u, q);
  }
}
/**
 * HTTP-контроллер: проверенные запросы передаются сервису, доступ ограничивается охраной маршрутов.
 */
@Controller("files")
export class FilesController {
  constructor(private readonly files: FilesService) {}
  /**
   * Проверяет тип файла и участие во встрече, сохраняет содержимое и возвращает подписанную ссылку.
   * @param u ID текущего пользователя.
   * @param file Файл загрузки либо имя ресурса карты.
   * @param input Данные операции после проверки HTTP-слоем.
   * @throws При нарушении прав, правил операции или недоступности требуемых данных.
   */
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  upload(
    @CurrentUser() u: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() input: UploadDto,
  ) {
    return this.files.upload(u, file, input.meetingId);
  }
  /**
   * Проверяет назначение и подпись токена, соответствие файлу и актуальные права его получателя.
   * @param id ID запрашиваемой записи.
   * @param token Токен клиента; не записывается в журнал.
   * @throws При нарушении прав, правил операции или недоступности требуемых данных.
   */
  @Get(":id") async download(
    @Param("id", uuid) id: string,
    @Query("token") token: string,
    @Res() res: Response,
  ) {
    const f = await this.files.download(id, token);
    res.setHeader("Content-Type", f.mime);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Disposition",
      `${f.mime.startsWith("image/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    );
    res.send(Buffer.from(f.data));
  }
}

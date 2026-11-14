# Сигнатуры Meetly

Сгенерировано из TypeScript. Включены экспортируемые и внутренние именованные функции, обработчики, компоненты и функции стилей. Анонимные обратные вызовы описываются в составе принимающих их функций.

Функций: 164. Классов: 0. В проекте используются функциональные компоненты React; классов нет.

## src/shared/theme/ThemeProvider.tsx

### ThemeProvider

Передаёт светлую или тёмную тему всем вложенным потребителям контекста.

```typescript
ThemeProvider({ dark, children, }: { dark: boolean; children: ReactNode; }): React.JSX.Element
```

## src/shared/theme/useTheme.ts

### useTheme

Читает тему ближайшего ThemeProvider; без провайдера возвращает светлую тему.

```typescript
useTheme(): Theme
```

### useThemedStyles

Создаёт стили из цветов темы и запоминает результат до изменения цветов или функции создания.

```typescript
useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T
```

## src/shared/theme/Text.tsx

### Text

Показывает текст с Inter и цветом темы; переданный style имеет приоритет.

```typescript
Text(props: Native.TextProps, ref: React.ForwardedRef<ReactNativeElement>): React.JSX.Element
```

### TextInput

Показывает поле ввода с цветами темы и передаёт ref внутреннему полю.

```typescript
TextInput(props: Native.TextInputProps, ref: React.ForwardedRef<_TextInputInstance>): React.JSX.Element
```

## src/app/App.styles.ts

### createStyles

Создаёт стили App; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ viewport: { flex: number; alignItems: "center"; }; app: { flex: number; width: string; maxWidth: number; backgroundColor: string; }; loadingScreen: { flex: number; alignItems: "center"; justifyContent: "center"; }; loadingLogo: { fontSize: number; color: string; fontWeight: "700"; }; viewportBackground: { backgroundColor: string; }; appBackground: { backgroundColor: string; }; }>
```

## src/entities/meeting/model/catalog.ts

### restaurantView

Преобразует ответ сервера в карточку со встроенным фото.

```typescript
restaurantView(r: RemoteRestaurant): Restaurant
```

### replaceCatalog

Обновляет клиентский каталог заведений.

```typescript
replaceCatalog(items: Restaurant[]): void
```

## src/entities/meeting/lib/meetingLogic.ts

### participantLabel

Возвращает число участников с подходящим русским окончанием, включая исключения 11–14.

```typescript
participantLabel(count: number): string
```

### meetingDate

Преобразует дату YYYY-MM-DD в русское название дня недели с заглавной буквы.

```typescript
meetingDate(date: string): string
```

### getLeader

Возвращает ресторан с наибольшим числом голосов; при равенстве сохраняет порядок предложенных мест; окончательный выбор проверяет сервер.

```typescript
getLeader(meeting: Meeting): Restaurant | undefined
```

### voteCount

Считает голоса, отданные за ресторан с указанным идентификатором.

```typescript
voteCount(meeting: Meeting, id: string): number
```

### reactionCount

Суммирует реакции других участников и реакцию текущего пользователя.

```typescript
reactionCount(message: Message): number
```

### meetingPlace

Возвращает выбранный ресторан или текущего лидера, если ресторан не задан или не найден.

```typescript
meetingPlace(meeting: Meeting): Restaurant | undefined
```

## src/shared/api/client.ts

### restoreSession

Восстанавливает токены сессии из хранилища.

```typescript
restoreSession(): Promise<boolean>
```

### setTokens

Сохраняет или удаляет токены сессии.

```typescript
setTokens(value: Tokens | null): Promise<void>
```

### accessToken

Возвращает текущий access-токен.

```typescript
accessToken(): string | undefined
```

### refreshToken

Возвращает текущий refresh-токен.

```typescript
refreshToken(): string | undefined
```

### api

Вызывает API и обновляет истёкшую сессию при необходимости.

```typescript
api<T>(path: string, method?: string, body?: unknown, retry?: boolean): Promise<T>
```

### upload

Загружает файл на сервер.

```typescript
upload(uri: string, name: string, mime: string, meetingId?: string): Promise<{ id: string; url: string; name: string; mime: string; }>
```

## src/shared/api/device.ts

### chooseAttachment

Открывает системный выбор файла и возвращает имя, URI и признак изображения либо null при отмене.

```typescript
chooseAttachment(): Promise<{ name: string; uri: string; image: boolean; mimeType: string; } | null>
```

### chooseAvatar

Открывает выбор изображения профиля и возвращает URI либо null при отмене.

```typescript
chooseAvatar(): Promise<{ uri: string; name: string; mimeType: string; } | null>
```

### openExternalLink

Передаёт URI операционной системе для открытия браузера или другого приложения.

```typescript
openExternalLink(url: string): Promise<void>
```

## src/shared/ui/controls/Toggle.styles.ts

### createStyles

Создаёт стили Toggle; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ switchTrack: { width: number; height: number; borderRadius: number; padding: number; justifyContent: "center"; }; switchThumb: { width: number; height: number; borderRadius: number; backgroundColor: string; }; }>
```

### getSwitchTrack

Выбирает цвет фона переключателя по его состоянию.

```typescript
getSwitchTrack(colors: ThemeColors, enabled: boolean): ViewStyle
```

### getSwitchThumb

Располагает кружок переключателя слева или справа.

```typescript
getSwitchThumb(enabled: boolean): ViewStyle
```

## src/shared/ui/controls/Toggle.tsx

### Toggle

Показывает управляемый переключатель и передаёт родителю противоположное значение.

```typescript
Toggle({ value, onValueChange, accessibilityLabel, }: { value: boolean; onValueChange: (value: boolean) => void; accessibilityLabel?: string; }): React.JSX.Element
```

## src/shared/ui/Icon.tsx

### Icon

Выбирает SVG по имени и передаёт ему размер и цвет текущей темы или явно заданный цвет.

```typescript
Icon({ name, size, color, }: { name: IconName; size?: number; color?: string; }): React.JSX.Element
```

## src/shared/ui/controls/Button.styles.ts

### createStyles

Создаёт стили Button; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): Readonly<{ button: { flexDirection: "row"; gap: number; minHeight: number; borderRadius: number; alignItems: "center"; justifyContent: "center"; paddingHorizontal: number; }; buttonLabel: { fontSize: number; fontWeight: "600"; }; }>
```

### getButtonState

Возвращает фон, рамку и прозрачность кнопки по варианту и состояниям нажатия и блокировки.

```typescript
getButtonState(colors: ThemeColors, variant: ButtonVariant, disabled: boolean, pressed: boolean): ViewStyle
```

### getButtonLabelColor

Возвращает цвет подписи для варианта кнопки.

```typescript
getButtonLabelColor(colors: ThemeColors, variant: ButtonVariant): TextStyle
```

## src/shared/ui/controls/Button.tsx

### Button

Показывает кнопку выбранного варианта оформления; disabled блокирует нажатия.

```typescript
Button({ title, onPress, variant, style, disabled, icon, textStyle, stopPropagation, }: { title: string; onPress: () => void; variant?: ButtonVariant; style?: StyleProp<ViewStyle>; disabled?: boolean; icon?: IconName; textStyle?: StyleProp<TextStyle>; stopPropagation?: boolean; }): React.JSX.Element
```

## src/shared/ui/controls/IconButton.styles.ts

### createStyles

Создаёт стили IconButton; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): Readonly<{ iconButton: { width: number; height: number; alignItems: "center"; justifyContent: "center"; }; }>
```

## src/shared/ui/controls/IconButton.tsx

### IconButton

Показывает кнопку с иконкой и вызывает переданный обработчик нажатия.

```typescript
IconButton({ name, onPress, color, }: { name: IconName; onPress: () => void; color?: string; }): React.JSX.Element
```

## src/shared/ui/controls/Field.styles.ts

### createStyles

Создаёт стили Field; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ fieldContainer: { gap: number; }; input: { height: number; borderWidth: number; borderColor: string; borderRadius: number; paddingHorizontal: number; fontSize: number; color: string; backgroundColor: string; }; }>
```

## src/shared/ui/shared.styles.ts

### createUiStyles

Создаёт стили общих элементов; значения зависят от переданной палитры, если она используется.

```typescript
createUiStyles(colors: ThemeColors): Readonly<{ label: { fontSize: number; color: string; }; heading: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; muted: { fontSize: number; color: string; lineHeight: number; }; section: { paddingVertical: number; borderBottomWidth: number; borderColor: string; gap: number; }; card: { borderWidth: number; borderColor: string; borderRadius: number; backgroundColor: string; padding: number; gap: number; }; }>
```

### useUiStyles

Возвращает общие стили подписей, заголовков, карточек и секций с цветами текущей темы.

```typescript
useUiStyles(): Readonly<{ label: { fontSize: number; color: string; }; heading: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; muted: { fontSize: number; color: string; lineHeight: number; }; section: { paddingVertical: number; borderBottomWidth: number; borderColor: string; gap: number; }; card: { borderWidth: number; borderColor: string; borderRadius: number; backgroundColor: string; padding: number; gap: number; }; }>
```

## src/shared/ui/controls/Field.tsx

### Field

Показывает поле ввода с необязательной подписью и передаёт свойства внутреннему TextInput.

```typescript
Field({ label, ...props }: TextInputProps & { label?: string; }): React.JSX.Element
```

## src/shared/ui/controls/Avatars.styles.ts

### createStyles

Создаёт стили Avatars; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ avatar: { width: number; height: number; borderRadius: number; borderWidth: number; borderColor: string; justifyContent: "center"; alignItems: "center"; }; avatarGroup: { flexDirection: "row"; alignItems: "center"; }; avatarInitial: { fontWeight: "600"; color: string; }; avatarOverflow: { marginLeft: number; color: string; fontSize: number; }; }>
```

### getAvatarStyle

Вычисляет размер, цвет и перекрытие аватара по имени и позиции.

```typescript
getAvatarStyle(colors: ThemeColors, size: number, name: string, index: number): ViewStyle
```

### getAvatarFontSize

Вычисляет размер инициала относительно диаметра аватара.

```typescript
getAvatarFontSize(size: number): TextStyle
```

## src/shared/ui/controls/Avatars.tsx

### Avatars

Показывает инициалы участников и число имён, не поместившихся в limit.

```typescript
Avatars({ names, limit, size, }: { names: string[]; limit?: number; size?: number; }): React.JSX.Element
```

## src/shared/ui/controls/Chip.styles.ts

### createStyles

Создаёт стили Chip; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ chip: { paddingHorizontal: number; paddingVertical: number; borderRadius: number; backgroundColor: string; borderWidth: number; borderColor: string; }; chipLabel: { fontSize: number; }; }>
```

### getSelectedChip

Возвращает фон и рамку выбранной метки.

```typescript
getSelectedChip(colors: ThemeColors): ViewStyle
```

### getChipLabel

Выбирает цвет и насыщенность подписи метки.

```typescript
getChipLabel(colors: ThemeColors, selected: boolean): TextStyle
```

## src/shared/ui/controls/Chip.tsx

### Chip

Показывает выбираемую метку с оформлением выбранного или обычного состояния.

```typescript
Chip({ label, selected, onPress, }: { label: string; selected?: boolean; onPress: () => void; }): React.JSX.Element
```

## src/shared/ui/controls/Row.styles.ts

### createStyles

Создаёт стили Row; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): Readonly<{ row: { flexDirection: "row"; alignItems: "center"; justifyContent: "space-between"; }; }>
```

## src/shared/ui/controls/Row.tsx

### Row

Располагает дочерние элементы горизонтально, объединяя базовый и переданный стили.

```typescript
Row({ children, style, }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; }): React.JSX.Element
```

## src/shared/ui/controls/Select.tsx

### Select

Выпадающий список: системный select в браузере, доступное окно выбора на телефоне.

```typescript
Select({ label, value, options, onChange, accessibilityLabel }: { label: string; value: string; options: string[]; onChange: (value: string) => void; accessibilityLabel?: string; }): React.JSX.Element
```

## src/features/calendar-export/ui/CalendarExportDialog.styles.ts

### createStyles

Создаёт стили CalendarExportDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(_colors: ThemeColors): Readonly<{ meetingList: { gap: number; }; meetingRow: { gap: number; }; meetingInfo: { flex: number; gap: number; }; exportButton: { minHeight: number; paddingVertical: number; }; exportButtonLabel: { textAlign: "center"; lineHeight: number; flexShrink: number; }; }>
```

### getMeetingSelection

Выбирает цвет рамки выбранной карточки встречи.

```typescript
getMeetingSelection(colors: ThemeColors, selected: boolean): ViewStyle
```

## src/features/calendar-export/ui/CalendarExportDialog.tsx

### CalendarExportDialog

Экспортирует выбранную встречу в ICS для импорта в Яндекс Календарь.

```typescript
CalendarExportDialog({ controller, }: { controller: { store: Store; setDialog: (dialog: DialogName) => void; showToast: (type: ToastType, message: string) => void; meeting?: Meeting; exportMeeting: (id: string) => void; update: (patch: Partial<Store>) => void; }; }): React.JSX.Element
```

## src/features/calendar-export/lib/exportCalendar.ts

### exportCalendar

Экспортирует календарный файл встречи.

```typescript
exportCalendar(text: string, id: string): Promise<void>
```

## src/app/model/useAppController.ts

### useAppController

Координатор интерфейса: вызывает API и отображает подтверждённые сервером данные.
Права, переходы статусов и подсчёт победителя проверяются серверными сервисами.

```typescript
useAppController(): { store: Store; loaded: boolean; screen: Screen; setScreen: React.Dispatch<React.SetStateAction<Screen>>; selected: string; dialog: DialogName; setDialog: React.Dispatch<React.SetStateAction<DialogName>>; booking: Restaurant | undefined; meetingSection: "active" | "completed"; setMeetingSection: React.Dispatch<React.SetStateAction<"active" | "completed">>; search: string; setSearch: React.Dispatch<React.SetStateAction<string>>; inviteName: string; setInviteName: React.Dispatch<React.SetStateAction<string>>; editName: string; setEditName: React.Dispatch<React.SetStateAction<string>>; editEmail: string; setEditEmail: React.Dispatch<React.SetStateAction<string>>; toast: ToastNotification | null; showToast: (type: ToastType, message: string) => void; dismissToast: () => void; filterOpenNow: boolean; setFilterOpenNow: React.Dispatch<React.SetStateAction<boolean>>; filterQuery: string; setFilterQuery: React.Dispatch<React.SetStateAction<string>>; filterBudget: string; setFilterBudget: React.Dispatch<React.SetStateAction<string>>; filterCuisine: string[]; setFilterCuisine: React.Dispatch<React.SetStateAction<string[]>>; meeting: Meeting | undefined; update: (patch: Partial<Store>) => void; leader: () => Restaurant | undefined; matchingMeetings: Meeting[]; openMeeting: (id: string) => void; openChat: (id: string, origin?: "list" | "meeting") => void; removeCandidate: (id: string) => void; book: (r: Restaurant | undefined) => void; share: () => Promise<void>; vote: (id: string) => void; pickAttachment: () => Promise<void>; pickAvatar: () => Promise<void>; goBack: () => void; isTabs: boolean; title: string; saveMeeting: (m: Meeting) => Promise<void>; toggleMessageLike: (id: string) => void; sendMessage: (text: string) => Promise<void>; enterSession: (name: string, email: string, password: string) => Promise<void>; confirmCurrentBooking: () => Promise<void>; cancelCurrentBooking: () => Promise<void>; selectLeader: () => Promise<void>; saveProfile: () => Promise<void>; inviteParticipant: () => Promise<void>; removeParticipant: (id: string) => void; sharePlaceInChat: () => Promise<void>; signOut: () => Promise<void>; fontsLoaded: boolean; fontError: Error | null; busy: boolean; propose: (r: Restaurant) => Promise<void>; recommend: () => Promise<void>; exportMeeting: (id: string) => Promise<void>; loadOlderMessages: () => Promise<void>; hasOlderMessages: boolean; discoveryBusy: boolean; discoveryError: string; refreshMeetings: () => Promise<void>; }
```

### dismissToast

Закрывает уведомление.

```typescript
dismissToast(): void
```

### run

Выполняет действие с обработкой ошибок.

```typescript
run(action: () => Promise<void>): Promise<void>
```

### refresh

Загружает актуальные данные пользователя и встреч.

```typescript
refresh(): undefined
```

### accept

Принимает приглашение по токену.

```typescript
accept(url: string): void
```

### acceptInvitation

Обрабатывает принятие приглашения пользователем.

```typescript
acceptInvitation(): Promise<void>
```

### requireMeeting

Возвращает текущую встречу или сообщает об отсутствии выбора.

```typescript
requireMeeting(): Meeting
```

### mutate

Выполняет изменение на сервере и обновляет данные.

```typescript
mutate(path: string, method: string, body?: unknown): Promise<void>
```

### update

Обновляет поля состояния приложения.

```typescript
update(patch: Partial<Store>): void
```

### enterSession

Выполняет вход или регистрацию.

```typescript
enterSession(name: string, email: string, password: string): Promise<void>
```

### signOut

Завершает текущую сессию.

```typescript
signOut(): Promise<void>
```

### openMeeting

Открывает подробности встречи.

```typescript
openMeeting(id: string): void
```

### openChat

Открывает переписку встречи.

```typescript
openChat(id: string, origin?: "list" | "meeting"): void
```

### book

Открывает диалог бронирования заведения.

```typescript
book(r: Restaurant | undefined): void
```

### leader

Возвращает лидера голосования.

```typescript
leader(): Restaurant | undefined
```

### saveMeeting

Сохраняет встречу через API.

```typescript
saveMeeting(m: Meeting): Promise<void>
```

### vote

Отправляет голос за заведение.

```typescript
vote(id: string): void
```

### removeCandidate

Удаляет вариант заведения из голосования.

```typescript
removeCandidate(id: string): void
```

### selectLeader

Подтверждает выбор победителя на сервере.

```typescript
selectLeader(): Promise<void>
```

### confirmCurrentBooking

Подтверждает бронирование.

```typescript
confirmCurrentBooking(): Promise<void>
```

### cancelCurrentBooking

Отменяет бронирование.

```typescript
cancelCurrentBooking(): Promise<void>
```

### inviteParticipant

Добавляет участника встречи по email.

```typescript
inviteParticipant(): Promise<void>
```

### removeParticipant

Удаляет участника встречи.

```typescript
removeParticipant(id: string): void
```

### share

Создаёт ссылку приглашения и открывает меню отправки.

```typescript
share(): Promise<void>
```

### sendMessage

Отправляет сообщение текущей встречи.

```typescript
sendMessage(text: string): Promise<void>
```

### toggleMessageLike

Переключает реакцию на сообщение.

```typescript
toggleMessageLike(id: string): void
```

### pickAttachment

Выбирает и загружает вложение для сообщения.

```typescript
pickAttachment(): Promise<void>
```

### pickAvatar

Выбирает и загружает изображение профиля.

```typescript
pickAvatar(): Promise<void>
```

### saveProfile

Сохраняет изменения профиля.

```typescript
saveProfile(): Promise<void>
```

### sharePlaceInChat

Отправляет предложение заведения в чат.

```typescript
sharePlaceInChat(): Promise<void>
```

### propose

Добавляет заведение в варианты встречи.

```typescript
propose(r: Restaurant): Promise<void>
```

### recommend

Обновляет автоматические варианты заведений.

```typescript
recommend(): Promise<void>
```

### exportMeeting

Запрашивает и экспортирует календарное событие.

```typescript
exportMeeting(id: string): Promise<void>
```

### loadOlderMessages

Загружает предыдущую страницу сообщений.

```typescript
loadOlderMessages(): Promise<void>
```

### goBack

Возвращает на предыдущий экран.

```typescript
goBack(): void
```

## src/features/attach-message/ui/AttachmentDialog.tsx

### AttachmentDialog

Предлагает выбрать файл или отправить сведения о месте в чат.

```typescript
AttachmentDialog({ controller, }: { controller: { sharePlaceInChat: () => void; pickAttachment: () => Promise<void>; }; }): React.JSX.Element
```

## src/features/booking/ui/BookingDialog.styles.ts

### createStyles

Создаёт стили BookingDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ restaurantSummary: { backgroundColor: string; padding: number; borderRadius: number; gap: number; }; restaurantImage: { width: number; height: number; borderRadius: number; }; restaurantInfo: { flex: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; restaurantDescription: { color: string; fontSize: number; }; contactList: { borderRadius: number; borderWidth: number; borderColor: string; overflow: "hidden"; }; firstContactRow: { padding: number; }; contactRow: { padding: number; borderTopWidth: number; borderColor: string; }; contactLabel: { color: string; fontSize: number; }; contactLink: { color: string; fontSize: number; textDecorationLine: "underline"; }; }>
```

## src/features/booking/ui/BookingDialog.tsx

### BookingDialog

Показывает контакты ресторана и доступные действия подтверждения или отмены локальной брони.

```typescript
BookingDialog({ controller, }: { controller: { confirmCurrentBooking: () => void; booking: Restaurant; showToast: (type: ToastType, message: string) => void; cancelCurrentBooking: () => void; meeting: Meeting; }; }): React.JSX.Element
```

## src/features/edit-profile/ui/EditProfileDialog.tsx

### EditProfileDialog

Показывает редактируемые имя и email, выбор фотографии и сохранение профиля.

```typescript
EditProfileDialog({ controller, }: { controller: { saveProfile: () => void; editName: string; setEditName: (value: string) => void; editEmail: string; setEditEmail: (value: string) => void; pickAvatar: () => Promise<void>; }; }): React.JSX.Element
```

## src/shared/api/useCatalogFilters.ts

### useCatalogFilters

Загружает варианты фильтров из текущего каталога БД.

```typescript
useCatalogFilters(): { options: CatalogFilters | null; error: string; retry: () => void; }
```

## src/features/filter-restaurants/ui/FiltersDialog.styles.ts

### createStyles

Создаёт стили FiltersDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): Readonly<{ wrap: { flexDirection: "row"; flexWrap: "wrap"; gap: number; }; }>
```

## src/features/filter-restaurants/ui/FiltersDialog.tsx

### FiltersDialog

Передаёт выбор кухни и среднего чека.

```typescript
FiltersDialog({ controller, }: { controller: { setDialog: (dialog: DialogName) => void; showToast: (type: ToastType, message: string) => void; setFilterOpenNow?: (value: boolean) => void; setFilterQuery?: (value: string) => void; filterBudget: string; setFilterBudget: (value: string) => void; filterCuisine: string[]; setFilterCuisine: (value: string[]) => void; }; }): React.JSX.Element
```

## src/features/manage-participants/ui/InviteDialog.tsx

### InviteDialog

Показывает поле имени и действия добавления участника или отправки приглашения.

```typescript
InviteDialog({ controller, }: { controller: { inviteParticipant: () => void; inviteName: string; setInviteName: (value: string) => void; share: () => void; meeting: Meeting; }; }): React.JSX.Element
```

## src/features/manage-participants/ui/ParticipantsDialog.styles.ts

### createStyles

Создаёт стили ParticipantsDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ participantInfo: { gap: number; }; participantName: { color: string; fontSize: number; }; }>
```

## src/features/manage-participants/ui/ParticipantsDialog.tsx

### ParticipantsDialog

Показывает участников встречи, удаление и переход к приглашению.

```typescript
ParticipantsDialog({ controller, }: { controller: { setDialog: (dialog: DialogName) => void; meeting: Meeting; removeParticipant: (name: string) => void; }; }): React.JSX.Element
```

## src/features/meeting-actions/ui/MeetingActionsDialog.tsx

### MeetingActionsDialog

Показывает действия встречи с учётом её статуса.

```typescript
MeetingActionsDialog({ controller, }: { controller: { selectLeader: () => void; setScreen: (screen: Screen) => void; setDialog: (dialog: DialogName) => void; cancelCurrentBooking: () => void; meeting: Meeting; share: () => void; }; }): React.JSX.Element
```

## src/pages/auth/ui/Auth.styles.ts

### createStyles

Создаёт стили Auth; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ root: { padding: number; paddingTop: number; }; logo: { fontSize: number; fontWeight: "600"; color: string; marginBottom: number; }; title: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; subtitle: { fontSize: number; lineHeight: number; color: string; marginTop: number; }; backButton: { flexDirection: "row"; gap: number; alignItems: "center"; marginBottom: number; }; backLabel: { color: string; }; logoAccent: { color: string; }; fields: { gap: number; marginTop: number; }; passwordContainer: { position: "relative"; }; passwordInput: { paddingRight: number; }; passwordHint: { color: string; fontSize: number; lineHeight: number; }; passwordToggle: { position: "absolute"; right: number; bottom: number; }; passwordToggleLabel: { color: string; fontSize: number; }; error: { color: string; marginTop: number; }; submitButton: { marginTop: number; }; switchButton: { marginTop: number; padding: number; alignItems: "center"; }; switchLabel: { color: string; fontSize: number; }; switchLink: { color: string; }; }>
```

## src/pages/auth/model/validation.ts

### validateAuth

Проверяет поля регистрации или входа перед отправкой на сервер, не изменяя ввод.

```typescript
validateAuth(values: AuthValues): { name: string; email: string; password: string; confirmPassword: string; }
```

## src/pages/auth/ui/Auth.tsx

### Auth

Показывает форму входа или регистрации и проверяет заполнение полей перед вызовом onEnter.

```typescript
Auth({ register, onSwitch, onBack, onEnter, }: { register: boolean; onSwitch: () => void; onBack: () => void; onEnter: (name: string, email: string, password: string) => void; }): React.JSX.Element
```

## src/pages/chat/model/messages.ts

### messageDay

Возвращает день сообщения для группировки.

```typescript
messageDay(message?: Message): string
```

### continuesGroup

Проверяет продолжение группы сообщений одного автора.

```typescript
continuesGroup(previous: Message | undefined, current: Message): boolean
```

### dayLabel

Форматирует подпись дня переписки.

```typescript
dayLabel(message: Message): string
```

## src/pages/chat/ui/Chat.styles.ts

### createStyles

Создаёт стили Chat; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ root: { flex: number; }; loadOlder: { alignSelf: "center"; padding: number; }; leaderText: { flex: number; marginHorizontal: number; }; confirmationText: { flex: number; }; groupContinuation: { marginTop: number; }; avatarSpace: { width: number; }; messageTime: { alignSelf: "flex-end"; fontSize: number; color: string; marginTop: number; }; leaderCard: { marginHorizontal: number; marginTop: number; padding: number; borderRadius: number; backgroundColor: string; }; leaderLabel: { fontSize: number; color: string; }; leaderTitle: { fontSize: number; color: string; marginTop: number; }; messagesContent: { padding: number; gap: number; }; dateBadge: { alignSelf: "center"; backgroundColor: string; padding: number; borderRadius: number; fontSize: number; color: string; }; systemMessage: { textAlign: "center"; color: string; fontSize: number; paddingVertical: number; }; confirmationCard: { backgroundColor: string; borderRadius: number; borderWidth: number; borderColor: string; padding: number; }; confirmationRow: { justifyContent: "flex-start"; gap: number; }; confirmationIcon: { backgroundColor: string; borderRadius: number; padding: number; }; confirmationTitle: { fontWeight: "600"; color: string; }; confirmationDescription: { marginTop: number; }; messageContainer: { maxWidth: string; }; messageMeta: { fontSize: number; color: string; marginBottom: number; }; messageRow: { gap: number; alignItems: "flex-end"; }; messageBubble: { flexShrink: number; maxWidth: number; borderRadius: number; paddingHorizontal: number; paddingVertical: number; }; attachment: { width: number; height: number; borderRadius: number; marginBottom: number; }; messageText: { fontSize: number; lineHeight: number; color: string; }; reactionBadge: { alignSelf: "flex-start"; paddingHorizontal: number; paddingVertical: number; borderRadius: number; borderWidth: number; borderColor: string; marginTop: number; backgroundColor: string; flexDirection: "row"; alignItems: "center"; gap: number; }; reactionCount: { fontSize: number; fontWeight: "600"; color: string; }; composer: { padding: number; gap: number; borderTopWidth: number; borderColor: string; }; messageInput: { flex: number; backgroundColor: string; borderRadius: number; paddingHorizontal: number; paddingVertical: number; color: string; fontSize: number; maxHeight: number; }; sendButton: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; }>
```

### getMessageAlignment

Выравнивает своё сообщение справа, чужое — слева.

```typescript
getMessageAlignment(mine: boolean | undefined): ViewStyle
```

### getMessageMetaInset

Выбирает отступ подписи сообщения с учётом аватара.

```typescript
getMessageMetaInset(mine: boolean | undefined): ViewStyle
```

### getMessageBackground

Выбирает фон своего или чужого сообщения.

```typescript
getMessageBackground(colors: ThemeColors, mine: boolean | undefined): ViewStyle
```

### getReactionInset

Выбирает отступ реакции под своим или чужим сообщением.

```typescript
getReactionInset(mine: boolean | undefined): ViewStyle
```

## src/pages/chat/ui/Chat.tsx

### Chat

Показывает сообщения выбранной встречи, реакции и поле отправки текста.

```typescript
Chat({ meeting, messages, leader, onLeader, onSend, onLike, onAttach, onLoadOlder, hasOlderMessages, }: { meeting: Meeting; messages: Message[]; leader: string; onLeader: () => void; onSend: (text: string) => void; onLike: (id: string) => void; onAttach: () => void; onLoadOlder?: () => void; hasOlderMessages?: boolean; }): React.JSX.Element
```

### send

Отправляет непустой текст без пробелов по краям и очищает поле ввода.

```typescript
send(): void
```

## src/pages/chat/ui/ChatsScreen.tsx

### messageTime

Форматирует время сообщения.

```typescript
messageTime(value?: string): string
```

### ChatsScreen

Показывает список переписок встреч.

```typescript
ChatsScreen({ meetings, userId, onOpen }: { meetings: Meeting[]; userId?: string; onOpen: (id: string) => void; }): React.JSX.Element
```

### createStyles

Создаёт стили для текущей темы.

```typescript
createStyles(colors: ThemeColors): Readonly<{ root: { flex: number; }; heading: { fontSize: number; fontWeight: "600"; color: string; padding: number; paddingBottom: number; }; search: { marginHorizontal: number; marginBottom: number; paddingHorizontal: number; height: number; gap: number; flexDirection: "row"; alignItems: "center"; backgroundColor: string; borderRadius: number; }; input: { flex: number; fontSize: number; color: string; height: string; paddingVertical: number; }; list: { paddingBottom: number; }; row: { flexDirection: "row"; alignItems: "center"; gap: number; paddingVertical: number; paddingHorizontal: number; }; avatar: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; summary: { flex: number; minWidth: number; borderBottomWidth: number; borderColor: string; paddingBottom: number; marginBottom: number; }; titleRow: { flexDirection: "row"; alignItems: "center"; gap: number; }; title: { flex: number; color: string; fontWeight: "600"; fontSize: number; }; time: { fontSize: number; color: string; }; preview: { fontSize: number; color: string; marginTop: number; lineHeight: number; }; author: { color: string; }; empty: { alignItems: "center"; padding: number; gap: number; marginTop: number; }; emptyTitle: { fontSize: number; fontWeight: "600"; color: string; }; emptyText: { color: string; textAlign: "center"; lineHeight: number; }; }>
```

## src/shared/ui/PlacePhoto.tsx

### PlacePhoto

Показывает встроенное фото карточки, индикатор загрузки или заглушку при ошибке.

```typescript
PlacePhoto({ id, name, image, style }: { id: string; name: string; image?: ImageSourcePropType; style: StyleProp<ViewStyle>; }): React.JSX.Element
```

## src/shared/ui/RestaurantMap.tsx

### RestaurantMap

Встраивает карту и связывает её события с приложением.

```typescript
RestaurantMap({ items, onEvent, selectedId, center, mode, }: { items: { id: string; name: string; latitude?: number; longitude?: number; }[]; onEvent: (event: MapEvent) => void; selectedId?: string; mode?: "catalog" | "meeting"; center?: { latitude: number; longitude: number; }; }): React.JSX.Element
```

### send

Передаёт состояние во встроенную карту.

```typescript
send(): void
```

### receive

Обрабатывает сообщение встроенной карты.

```typescript
receive(data: MapEvent): void
```

### listener

Обрабатывает событие обмена с картой.

```typescript
listener(e: MessageEvent): void
```

## src/pages/map/ui/MapScreen.styles.ts

### createStyles

Создаёт стили для текущей темы.

```typescript
createStyles(colors: ThemeColors): Readonly<{ root: { flex: number; overflow: "hidden"; backgroundColor: string; }; top: { position: "absolute"; top: number; left: number; right: number; gap: number; }; search: { height: number; flexDirection: "row"; alignItems: "center"; gap: number; backgroundColor: string; borderRadius: number; paddingHorizontal: number; boxShadow: string; }; searchInput: { flex: number; minWidth: number; fontSize: number; color: string; paddingVertical: number; }; filterContent: { gap: number; paddingRight: number; }; filter: { paddingVertical: number; paddingHorizontal: number; backgroundColor: string; borderRadius: number; borderWidth: number; borderColor: string; }; selectedFilter: { backgroundColor: string; borderColor: string; }; filterLabel: { color: string; fontSize: number; }; bottom: { position: "absolute"; bottom: number; left: number; right: number; backgroundColor: string; borderRadius: number; padding: number; boxShadow: string; }; restaurantRow: { flexDirection: "row"; alignItems: "center"; gap: number; minHeight: number; }; placeIcon: { width: number; height: number; borderRadius: number; flexShrink: number; backgroundColor: string; }; restaurantInfo: { flex: number; minWidth: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; restaurantDescription: { fontSize: number; color: string; lineHeight: number; }; actionsRow: { gap: number; marginTop: number; }; routeButton: { flex: number; minHeight: number; borderRadius: number; paddingHorizontal: number; backgroundColor: string; borderWidth: number; }; bookingButton: { flex: number; minHeight: number; borderRadius: number; paddingHorizontal: number; }; actionLabel: { fontSize: number; fontWeight: "500"; }; searchResults: { backgroundColor: string; borderRadius: number; padding: number; gap: number; boxShadow: string; }; result: { padding: number; gap: number; }; searchResultLabel: { color: string; fontSize: number; }; resultMeta: { fontSize: number; color: string; }; notice: { backgroundColor: string; borderRadius: number; padding: number; gap: number; }; noticeText: { fontSize: number; color: string; }; retry: { fontSize: number; color: string; textAlign: "center"; paddingVertical: number; }; emptyState: { color: string; textAlign: "center"; padding: number; fontSize: number; lineHeight: number; }; detailsBackdrop: { flex: number; justifyContent: "flex-end"; backgroundColor: string; padding: number; }; detailsSheet: { maxHeight: string; backgroundColor: string; borderRadius: number; padding: number; }; detailsTitle: { fontSize: number; fontWeight: "600"; color: string; }; detailsContent: { gap: number; paddingTop: number; paddingBottom: number; }; detailsText: { fontSize: number; lineHeight: number; color: string; }; detailLink: { fontSize: number; color: string; paddingVertical: number; }; }>
```

## src/pages/map/ui/MapScreen.tsx

### MapScreen

Показывает карту, фильтры и карточку заведения.

```typescript
MapScreen({ mode, meeting, filters, onFilters, onFilterChange, onBook, onPropose, onChanged, initialRestaurant, }: { mode?: "catalog" | "meeting"; meeting?: Meeting; filters: MapFilters; onFilters: () => void; onFilterChange?: (patch: Partial<MapFilters>) => void; onBook: (r: Restaurant) => void; onPropose?: (r: Restaurant) => void; onChanged?: () => Promise<void>; initialRestaurant?: Restaurant; }): React.JSX.Element
```

### setQuery

Сохраняет поисковую строку карты между переходами по вкладкам.

```typescript
setQuery(value: string): void
```

### setOpen

Сохраняет фильтр открытых заведений между переходами по вкладкам.

```typescript
setOpen(value: boolean): void
```

## src/pages/meeting-detail/ui/MeetingDetail.styles.ts

### createStyles

Создаёт стили MeetingDetail; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ removeRestaurant: { position: "absolute"; right: number; top: number; width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; borderWidth: number; borderColor: string; }; restaurant: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number; overflow: "hidden"; boxShadow: string; }; count: { fontSize: number; color: string; backgroundColor: string; paddingVertical: number; paddingHorizontal: number; borderRadius: number; }; restaurantImage: { width: string; height: number; }; restaurantInfo: { padding: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; rating: { color: string; fontSize: number; }; priceRow: { marginTop: number; }; price: { fontSize: number; fontWeight: "600"; color: string; }; priceHint: { fontSize: number; color: string; marginTop: number; }; voteButtonLabel: { fontSize: number; fontWeight: "500"; }; voteButton: { minHeight: number; borderRadius: number; paddingHorizontal: number; }; contentContainer: { paddingBottom: number; }; meetingHeader: { padding: number; borderBottomWidth: number; borderColor: string; }; meetingStatus: { color: string; fontSize: number; textTransform: "uppercase"; marginBottom: number; }; meetingTitle: { fontSize: number; fontWeight: "600"; color: string; marginBottom: number; }; dateRow: { justifyContent: "flex-start"; gap: number; }; content: { padding: number; gap: number; }; participantsHeader: { marginTop: number; }; manageParticipantsLink: { color: string; fontSize: number; }; participantsCount: { fontSize: number; fontWeight: "600"; color: string; }; preferencesCard: { padding: number; }; preferencesLabel: { color: string; fontSize: number; }; editPreferencesButtonLabel: { fontSize: number; fontWeight: "500"; color: string; }; editPreferencesButton: { minHeight: number; paddingHorizontal: number; backgroundColor: string; borderRadius: number; }; divider: { height: number; backgroundColor: string; marginHorizontal: number; }; placesHint: { color: string; fontSize: number; marginTop: number; }; votingSection: { marginVertical: number; gap: number; }; progressTrack: { height: number; borderRadius: number; backgroundColor: string; overflow: "hidden"; }; progressBar: { height: number; backgroundColor: string; }; votingRow: { gap: number; }; votingName: { color: string; fontSize: number; }; votingCount: { color: string; fontSize: number; fontWeight: "600"; }; footer: { padding: number; borderTopWidth: number; borderColor: string; gap: number; }; }>
```

### getVotingProgress

Вычисляет процент проголосовавших, ограничивая ширину 100% и исключая деление на ноль.

```typescript
getVotingProgress(votes: number, participants: number): ViewStyle
```

## src/pages/meeting-detail/ui/MeetingDetail.tsx

### RestaurantCard

Показывает сведения об одном ресторане и кнопку передачи голоса родителю.

```typescript
RestaurantCard({ restaurant: r, onVote, voted, disabled, onOpen, onRemove, }: { restaurant: Restaurant; onVote: () => void; voted: boolean; disabled?: boolean; onOpen?: () => void; onRemove?: () => void; }): React.JSX.Element
```

### MeetingDetail

Показывает участников, варианты ресторанов и результаты голосования встречи.

```typescript
MeetingDetail({ meeting: m, onVote, onEdit, onManage, onChat, onBook, discoveryBusy, discoveryError, onMap, currentUserId, onRemoveCandidate, }: { meeting: Meeting; onVote: (id: string) => void; onEdit: () => void; onManage: () => void; onChat: () => void; onBook: () => void; onRecommend?: () => void; discoveryBusy?: boolean; discoveryError?: string; onMap?: (restaurant?: Restaurant) => void; currentUserId?: string; onRemoveCandidate?: (id: string) => void; }): React.JSX.Element
```

## src/shared/lib/participants.ts

### validateParticipant

Проверяет имя участника и исключает повторы без учёта регистра.

```typescript
validateParticipant(name: string, participants?: string[]): "" | "Введите имя участника" | "Имя должно содержать от 2 до 30 символов" | "Допустимы буквы, пробел и дефис; пробелы по краям запрещены" | "Этот участник уже добавлен"
```

## src/pages/meeting-form/model/validation.ts

### validateMeetingForm

Проверяет поля перед сохранением встречи, разрешая прежнее время редактируемой встречи.

```typescript
validateMeetingForm(values: FormValues, original?: Meeting, now?: Date, allowedCuisines?: readonly string[], allowedFormats?: readonly string[]): "" | "Введите имя участника" | "Имя должно содержать от 2 до 30 символов" | "Допустимы буквы, пробел и дефис; пробелы по краям запрещены" | "Этот участник уже добавлен" | "Введите название встречи" | "Название должно содержать от 2 до 100 символов" | "Название должно содержать букву или цифру, без переносов строк и управляющих символов" | "Выберите корректные дату и время" | "Дата и время встречи должны быть позже текущего момента" | "Бюджет должен быть от 500 до 100000 ₽ с шагом 100 ₽" | "Выберите кухни из списка без повторов" | "Выберите формат встречи из списка"
```

## src/pages/meeting-form/ui/MeetingForm.styles.ts

### createStyles

Создаёт стили MeetingForm; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ grid: { flexDirection: "row"; flexWrap: "wrap"; }; week: { width: string; textAlign: "center"; fontSize: number; color: string; paddingVertical: number; }; day: { width: string; height: number; alignItems: "center"; justifyContent: "center"; }; wrap: { flexDirection: "row"; flexWrap: "wrap"; gap: number; }; hint: { fontSize: number; color: string; }; contentContainer: { paddingHorizontal: number; paddingBottom: number; }; titleSection: { paddingBottom: number; borderBottomWidth: number; }; titleInput: { height: number; paddingVertical: number; }; previousMonthButton: { padding: number; }; monthLabel: { fontSize: number; fontWeight: "600"; color: string; }; nextMonthButton: { padding: number; }; dayLabel: { fontSize: number; }; timeSelectors: { flexDirection: "row"; alignItems: "flex-end"; gap: number; marginTop: number; }; timeSeparator: { fontSize: number; fontWeight: "400"; color: string; paddingBottom: number; }; budgetLabel: { fontSize: number; fontWeight: "500"; color: string; }; formatSection: { borderBottomWidth: number; }; formatSelector: { flexDirection: "row"; padding: number; backgroundColor: string; borderRadius: number; }; formatOption: { flex: number; paddingVertical: number; alignItems: "center"; borderRadius: number; }; formatOptionLabel: { fontSize: number; }; error: { color: string; marginBottom: number; }; }>
```

### getSelectedDay

Возвращает фон и скругление выбранного дня.

```typescript
getSelectedDay(colors: ThemeColors): ViewStyle
```

### getDayLabel

Возвращает цвет и насыщенность номера дня.

```typescript
getDayLabel(colors: ThemeColors, selected: boolean): TextStyle
```

### getFormatBackground

Возвращает фон выбранного варианта формата встречи.

```typescript
getFormatBackground(colors: ThemeColors, selected: boolean): ViewStyle
```

### getFormatLabel

Возвращает цвет и насыщенность подписи формата встречи.

```typescript
getFormatLabel(colors: ThemeColors, selected: boolean): TextStyle
```

## src/pages/meeting-form/ui/MeetingForm.tsx

### MeetingForm

Собирает данные новой встречи или изменяет предпочтения существующей встречи.

```typescript
MeetingForm({ meeting, onSave, preferencesOnly, }: { meeting?: Meeting; onSave: (m: Meeting) => void; preferencesOnly?: boolean; }): React.JSX.Element
```

### shift

Переключает месяц календаря с переходом между годами и выбирает первый день.

```typescript
shift(n: number): void
```

## src/pages/meetings/ui/MeetingsScreen.styles.ts

### createStyles

Создаёт стили MeetingsScreen; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ search: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number; paddingHorizontal: number; height: number; flexDirection: "row"; alignItems: "center"; gap: number; }; count: { fontSize: number; color: string; backgroundColor: string; width: number; height: number; lineHeight: number; textAlign: "center"; borderRadius: number; overflow: "hidden"; }; badge: { fontSize: number; paddingVertical: number; paddingHorizontal: number; borderRadius: number; }; fab: { position: "absolute"; right: number; bottom: number; width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; boxShadow: string; }; root: { flex: number; }; contentContainer: { padding: number; paddingBottom: number; }; greetingRow: { marginBottom: number; }; dateLabel: { color: string; fontSize: number; marginBottom: number; }; greeting: { color: string; fontSize: number; fontWeight: "700"; }; profileButton: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; avatarInitial: { fontSize: number; fontWeight: "600"; color: string; }; searchInput: { flex: number; fontSize: number; color: string; }; sectionHeader: { marginTop: number; marginBottom: number; }; tabsRow: { gap: number; }; tabLabel: { fontSize: number; }; meetingCard: { marginBottom: number; padding: number; boxShadow: string; }; meetingTitle: { fontSize: number; fontWeight: "600"; color: string; }; metadataRow: { justifyContent: "flex-start"; gap: number; }; dateRow: { gap: number; }; dateText: { fontSize: number; color: string; }; participantsRow: { gap: number; }; participantsText: { fontSize: number; color: string; }; emptyState: { padding: number; textAlign: "center"; }; }>
```

### getSectionLabel

Возвращает цвет активной или неактивной вкладки встреч.

```typescript
getSectionLabel(colors: ThemeColors, selected: boolean): TextStyle
```

### getMeetingBadge

Выбирает цвет текста и фон статуса встречи.

```typescript
getMeetingBadge(colors: ThemeColors, status: string): TextStyle
```

## src/pages/meetings/ui/MeetingsScreen.tsx

### MeetingsScreen

Показывает отфильтрованные встречи, поиск и вкладки активных и завершённых встреч.

```typescript
MeetingsScreen({ controller, }: { controller: { store: Store; setScreen: (screen: Screen) => void; meetingSection: "active" | "completed"; setMeetingSection: (section: "active" | "completed") => void; search: string; setSearch: (value: string) => void; matchingMeetings: Meeting[]; openMeeting: (id: string) => void; }; }): React.JSX.Element
```

## src/pages/onboarding/ui/Onboarding.styles.ts

### createStyles

Создаёт стили Onboarding; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ root: { flex: number; paddingHorizontal: number; paddingTop: number; }; logo: { fontSize: number; fontWeight: "700"; color: string; }; art: { width: string; borderRadius: number; overflow: "hidden"; marginBottom: number; }; title: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; marginBottom: number; }; text: { fontSize: number; lineHeight: number; color: string; }; logoAccent: { color: string; }; content: { flex: number; }; illustrationSpacing: { marginTop: number; marginBottom: number; }; pagination: { justifyContent: "center"; gap: number; marginBottom: number; }; indicator: { height: number; borderRadius: number; }; nextButtonLabel: { fontSize: number; fontWeight: "600"; }; skipButton: { paddingVertical: number; alignItems: "center"; }; skipLabel: { color: string; fontSize: number; }; }>
```

### getIllustrationSize

Рассчитывает высоту иллюстрации с сохранением её пропорций.

```typescript
getIllustrationSize(width: number): ViewStyle
```

### getSlideIndicator

Возвращает размер и цвет индикатора текущего слайда.

```typescript
getSlideIndicator(colors: ThemeColors, selected: boolean): ViewStyle
```

## src/pages/onboarding/ui/Onboarding.tsx

### Onboarding

Показывает ознакомительные слайды и передаёт действия завершения или входа родителю.

```typescript
Onboarding({ onDone, onLogin, }: { onDone: () => void; onLogin: () => void; }): React.JSX.Element
```

## src/pages/profile/ui/ProfileScreen.styles.ts

### createStyles

Создаёт стили ProfileScreen; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ sectionLabel: { fontSize: number; fontWeight: "600"; letterSpacing: number; color: string; }; settingIcon: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; profileHeader: { backgroundColor: string; alignItems: "center"; paddingVertical: number; gap: number; }; avatarButton: { width: number; height: number; backgroundColor: string; borderRadius: number; borderWidth: number; borderColor: string; alignItems: "center"; justifyContent: "center"; marginBottom: number; }; avatarImage: { width: number; height: number; borderRadius: number; }; avatarInitial: { fontSize: number; color: string; }; editBadge: { position: "absolute"; right: number; bottom: number; backgroundColor: string; borderWidth: number; borderColor: string; padding: number; borderRadius: number; }; profileName: { fontSize: number; fontWeight: "600"; color: string; }; profileEmail: { fontSize: number; fontWeight: "600"; color: string; }; content: { padding: number; gap: number; }; calendarCard: { backgroundColor: string; }; calendarRow: { gap: number; }; calendarIconLabel: { color: string; fontSize: number; }; calendarInfo: { flex: number; }; settingTitle: { fontSize: number; color: string; }; calendarStatus: { fontSize: number; marginTop: number; }; configureLink: { fontSize: number; fontWeight: "600"; color: string; }; settingsCard: { backgroundColor: string; padding: number; gap: number; }; settingRow: { padding: number; gap: number; borderColor: string; }; settingInfo: { flex: number; }; settingLabel: { fontSize: number; color: string; }; settingDescription: { fontSize: number; color: string; marginTop: number; }; signOutButton: { height: number; borderRadius: number; backgroundColor: string; borderWidth: number; borderColor: string; alignItems: "center"; justifyContent: "center"; flexDirection: "row"; gap: number; }; signOutLabel: { fontSize: number; color: string; }; }>
```

### getCalendarStatus

Выбирает цвет текста состояния переключателя календаря.

```typescript
getCalendarStatus(colors: ThemeColors, enabled: boolean): TextStyle
```

### getSettingDivider

Добавляет нижний разделитель только первой строке настроек.

```typescript
getSettingDivider(index: number): ViewStyle
```

## src/pages/profile/ui/ProfileScreen.tsx

### ProfileScreen

Показывает профиль и передаёт изменения настроек и запрос выхода родителю.

```typescript
ProfileScreen({ controller, }: { controller: { signOut: () => void; store: Store; setDialog: (dialog: DialogName) => void; setEditName: (value: string) => void; setEditEmail: (value: string) => void; update: (patch: Partial<Store>) => void; }; }): React.JSX.Element
```

## src/shared/ui/Toast.styles.ts

### createStyles

Создаёт стили Toast; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ card: { position: "absolute"; left: number; right: number; zIndex: number; elevation: number; backgroundColor: string; borderRadius: number; borderLeftWidth: number; overflow: "hidden"; boxShadow: string; }; row: { flexDirection: "row"; alignItems: "center"; gap: number; padding: number; minHeight: number; }; icon: { width: number; height: number; borderRadius: number; alignItems: "center"; justifyContent: "center"; }; symbol: { fontFamily: string; fontSize: number; fontWeight: "700"; color: string; }; text: { flex: number; fontFamily: string; fontSize: number; lineHeight: number; color: string; }; cardBackground: { backgroundColor: string; }; progressTrack: { height: number; backgroundColor: string; }; progressBar: { height: number; }; }>
```

### getToastEntrance

Связывает анимированное появление уведомления с прозрачностью и смещением.

```typescript
getToastEntrance(top: number, entrance: Animated.Value, color: string): { top: number; borderLeftColor: string; opacity: Animated.Value; transform: { translateY: Animated.Interpolation<0 | -20>; }[]; }
```

### getToastIconColor

Возвращает фон значка уведомления.

```typescript
getToastIconColor(color: string): ViewStyle
```

### getToastProgress

Связывает ширину полосы уведомления с анимированным значением.

```typescript
getToastProgress(progress: Animated.Value, color: string): { backgroundColor: string; width: Animated.Interpolation<"100%" | "0%">; }
```

## src/shared/ui/Toast.tsx

### Toast

Показывает анимированное уведомление и кнопку закрытия; время скрытия управляется снаружи.

```typescript
Toast({ text, type, onDismiss, }: { text: string; type: ToastType; onDismiss: () => void; }): React.JSX.Element
```

## src/widgets/dialogs/ui/DialogHost.styles.ts

### createStyles

Создаёт стили DialogHost; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ overlay: { flex: number; backgroundColor: string; justifyContent: "flex-end"; alignItems: "center"; }; dialog: { width: string; maxWidth: number; maxHeight: string; backgroundColor: string; borderTopLeftRadius: number; borderTopRightRadius: number; paddingHorizontal: number; paddingTop: number; paddingBottom: number; }; handle: { width: number; height: number; borderRadius: number; backgroundColor: string; alignSelf: "center"; marginBottom: number; }; dialogBackground: { backgroundColor: string; }; dialogHeader: { marginBottom: number; }; dialogContent: { gap: number; paddingBottom: number; }; closeButton: { alignItems: "center"; padding: number; }; closeLabel: { color: string; fontSize: number; }; }>
```

## src/widgets/dialogs/ui/DialogHost.tsx

### DialogHost

Показывает выбранный диалог в общей модальной оболочке и уведомление над ним.

```typescript
DialogHost({ controller, }: { controller: import("../../../app/model/useAppController").AppController; }): React.JSX.Element
```

## src/widgets/navigation/ui/AppHeader.styles.ts

### createStyles

Создаёт стили AppHeader; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ header: { minHeight: number; paddingHorizontal: number; borderBottomWidth: number; borderColor: string; flexDirection: "row"; alignItems: "center"; }; titleContainer: { flex: number; }; title: { fontSize: number; fontWeight: "600"; color: string; }; onlineStatus: { fontSize: number; color: string; marginTop: number; }; cancelButton: { padding: number; }; cancelLabel: { fontSize: number; color: string; }; }>
```

### getTitleAlignment

Выбирает выравнивание заголовка в зависимости от режима формы.

```typescript
getTitleAlignment(editing: boolean): ViewStyle
```

## src/widgets/navigation/ui/AppHeader.tsx

### AppHeader

Показывает заголовок и действия, соответствующие текущему экрану.

```typescript
AppHeader({ controller, }: { controller: { screen: Screen; setDialog: (dialog: DialogName) => void; meeting?: Meeting; share: () => void; goBack: () => void; title: string; }; }): React.JSX.Element
```

## src/widgets/navigation/ui/BottomNavigation.styles.ts

### createStyles

Создаёт стили BottomNavigation; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): Readonly<{ tabs: { flexDirection: "row"; borderTopWidth: number; borderColor: string; backgroundColor: string; }; tab: { flex: number; alignItems: "center"; gap: number; paddingVertical: number; }; tabLabel: { fontSize: number; }; }>
```

### getTabLabel

Выбирает цвет подписи текущей или неактивной вкладки.

```typescript
getTabLabel(colors: ThemeColors, selected: boolean): TextStyle
```

## src/widgets/navigation/ui/BottomNavigation.tsx

### BottomNavigation

Показывает вкладки основных экранов и передаёт выбранный экран в setScreen.

```typescript
BottomNavigation({ controller, }: { controller: { screen: Screen; setScreen: (screen: Screen) => void; }; }): React.JSX.Element
```

## src/app/App.tsx

### App

Собирает приложение: подключает безопасные отступы, тему и основной интерфейс.

```typescript
App(): React.JSX.Element
```

### AppContent

Выбирает экран по состоянию навигации и передаёт данные и обработчики дочерним компонентам.

```typescript
AppContent({ controller }: { controller: AppController; }): React.JSX.Element
```

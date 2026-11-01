# Сигнатуры Meetly

Сгенерировано из TypeScript. Включены экспортируемые и внутренние именованные функции, обработчики, компоненты и функции стилей. Анонимные обратные вызовы описываются в составе принимающих их функций.

Функций: 144. Классов: 0. В проекте используются функциональные компоненты React; классов нет.

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
Text(props: Native.TextProps, ref: React.ForwardedRef<Native.Text>): React.JSX.Element
```

### TextInput

Показывает поле ввода с цветами темы и передаёт ref внутреннему полю.

```typescript
TextInput(props: Native.TextInputProps, ref: React.ForwardedRef<Native.TextInput>): React.JSX.Element
```

## src/app/App.styles.ts

### createStyles

Создаёт стили App; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { viewport: { flex: number; alignItems: "center"; }; app: { flex: number; width: "100%"; maxWidth: number; backgroundColor: string; }; loadingScreen: { flex: number; alignItems: "center"; justifyContent: "center"; }; loadingLogo: { fontSize: number; color: string; fontWeight: "700"; }; viewportBackground: { backgroundColor: string; }; appBackground: { backgroundColor: string; }; }
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

Возвращает ресторан с наибольшим числом голосов; при равенстве сохраняет порядок демонстрационного каталога.

```typescript
getLeader(meeting: Meeting): Restaurant
```

### voteCount

Считает голоса, отданные за ресторан с указанным идентификатором.

```typescript
voteCount(meeting: Meeting, id: string): number
```

### filterRestaurants

Отбирает рестораны одновременно по бюджету, кухне, расстоянию и поисковой строке.

```typescript
filterRestaurants(filters: MapFilters, query?: string): Restaurant[]
```

### reactionCount

Суммирует реакции других участников и реакцию текущего пользователя.

```typescript
reactionCount(message: Message): number
```

### toggleReaction

Создаёт копию сообщения с переключённой реакцией пользователя, не меняя исходное сообщение.

```typescript
toggleReaction(message: Message): Message
```

### meetingPlace

Возвращает выбранный ресторан или текущего лидера, если ресторан не задан или не найден.

```typescript
meetingPlace(meeting: Meeting): Restaurant
```

### confirmBooking

Возвращает копию встречи с подтверждённой локальной бронью и статусом completed; завершённую встречу не меняет.

```typescript
confirmBooking(meeting: Meeting, restaurantId: string, now?: string): Meeting
```

### cancelBooking

Очищает даты брони и завершения и возвращает selected или voting; другие статусы не меняет.

```typescript
cancelBooking(meeting: Meeting): Meeting
```

## src/app/lib/storage/migrations.ts

### restoreStore

Разбирает JSON, проверяет основные контейнеры и добавляет отсутствующие поля из initialStore; полной проверки вложенных объектов не выполняет.

```typescript
restoreStore(raw: string): Store
```

## src/app/lib/storage/localStore.ts

### loadStore

Читает JSON из AsyncStorage и передаёт его в restoreStore для восстановления состояния.

```typescript
loadStore(): Promise<Store | null>
```

### saveStore

Сериализует состояние и ставит запись в очередь; неудачная предыдущая запись не блокирует следующую.

```typescript
saveStore(store: Store): Promise<void>
```

## src/shared/api/device.ts

### chooseAttachment

Открывает системный выбор файла и возвращает имя, URI и признак изображения либо null при отмене.

```typescript
chooseAttachment(): Promise<{ name: string; uri: string; image: boolean; } | null>
```

### chooseAvatar

Открывает выбор изображения профиля и возвращает URI либо null при отмене.

```typescript
chooseAvatar(): Promise<string | null>
```

### shareText

Открывает системное меню отправки переданного текста.

```typescript
shareText(message: string): Promise<ShareAction>
```

### openExternalLink

Передаёт URI операционной системе для открытия браузера или другого приложения.

```typescript
openExternalLink(url: string): Promise<any>
```

## src/features/share-invitation/lib/shareInvitation.ts

### shareInvitation

Формирует текст приглашения из данных встречи и передаёт его системному меню отправки.

```typescript
shareInvitation(meeting: Meeting): Promise<ShareAction>
```

## src/shared/lib/time.ts

### timeNow

Возвращает текущее местное время устройства в формате часов и минут.

```typescript
timeNow(): string
```

## src/shared/lib/participants.ts

### validateParticipant

Проверяет имя участника и исключает повторы без учёта регистра.

```typescript
validateParticipant(name: string, participants?: string[]): "" | "Введите имя участника" | "Имя должно содержать от 2 до 30 символов" | "Допустимы буквы, пробел и дефис; пробелы по краям запрещены" | "Этот участник уже добавлен"
```

## src/app/model/usePersistentStore.ts

### usePersistentStore

Загружает сохранённое состояние и автоматически записывает его изменения в AsyncStorage.

```typescript
usePersistentStore(): { store: Store; setStore: React.Dispatch<React.SetStateAction<Store>>; loaded: boolean; storageError: string; }
```

## src/app/model/useAppController.ts

### useAppController

Объединяет общее состояние, навигацию и обработчики действий приложения.

```typescript
useAppController(): { removeParticipant: (name: string) => void; sharePlaceInChat: () => void; saveMeeting: (m: Meeting) => void; toggleMessageLike: (id: string) => void; sendMessage: (text: string) => void; enterSession: (name: string, email: string) => void; confirmCurrentBooking: () => void; selectLeader: () => void; saveProfile: () => void; inviteParticipant: () => void; signOut: () => void; fontsLoaded: boolean; fontError: Error | null; store: Store; loaded: boolean; screen: Screen; setScreen: React.Dispatch<React.SetStateAction<Screen>>; selected: string; dialog: DialogName; setDialog: React.Dispatch<React.SetStateAction<DialogName>>; booking: Restaurant; meetingSection: "active" | "completed"; setMeetingSection: React.Dispatch<React.SetStateAction<"active" | "completed">>; search: string; setSearch: React.Dispatch<React.SetStateAction<string>>; inviteName: string; setInviteName: React.Dispatch<React.SetStateAction<string>>; editName: string; setEditName: React.Dispatch<React.SetStateAction<string>>; editEmail: string; setEditEmail: React.Dispatch<React.SetStateAction<string>>; toast: ToastNotification | null; showToast: (type: ToastType, message: string) => void; dismissToast: () => void; cancelCurrentBooking: () => void; filterBudget: string; setFilterBudget: React.Dispatch<React.SetStateAction<string>>; filterCuisine: string; setFilterCuisine: React.Dispatch<React.SetStateAction<string>>; filterDistance: string; setFilterDistance: React.Dispatch<React.SetStateAction<string>>; meeting: Meeting; update: (patch: Partial<Store>) => void; updateMeeting: (fn: (m: Meeting) => Meeting) => void; addMessage: (message: Message) => void; leader: () => Restaurant; matchingMeetings: Meeting[]; openMeeting: (id: string) => void; book: (r: Restaurant) => void; share: () => void; vote: (id: string) => void; pickAttachment: () => Promise<void>; pickAvatar: () => Promise<void>; goBack: () => void; isTabs: boolean; title: string; }
```

### showToast

Создаёт новое уведомление с уникальным номером показа.

```typescript
showToast(type: ToastType, message: string): void
```

### dismissToast

Скрывает текущее уведомление.

```typescript
dismissToast(): void
```

### cancelCurrentBooking

Отменяет локальную бронь и открывает активные встречи.

```typescript
cancelCurrentBooking(): void
```

### update

Обновляет только переданные поля общего состояния, сохраняя остальные.

```typescript
update(patch: Partial<Store>): void
```

### updateMeeting

Применяет преобразование только к выбранной встрече.

```typescript
updateMeeting(fn: (m: Meeting) => Meeting): void
```

### addMessage

Добавляет сообщение в чат выбранной встречи без изменения исходных массивов.

```typescript
addMessage(message: Message): void
```

### leader

Определяет ресторан-лидер выбранной встречи.

```typescript
leader(): Restaurant
```

### openMeeting

Запоминает идентификатор встречи и открывает её подробности.

```typescript
openMeeting(id: string): void
```

### book

Выбирает ресторан для диалога бронирования; саму бронь не подтверждает.

```typescript
book(r: Restaurant): void
```

### share

Отправляет приглашение на выбранную встречу и показывает ошибку при неудаче.

```typescript
share(): void
```

### vote

Записывает голос демонстрационного пользователя Ани, если статус встречи допускает голосование.

```typescript
vote(id: string): void
```

### pickAttachment

Выбирает файл, создаёт сообщение с вложением и закрывает диалог; ошибки показывает уведомлением.

```typescript
pickAttachment(): Promise<void>
```

### pickAvatar

Выбирает фотографию и обновляет профиль только при успешном выборе.

```typescript
pickAvatar(): Promise<void>
```

### goBack

Открывает подробности после редактирования или список встреч с остальных внутренних экранов.

```typescript
goBack(): void
```

### saveMeeting

Сохраняет изменения встречи либо добавляет новую встречу вместе с начальным системным сообщением.

```typescript
saveMeeting(m: Meeting): void
```

### toggleMessageLike

Переключает реакцию только у сообщения с переданным id в текущем чате.

```typescript
toggleMessageLike(id: string): void
```

### sendMessage

Создаёт и добавляет текстовое сообщение от текущего локального пользователя.

```typescript
sendMessage(text: string): void
```

### enterSession

Запоминает имя, email и флаг локального входа; серверную аутентификацию не выполняет.

```typescript
enterSession(name: string, email: string): void
```

### confirmCurrentBooking

Подтверждает локальную бронь и открывает завершённые встречи.

```typescript
confirmCurrentBooking(): void
```

### selectLeader

Закрепляет ресторан-лидер за встречей и меняет её статус на selected.

```typescript
selectLeader(): void
```

### saveProfile

Проверяет имя и формат email, обновляет профиль и закрывает диалог.

```typescript
saveProfile(): void
```

### inviteParticipant

Проверяет формат и уникальность имени, добавляет участника и закрывает приглашение.

```typescript
inviteParticipant(): void
```

### signOut

Сбрасывает локальный флаг входа и открывает форму авторизации.

```typescript
signOut(): void
```

### removeParticipant

Удаляет участника и его голос из выбранной встречи.

```typescript
removeParticipant(name: string): void
```

### sharePlaceInChat

Добавляет в текущий чат предложение ресторана-лидера с ценой.

```typescript
sharePlaceInChat(): void
```

## src/shared/ui/controls/Toggle.styles.ts

### createStyles

Создаёт стили Toggle; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { switchTrack: { width: number; height: number; borderRadius: number; padding: number; justifyContent: "center"; }; switchThumb: { width: number; height: number; borderRadius: number; backgroundColor: string; }; }
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
createStyles(): { button: { flexDirection: "row"; gap: number; minHeight: number; borderRadius: number; alignItems: "center"; justifyContent: "center"; paddingHorizontal: number; }; buttonLabel: { fontSize: number; fontWeight: "600"; }; }
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
Button({ title, onPress, variant, style, disabled, icon, textStyle, }: { title: string; onPress: () => void; variant?: ButtonVariant; style?: StyleProp<ViewStyle>; disabled?: boolean; icon?: IconName; textStyle?: StyleProp<TextStyle>; }): React.JSX.Element
```

## src/shared/ui/controls/IconButton.styles.ts

### createStyles

Создаёт стили IconButton; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): { iconButton: { width: number; height: number; alignItems: "center"; justifyContent: "center"; }; }
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
createStyles(colors: ThemeColors): { fieldContainer: { gap: number; }; input: { height: number; borderWidth: number; borderColor: string; borderRadius: number; paddingHorizontal: number; fontSize: number; color: string; backgroundColor: string; }; }
```

## src/shared/ui/shared.styles.ts

### createUiStyles

Создаёт стили общих элементов; значения зависят от переданной палитры, если она используется.

```typescript
createUiStyles(colors: ThemeColors): { label: { fontSize: number; color: string; }; heading: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; muted: { fontSize: number; color: string; lineHeight: number; }; section: { paddingVertical: number; borderBottomWidth: number; borderColor: string; gap: number; }; card: { borderWidth: number; borderColor: string; borderRadius: number; backgroundColor: string; padding: number; gap: number; }; }
```

### useUiStyles

Возвращает общие стили подписей, заголовков, карточек и секций с цветами текущей темы.

```typescript
useUiStyles(): { label: { fontSize: number; color: string; }; heading: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; muted: { fontSize: number; color: string; lineHeight: number; }; section: { paddingVertical: number; borderBottomWidth: number; borderColor: string; gap: number; }; card: { borderWidth: number; borderColor: string; borderRadius: number; backgroundColor: string; padding: number; gap: number; }; }
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
createStyles(colors: ThemeColors): { avatar: { width: number; height: number; borderRadius: number; borderWidth: number; borderColor: string; justifyContent: "center"; alignItems: "center"; }; avatarGroup: { flexDirection: "row"; alignItems: "center"; }; avatarInitial: { fontWeight: "600"; color: string; }; avatarOverflow: { marginLeft: number; color: string; fontSize: number; }; }
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
createStyles(colors: ThemeColors): { chip: { paddingHorizontal: number; paddingVertical: number; borderRadius: number; backgroundColor: string; borderWidth: number; borderColor: string; }; chipLabel: { fontSize: number; }; }
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
createStyles(): { row: { flexDirection: "row"; alignItems: "center"; justifyContent: "space-between"; }; }
```

## src/shared/ui/controls/Row.tsx

### Row

Располагает дочерние элементы горизонтально, объединяя базовый и переданный стили.

```typescript
Row({ children, style, }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; }): React.JSX.Element
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
createStyles(colors: ThemeColors): { restaurantSummary: { backgroundColor: string; padding: number; borderRadius: number; gap: number; }; restaurantImage: { width: number; height: number; borderRadius: number; }; restaurantInfo: { flex: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; restaurantDescription: { color: string; fontSize: number; }; contactList: { borderRadius: number; borderWidth: number; borderColor: string; overflow: "hidden"; }; firstContactRow: { padding: number; }; contactRow: { padding: number; borderTopWidth: number; borderColor: string; }; contactLabel: { color: string; fontSize: number; }; contactLink: { color: string; fontSize: number; textDecorationLine: "underline"; }; }
```

## src/features/booking/ui/BookingDialog.tsx

### BookingDialog

Показывает контакты ресторана и доступные действия подтверждения или отмены локальной брони.

```typescript
BookingDialog({ controller, }: { controller: { confirmCurrentBooking: () => void; booking: Restaurant; showToast: (type: ToastType, message: string) => void; cancelCurrentBooking: () => void; meeting: Meeting; }; }): React.JSX.Element
```

## src/features/calendar-export/ui/CalendarExportDialog.styles.ts

### createStyles

Создаёт стили CalendarExportDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(_colors: ThemeColors): { meetingList: { gap: number; }; meetingRow: { gap: number; }; meetingInfo: { flex: number; gap: number; }; exportButton: { minHeight: number; paddingVertical: number; }; exportButtonLabel: { textAlign: "center"; lineHeight: number; flexShrink: number; }; }
```

### getMeetingSelection

Выбирает цвет рамки выбранной карточки встречи.

```typescript
getMeetingSelection(colors: ThemeColors, selected: boolean): ViewStyle
```

## src/features/calendar-export/ui/CalendarExportDialog.tsx

### CalendarExportDialog

Показывает настройки календаря; кнопка экспорта пока не выполняет действий.

```typescript
CalendarExportDialog({ controller, }: { controller: { store: Store; setDialog: (dialog: DialogName) => void; showToast: (type: ToastType, message: string) => void; meeting: Meeting; update: (patch: Partial<Store>) => void; }; }): React.JSX.Element
```

## src/features/edit-profile/ui/EditProfileDialog.tsx

### EditProfileDialog

Показывает редактируемые имя и email, выбор фотографии и сохранение профиля.

```typescript
EditProfileDialog({ controller, }: { controller: { saveProfile: () => void; editName: string; setEditName: (value: string) => void; editEmail: string; setEditEmail: (value: string) => void; pickAvatar: () => Promise<void>; }; }): React.JSX.Element
```

## src/features/filter-restaurants/ui/FiltersDialog.styles.ts

### createStyles

Создаёт стили FiltersDialog; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(): { wrap: { flexDirection: "row"; flexWrap: "wrap"; gap: number; }; }
```

## src/features/filter-restaurants/ui/FiltersDialog.tsx

### FiltersDialog

Передаёт выбор бюджета, кухни и расстояния и позволяет применить или сбросить фильтры.

```typescript
FiltersDialog({ controller, }: { controller: { setDialog: (dialog: DialogName) => void; showToast: (type: ToastType, message: string) => void; filterBudget: string; setFilterBudget: (value: string) => void; filterCuisine: string; setFilterCuisine: (value: string) => void; filterDistance: string; setFilterDistance: (value: string) => void; }; }): React.JSX.Element
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
createStyles(colors: ThemeColors): { participantInfo: { gap: number; }; participantName: { color: string; fontSize: number; }; }
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
createStyles(colors: ThemeColors): { root: { padding: number; paddingTop: number; }; logo: { fontSize: number; fontWeight: "600"; color: string; marginBottom: number; }; title: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; }; subtitle: { fontSize: number; lineHeight: number; color: string; marginTop: number; }; backButton: { flexDirection: "row"; gap: number; alignItems: "center"; marginBottom: number; }; backLabel: { color: string; }; logoAccent: { color: string; }; fields: { gap: number; marginTop: number; }; passwordContainer: { position: "relative"; }; passwordInput: { paddingRight: number; }; passwordHint: { color: string; fontSize: number; lineHeight: number; }; passwordToggle: { position: "absolute"; right: number; bottom: number; }; passwordToggleLabel: { color: string; fontSize: number; }; error: { color: string; marginTop: number; }; submitButton: { marginTop: number; }; switchButton: { marginTop: number; padding: number; alignItems: "center"; }; switchLabel: { color: string; fontSize: number; }; switchLink: { color: string; }; }
```

## src/pages/auth/model/validation.ts

### validateAuth

Проверяет поля регистрации или входа по правилам MedClinic, не изменяя ввод.

```typescript
validateAuth(values: AuthValues): { name: string; email: string; password: string; confirmPassword: string; }
```

## src/pages/auth/ui/Auth.tsx

### Auth

Показывает форму входа или регистрации и проверяет заполнение полей перед вызовом onEnter.

```typescript
Auth({ register, onSwitch, onBack, onEnter, }: { register: boolean; onSwitch: () => void; onBack: () => void; onEnter: (name: string, email: string) => void; }): React.JSX.Element
```

## src/pages/chat/ui/Chat.styles.ts

### createStyles

Создаёт стили Chat; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { root: { flex: number; }; leaderCard: { marginHorizontal: number; marginTop: number; padding: number; borderRadius: number; backgroundColor: string; }; leaderLabel: { fontSize: number; color: string; }; leaderTitle: { fontSize: number; color: string; marginTop: number; }; messagesContent: { padding: number; gap: number; }; dateBadge: { alignSelf: "center"; backgroundColor: string; padding: number; borderRadius: number; fontSize: number; color: string; }; systemMessage: { textAlign: "center"; color: string; fontSize: number; paddingVertical: number; }; confirmationCard: { backgroundColor: string; borderRadius: number; borderWidth: number; borderColor: string; padding: number; }; confirmationRow: { justifyContent: "flex-start"; gap: number; }; confirmationIcon: { backgroundColor: string; borderRadius: number; padding: number; }; confirmationTitle: { fontWeight: "600"; color: string; }; confirmationDescription: { marginTop: number; }; messageContainer: { maxWidth: "88%"; }; messageMeta: { fontSize: number; color: string; marginBottom: number; }; messageRow: { gap: number; alignItems: "flex-end"; }; messageBubble: { flexShrink: number; maxWidth: number; borderRadius: number; paddingHorizontal: number; paddingVertical: number; }; attachment: { width: number; height: number; borderRadius: number; marginBottom: number; }; messageText: { fontSize: number; lineHeight: number; color: string; }; reactionBadge: { alignSelf: "flex-start"; paddingHorizontal: number; paddingVertical: number; borderRadius: number; borderWidth: number; borderColor: string; marginTop: number; backgroundColor: string; flexDirection: "row"; alignItems: "center"; gap: number; }; reactionCount: { fontSize: number; fontWeight: "600"; color: string; }; composer: { padding: number; gap: number; borderTopWidth: number; borderColor: string; }; messageInput: { flex: number; backgroundColor: string; borderRadius: number; paddingHorizontal: number; paddingVertical: number; color: string; fontSize: number; maxHeight: number; }; sendButton: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; }
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
Chat({ meeting, messages, leader, onLeader, onSend, onLike, onAttach, }: { meeting: Meeting; messages: Message[]; leader: string; onLeader: () => void; onSend: (text: string) => void; onLike: (id: string) => void; onAttach: () => void; }): React.JSX.Element
```

### send

Отправляет непустой текст без пробелов по краям и очищает поле ввода.

```typescript
send(): void
```

## src/pages/map/ui/MapScreen.styles.ts

### createStyles

Создаёт стили MapScreen; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { top: { position: "absolute"; top: number; left: number; right: number; gap: number; }; search: { flexDirection: "row"; alignItems: "center"; gap: number; backgroundColor: string; borderRadius: number; paddingHorizontal: number; height: number; }; filter: { paddingVertical: number; paddingHorizontal: number; backgroundColor: string; borderRadius: number; }; district: { position: "absolute"; fontSize: number; color: string; }; pin: { position: "absolute"; width: number; height: number; borderRadius: number; borderBottomRightRadius: number; transform: { rotate: string; }[]; alignItems: "center"; justifyContent: "center"; boxShadow: string; }; bottom: { position: "absolute"; bottom: number; left: number; right: number; backgroundColor: string; borderRadius: number; padding: number; boxShadow: string; }; root: { flex: number; overflow: "hidden"; backgroundColor: string; }; searchInput: { flex: number; fontSize: number; color: string; }; filtersRow: { gap: number; justifyContent: "flex-start"; }; filterLabel: { color: string; fontSize: number; }; searchResults: { backgroundColor: string; borderRadius: number; padding: number; gap: number; }; searchResultLabel: { color: string; padding: number; }; emptySearchLabel: { color: string; padding: number; }; patrikiLabel: { left: "7.46%"; top: "33.96%"; }; tverskoyLabel: { left: "67.85%"; top: "23.1%"; }; arbatLabel: { left: "19.9%"; top: "53%"; }; pinLabel: { color: string; fontSize: number; fontWeight: "600"; transform: { rotate: string; }[]; }; restaurantRow: { gap: number; }; restaurantImage: { width: number; height: number; borderRadius: number; }; restaurantInfo: { flex: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; restaurantDescription: { fontSize: number; color: string; }; rating: { color: string; }; actionsRow: { gap: number; marginTop: number; }; routeButton: { flex: number; minHeight: number; backgroundColor: string; borderWidth: number; }; bookingButton: { flex: number; minHeight: number; }; emptyState: { color: string; textAlign: "center"; padding: number; }; }
```

### getMapPinStyle

Преобразует координаты в проценты и выбирает цвет метки.

```typescript
getMapPinStyle(colors: ThemeColors, x: number, y: number, selected: boolean): ViewStyle
```

## src/pages/map/ui/MapScreen.tsx

### MapScreen

Показывает рестораны на SVG-карте, поиск, фильтры и действия для выбранного места.

```typescript
MapScreen({ onBook, onFilters, filters, }: { onBook: (r: Restaurant) => void; onFilters: () => void; filters: MapFilters; }): React.JSX.Element
```

## src/pages/meeting-detail/ui/MeetingDetail.styles.ts

### createStyles

Создаёт стили MeetingDetail; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { restaurant: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number; overflow: "hidden"; boxShadow: string; }; count: { fontSize: number; color: string; backgroundColor: string; paddingVertical: number; paddingHorizontal: number; borderRadius: number; }; restaurantImage: { width: "100%"; height: number; }; restaurantTag: { position: "absolute"; top: number; left: number; backgroundColor: string; borderRadius: number; paddingVertical: number; paddingHorizontal: number; }; restaurantTagLabel: { fontSize: number; }; restaurantInfo: { padding: number; gap: number; }; restaurantName: { fontSize: number; fontWeight: "600"; color: string; }; rating: { color: string; fontSize: number; }; priceRow: { marginTop: number; }; price: { fontSize: number; fontWeight: "600"; color: string; }; priceHint: { fontSize: number; color: string; marginTop: number; }; voteButtonLabel: { fontSize: number; fontWeight: "500"; }; voteButton: { minHeight: number; borderRadius: number; paddingHorizontal: number; }; contentContainer: { paddingBottom: number; }; meetingHeader: { padding: number; borderBottomWidth: number; borderColor: string; }; meetingStatus: { color: string; fontSize: number; textTransform: "uppercase"; marginBottom: number; }; meetingTitle: { fontSize: number; fontWeight: "600"; color: string; marginBottom: number; }; dateRow: { justifyContent: "flex-start"; gap: number; }; content: { padding: number; gap: number; }; participantsHeader: { marginTop: number; }; manageParticipantsLink: { color: string; fontSize: number; }; participantsCount: { fontSize: number; fontWeight: "600"; color: string; }; preferencesCard: { padding: number; }; preferencesLabel: { color: string; fontSize: number; }; editPreferencesButtonLabel: { fontSize: number; fontWeight: "500"; color: string; }; editPreferencesButton: { minHeight: number; paddingHorizontal: number; backgroundColor: string; borderRadius: number; }; divider: { height: number; backgroundColor: string; marginHorizontal: number; }; placesHint: { color: string; fontSize: number; marginTop: number; }; votingSection: { marginVertical: number; gap: number; }; progressTrack: { height: number; borderRadius: number; backgroundColor: string; overflow: "hidden"; }; progressBar: { height: number; backgroundColor: string; }; votingRow: { gap: number; }; votingName: { color: string; fontSize: number; }; votingCount: { color: string; fontSize: number; fontWeight: "600"; }; footer: { padding: number; borderTopWidth: number; borderColor: string; gap: number; }; }
```

### getRestaurantTagColor

Выбирает цвет метки ресторана по его идентификатору.

```typescript
getRestaurantTagColor(colors: ThemeColors, id: string): TextStyle
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
RestaurantCard({ restaurant: r, onVote, }: { restaurant: Restaurant; onVote: () => void; voted: boolean; }): React.JSX.Element
```

### MeetingDetail

Показывает участников, варианты ресторанов и результаты голосования встречи.

```typescript
MeetingDetail({ meeting: m, onVote, onEdit, onManage, onChat, onBook, }: { meeting: Meeting; onVote: (id: string) => void; onEdit: () => void; onManage: () => void; onChat: () => void; onBook: () => void; }): React.JSX.Element
```

## src/pages/meeting-form/model/validation.ts

### validateMeetingForm

Проверяет поля перед сохранением встречи, разрешая прежнее время редактируемой встречи.

```typescript
validateMeetingForm(values: FormValues, original?: Meeting, now?: Date): "" | "Введите имя участника" | "Имя должно содержать от 2 до 30 символов" | "Допустимы буквы, пробел и дефис; пробелы по краям запрещены" | "Этот участник уже добавлен" | "Введите название встречи" | "Название должно содержать от 2 до 100 символов" | "Название должно содержать букву или цифру, без переносов строк и управляющих символов" | "Выберите корректные дату и время" | "Дата и время встречи должны быть позже текущего момента" | "Бюджет должен быть от 500 до 5000 ₽ с шагом 100 ₽" | "Выберите кухни из списка без повторов" | "Выберите район из списка" | "Выберите формат встречи из списка"
```

## src/pages/meeting-form/ui/MeetingForm.styles.ts

### createStyles

Создаёт стили MeetingForm; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { grid: { flexDirection: "row"; flexWrap: "wrap"; }; week: { width: "14.2857%"; textAlign: "center"; fontSize: number; color: string; paddingVertical: number; }; day: { width: "14.2857%"; height: number; alignItems: "center"; justifyContent: "center"; }; wrap: { flexDirection: "row"; flexWrap: "wrap"; gap: number; }; hint: { fontSize: number; color: string; }; contentContainer: { paddingHorizontal: number; paddingBottom: number; }; titleSection: { paddingBottom: number; borderBottomWidth: number; }; previousMonthButton: { padding: number; }; monthLabel: { fontSize: number; fontWeight: "600"; color: string; }; nextMonthButton: { padding: number; }; dayLabel: { fontSize: number; }; timePickerButton: { padding: number; }; timeRow: { gap: number; }; timeLabel: { fontSize: number; color: string; }; inviteRow: { gap: number; }; inviteLabel: { color: string; fontSize: number; }; budgetLabel: { fontSize: number; fontWeight: "500"; color: string; }; districtLabel: { fontSize: number; color: string; }; formatSection: { borderBottomWidth: number; }; formatSelector: { flexDirection: "row"; padding: number; backgroundColor: string; borderRadius: number; }; formatOption: { flex: number; paddingVertical: number; alignItems: "center"; borderRadius: number; }; formatOptionLabel: { fontSize: number; }; error: { color: string; marginBottom: number; }; }
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
MeetingForm({ meeting, onSave, }: { meeting?: Meeting; onSave: (m: Meeting) => void; }): React.JSX.Element
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
createStyles(colors: ThemeColors): { search: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number; paddingHorizontal: number; height: number; flexDirection: "row"; alignItems: "center"; gap: number; }; count: { fontSize: number; color: string; backgroundColor: string; width: number; height: number; lineHeight: number; textAlign: "center"; borderRadius: number; overflow: "hidden"; }; badge: { fontSize: number; paddingVertical: number; paddingHorizontal: number; borderRadius: number; }; fab: { position: "absolute"; right: number; bottom: number; width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; boxShadow: string; }; root: { flex: number; }; contentContainer: { padding: number; paddingBottom: number; }; greetingRow: { marginBottom: number; }; dateLabel: { color: string; fontSize: number; marginBottom: number; }; greeting: { color: string; fontSize: number; fontWeight: "700"; }; profileButton: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; avatarInitial: { fontSize: number; fontWeight: "600"; color: string; }; searchInput: { flex: number; fontSize: number; color: string; }; sectionHeader: { marginTop: number; marginBottom: number; }; tabsRow: { gap: number; }; tabLabel: { fontSize: number; }; meetingCard: { marginBottom: number; padding: number; boxShadow: string; }; meetingTitle: { fontSize: number; fontWeight: "600"; color: string; }; metadataRow: { justifyContent: "flex-start"; gap: number; }; dateRow: { gap: number; }; dateText: { fontSize: number; color: string; }; participantsRow: { gap: number; }; participantsText: { fontSize: number; color: string; }; emptyState: { padding: number; textAlign: "center"; }; }
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
createStyles(colors: ThemeColors): { root: { flex: number; paddingHorizontal: number; paddingTop: number; }; logo: { fontSize: number; fontWeight: "700"; color: string; }; art: { width: "100%"; borderRadius: number; overflow: "hidden"; marginBottom: number; }; title: { fontSize: number; lineHeight: number; fontWeight: "600"; color: string; marginBottom: number; }; text: { fontSize: number; lineHeight: number; color: string; }; logoAccent: { color: string; }; content: { flex: number; }; illustrationSpacing: { marginTop: number; marginBottom: number; }; pagination: { justifyContent: "center"; gap: number; marginBottom: number; }; indicator: { height: number; borderRadius: number; }; nextButtonLabel: { fontSize: number; fontWeight: "600"; }; skipButton: { paddingVertical: number; alignItems: "center"; }; skipLabel: { color: string; fontSize: number; }; }
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
createStyles(colors: ThemeColors): { sectionLabel: { fontSize: number; fontWeight: "600"; letterSpacing: number; color: string; }; settingIcon: { width: number; height: number; borderRadius: number; backgroundColor: string; alignItems: "center"; justifyContent: "center"; }; profileHeader: { backgroundColor: string; alignItems: "center"; paddingVertical: number; gap: number; }; avatarButton: { width: number; height: number; backgroundColor: string; borderRadius: number; borderWidth: number; borderColor: string; alignItems: "center"; justifyContent: "center"; marginBottom: number; }; avatarImage: { width: number; height: number; borderRadius: number; }; avatarInitial: { fontSize: number; color: string; }; editBadge: { position: "absolute"; right: number; bottom: number; backgroundColor: string; borderWidth: number; borderColor: string; padding: number; borderRadius: number; }; profileName: { fontSize: number; fontWeight: "600"; color: string; }; profileEmail: { fontSize: number; fontWeight: "600"; color: string; }; content: { padding: number; gap: number; }; calendarCard: { backgroundColor: string; }; calendarRow: { gap: number; }; calendarIconLabel: { color: string; fontSize: number; }; calendarInfo: { flex: number; }; settingTitle: { fontSize: number; color: string; }; calendarStatus: { fontSize: number; marginTop: number; }; configureLink: { fontSize: number; fontWeight: "600"; color: string; }; settingsCard: { backgroundColor: string; padding: number; gap: number; }; settingRow: { padding: number; gap: number; borderColor: string; }; settingInfo: { flex: number; }; settingLabel: { fontSize: number; color: string; }; settingDescription: { fontSize: number; color: string; marginTop: number; }; signOutButton: { height: number; borderRadius: number; backgroundColor: string; borderWidth: number; borderColor: string; alignItems: "center"; justifyContent: "center"; flexDirection: "row"; gap: number; }; signOutLabel: { fontSize: number; color: string; }; }
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
createStyles(colors: ThemeColors): { card: { position: "absolute"; left: number; right: number; zIndex: number; elevation: number; backgroundColor: string; borderRadius: number; borderLeftWidth: number; overflow: "hidden"; boxShadow: string; }; row: { flexDirection: "row"; alignItems: "center"; gap: number; padding: number; minHeight: number; }; icon: { width: number; height: number; borderRadius: number; alignItems: "center"; justifyContent: "center"; }; symbol: { fontFamily: string; fontSize: number; fontWeight: "700"; color: string; }; text: { flex: number; fontFamily: string; fontSize: number; lineHeight: number; color: string; }; cardBackground: { backgroundColor: string; }; progressTrack: { height: number; backgroundColor: string; }; progressBar: { height: number; }; }
```

### getToastEntrance

Связывает анимированное появление уведомления с прозрачностью и смещением.

```typescript
getToastEntrance(top: number, entrance: Animated.Value, color: string): Animated.WithAnimatedObject<ViewStyle>
```

### getToastIconColor

Возвращает фон значка уведомления.

```typescript
getToastIconColor(color: string): ViewStyle
```

### getToastProgress

Связывает ширину полосы уведомления с анимированным значением.

```typescript
getToastProgress(progress: Animated.Value, color: string): Animated.WithAnimatedObject<ViewStyle>
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
createStyles(colors: ThemeColors): { overlay: { flex: number; backgroundColor: string; justifyContent: "flex-end"; alignItems: "center"; }; dialog: { width: "100%"; maxWidth: number; maxHeight: "88%"; backgroundColor: string; borderTopLeftRadius: number; borderTopRightRadius: number; paddingHorizontal: number; paddingTop: number; paddingBottom: number; }; handle: { width: number; height: number; borderRadius: number; backgroundColor: string; alignSelf: "center"; marginBottom: number; }; dialogBackground: { backgroundColor: string; }; dialogHeader: { marginBottom: number; }; dialogContent: { gap: number; paddingBottom: number; }; closeButton: { alignItems: "center"; padding: number; }; closeLabel: { color: string; fontSize: number; }; }
```

## src/widgets/dialogs/ui/DialogHost.tsx

### DialogHost

Показывает выбранный диалог в общей модальной оболочке и уведомление над ним.

```typescript
DialogHost({ controller, }: { controller: { dialog: DialogName; setDialog: (dialog: DialogName) => void; toast: ToastNotification | null; dismissToast: () => void; sharePlaceInChat: () => void; pickAttachment: () => Promise<void>; confirmCurrentBooking: () => void; booking: Restaurant; showToast: (type: ToastType, message: string) => void; cancelCurrentBooking: () => void; meeting: Meeting; store: Store; update: (patch: Partial<Store>) => void; saveProfile: () => void; editName: string; setEditName: (value: string) => void; editEmail: string; setEditEmail: (value: string) => void; pickAvatar: () => Promise<void>; filterBudget: string; setFilterBudget: (value: string) => void; filterCuisine: string; setFilterCuisine: (value: string) => void; filterDistance: string; setFilterDistance: (value: string) => void; inviteParticipant: () => void; inviteName: string; setInviteName: (value: string) => void; share: () => void; selectLeader: () => void; setScreen: (screen: Screen) => void; removeParticipant: (name: string) => void; }; }): React.JSX.Element
```

## src/widgets/navigation/ui/AppHeader.styles.ts

### createStyles

Создаёт стили AppHeader; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { header: { minHeight: number; paddingHorizontal: number; borderBottomWidth: number; borderColor: string; flexDirection: "row"; alignItems: "center"; }; titleContainer: { flex: number; }; title: { fontSize: number; fontWeight: "600"; color: string; }; onlineStatus: { fontSize: number; color: string; marginTop: number; }; cancelButton: { padding: number; }; cancelLabel: { fontSize: number; color: string; }; }
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
AppHeader({ controller, }: { controller: { screen: Screen; setDialog: (dialog: DialogName) => void; meeting: Meeting; share: () => void; goBack: () => void; title: string; }; }): React.JSX.Element
```

## src/widgets/navigation/ui/BottomNavigation.styles.ts

### createStyles

Создаёт стили BottomNavigation; значения зависят от переданной палитры, если она используется.

```typescript
createStyles(colors: ThemeColors): { tabs: { flexDirection: "row"; borderTopWidth: number; borderColor: string; backgroundColor: string; }; tab: { flex: number; alignItems: "center"; gap: number; paddingVertical: number; }; tabLabel: { fontSize: number; }; }
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

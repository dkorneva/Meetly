import BackIcon from "../../../assets/icons/back.svg";
import CalendarIcon from "../../../assets/icons/calendar.svg";
import MapIcon from "../../../assets/icons/map.svg";
import ChatIcon from "../../../assets/icons/chat.svg";
import UserIcon from "../../../assets/icons/user.svg";
import ClockIcon from "../../../assets/icons/clock.svg";
import UsersIcon from "../../../assets/icons/users.svg";
import SearchIcon from "../../../assets/icons/search.svg";
import PlusIcon from "../../../assets/icons/plus.svg";
import CloseIcon from "../../../assets/icons/close.svg";
import ChevronIcon from "../../../assets/icons/chevron.svg";
import ShareIcon from "../../../assets/icons/share.svg";
import MoreIcon from "../../../assets/icons/more.svg";
import SendIcon from "../../../assets/icons/send.svg";
import ClipIcon from "../../../assets/icons/clip.svg";
import BellIcon from "../../../assets/icons/bell.svg";
import MoonIcon from "../../../assets/icons/moon.svg";
import ExitIcon from "../../../assets/icons/exit.svg";
import PinIcon from "../../../assets/icons/pin.svg";
import FilterIcon from "../../../assets/icons/filter.svg";
import CheckIcon from "../../../assets/icons/check.svg";
import { useTheme } from "../theme/index";

// Каждому названию соответствует отдельный SVG-файл из assets/icons.
const icons = {
  back: BackIcon,
  calendar: CalendarIcon,
  map: MapIcon,
  chat: ChatIcon,
  user: UserIcon,
  clock: ClockIcon,
  users: UsersIcon,
  search: SearchIcon,
  plus: PlusIcon,
  close: CloseIcon,
  chevron: ChevronIcon,
  share: ShareIcon,
  more: MoreIcon,
  send: SendIcon,
  clip: ClipIcon,
  bell: BellIcon,
  moon: MoonIcon,
  exit: ExitIcon,
  pin: PinIcon,
  filter: FilterIcon,
  check: CheckIcon,
};

// Допустимые названия иконок берутся из ключей объекта icons.
export type IconName = keyof typeof icons;

/**
 * Выбирает SVG по имени и передаёт ему размер и цвет текущей темы или явно заданный цвет.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const IconImage = icons[name];

  // currentColor внутри SVG получает этот цвет; по умолчанию — цвет текста темы.
  return (
    <IconImage width={size} height={size} color={color ?? colors.text} />
  );
}

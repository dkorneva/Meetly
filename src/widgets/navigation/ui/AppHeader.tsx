import type { Screen } from "../../../shared/config/screens";
import type { DialogName } from "../../../shared/config/dialogs";
import type { Meeting } from "../../../entities/meeting";
import { Pressable, View } from "react-native";
import { IconButton } from "../../../shared/ui/controls/index";
import { Text, useThemedStyles } from "../../../shared/theme/index";

import { createStyles, getTitleAlignment } from "./AppHeader.styles";

/**
 * Показывает заголовок и действия, соответствующие текущему экрану.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function AppHeader({
  controller,
}: {
  controller: {
    screen: Screen;
    setDialog: (dialog: DialogName) => void;
    meeting: Meeting;
    share: () => void;
    goBack: () => void;
    title: string;
  };
  // screen — какой экран сейчас открыт
  // Само значение screen пользователь не видит. По нему AppHeader выбирает, что показать:
  // - "new" или "edit" — справа появляется текстовая кнопка «Отмена»;
  // - "detail" — появляется кнопка «Поделиться»;
  // - "chat" — под заголовком появляется количество участников;
  // - на экранах, кроме "new" и "edit", появляется кнопка с дополнительными действиями (more)

  // setDialog — функция открытия диалогового окна

  // meeting — объект встречи, из которого берется количество участников

  // share — функция, которая вызывается при нажатии на кнопку «Поделиться»

  // goBack — функция, которая вызывается при нажатии на кнопку «Назад»

  // title — заголовок, который отображается в центре 
}) {
  const styles = useThemedStyles(createStyles);

  const { screen, setDialog, meeting, share, goBack, title } = controller;
  return (
    <View style={styles.header}>
      <IconButton name="back" onPress={goBack} />
      <View
        style={[
          styles.titleContainer,
          getTitleAlignment(screen === "new" || screen === "edit"),
        ]}
      >
        {title.length > 0 && (
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        )}
        {screen === "chat" && (
          <Text style={styles.onlineStatus}>
            {meeting.participants.length} участников онлайн
          </Text>
        )}
      </View>
      {screen === "new" || screen === "edit" ? (
        <Pressable onPress={goBack} style={styles.cancelButton}>
          <Text style={styles.cancelLabel}>Отмена</Text>
        </Pressable>
      ) : (
        <>
          {screen === "detail" && <IconButton name="share" onPress={share} />}
          <IconButton name="more" onPress={() => setDialog("menu")} />
        </>
      )}
    </View>
  );
}

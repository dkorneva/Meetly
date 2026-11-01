import type { Screen } from "../../../shared/config/screens";
import { Pressable, View } from "react-native";
import { Icon, type IconName } from "../../../shared/ui/Icon";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";

import { createStyles, getTabLabel } from "./BottomNavigation.styles";

/**
 * Показывает вкладки основных экранов и передаёт выбранный экран в setScreen.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function BottomNavigation({
  controller,
}: {
  controller: {
    screen: Screen;
    setScreen: (screen: Screen) => void;
  };
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { screen, setScreen } = controller;
  return (
    <View style={styles.tabs}>
      {(
        [
          {
            screen: "meetings",
            icon: "calendar",
            label: "Встречи",
          },
          { screen: "map", icon: "map", label: "Карта" },
          { screen: "chat", icon: "chat", label: "Чат" },
          { screen: "profile", icon: "user", label: "Профиль" },
        ] as { screen: Screen; icon: IconName; label: string }[]
      ).map((tab) => (
        <Pressable
          key={tab.screen}
          onPress={() => setScreen(tab.screen)}
          style={styles.tab}
        >
          <Icon
            name={tab.icon}
            color={
              screen === tab.screen ? colors.primaryText : colors.textMuted
            }
          />
          <Text
            style={[
              styles.tabLabel,
              getTabLabel(colors, screen === tab.screen),
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

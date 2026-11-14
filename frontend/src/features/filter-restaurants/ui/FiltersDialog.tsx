import type { DialogName } from "../../../shared/config/dialogs";
import type { ToastType } from "../../../shared/ui/Toast.types";
import { View } from "react-native";

import { Text, useThemedStyles } from "../../../shared/theme/index";
import { Button, Chip } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { createStyles } from "./FiltersDialog.styles";

/**
 * Передаёт выбор бюджета, кухни и расстояния и позволяет применить или сбросить фильтры.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function FiltersDialog({
  controller,
}: {
  controller: {
    setDialog: (dialog: DialogName) => void;
    showToast: (type: ToastType, message: string) => void;
    filterBudget: string;
    setFilterBudget: (value: string) => void;
    filterCuisine: string;
    setFilterCuisine: (value: string) => void;
    filterDistance: string;
    setFilterDistance: (value: string) => void;
  };
}) {
  const styles = useThemedStyles(createStyles); // создание стилей конкретного окна
  const uiStyles = useUiStyles(); // создание стилей общих компонентов

  const {
    setDialog,
    showToast,
    filterBudget,
    setFilterBudget,
    filterCuisine,
    setFilterCuisine,
    filterDistance,
    setFilterDistance,
  } = controller;
  return (
    <>
      <Text style={uiStyles.label}>Бюджет</Text>
      <View style={styles.wrap}>
        {["Все", "До 1000 ₽", "До 1500 ₽", "До 2000 ₽"].map((t) => (
          // кнопки-метки
          <Chip
            key={t} // уникальный идентификатор элемента списка, нужен для оптимизации React
            label={t}
            selected={filterBudget === t}
            onPress={() => setFilterBudget(t)}
          />
        ))}
      </View>
      <Text style={uiStyles.label}>Кухня</Text>
      <View style={styles.wrap}>
        {["Все", "Итальянская", "Русская", "Кофе"].map((t) => (
          <Chip
            key={t}
            label={t}
            selected={filterCuisine === t}
            onPress={() => setFilterCuisine(t)}
          />
        ))}
      </View>
      <Text style={uiStyles.label}>Расстояние</Text>
      <View style={styles.wrap}>
        {["Все", "До 1 км", "До 2 км", "До 5 км"].map((t) => (
          <Chip
            key={t}
            label={t}
            selected={filterDistance === t}
            onPress={() => setFilterDistance(t)}
          />
        ))}
      </View>
      <Button
        title="Показать места"
        onPress={() => {
          setDialog(null);
          showToast("success", "Фильтры применены");
        }}
      />
      <Button
        title="Сбросить"
        variant="outline"
        onPress={() => {
          setFilterBudget("Все");
          setFilterCuisine("Все");
          setFilterDistance("Все");
        }}
      />
    </>
  );
}

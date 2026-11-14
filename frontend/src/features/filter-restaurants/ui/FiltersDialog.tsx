import { useCatalogFilters } from "../../../shared/api/useCatalogFilters";
import type { DialogName } from "../../../shared/config/dialogs";
import type { ToastType } from "../../../shared/ui/Toast.types";
import { View } from "react-native";

import { Text, useThemedStyles } from "../../../shared/theme/index";
import { Button, Chip, Select } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";
import { createStyles } from "./FiltersDialog.styles";

/**
 * Передаёт выбор кухни и среднего чека.
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
    setFilterOpenNow?: (value: boolean) => void;
    setFilterQuery?: (value: string) => void;
    filterBudget: string;
    setFilterBudget: (value: string) => void;
    filterCuisine: string[];
    setFilterCuisine: (value: string[]) => void;
  };
}) {
  const { options, error, retry } = useCatalogFilters();
  const styles = useThemedStyles(createStyles); // создание стилей конкретного окна
  const uiStyles = useUiStyles(); // создание стилей общих компонентов

  const {
    setDialog,
    showToast,
    setFilterBudget,
    filterBudget,
    filterCuisine,
    setFilterCuisine,
  } = controller;
  return (
    <>
      {error ? <><Text accessibilityRole="alert">{error}</Text><Button title="Повторить загрузку фильтров" onPress={retry} /></> : !options && <Text>Загрузка фильтров…</Text>}
      <View style={{height:72}}>
        <Select label="Средний чек на человека" value={filterBudget}
          options={[...new Set(["Все", ...(options?.budget.prices ?? []).map(price => `До ${price} ₽`), filterBudget])]}
          onChange={setFilterBudget} />
      </View>
      <Text style={uiStyles.label}>Кухня</Text>
      <View style={styles.wrap}>
        {["Все", ...(options?.cuisines ?? [])].map((t) => (
          <Chip
            key={t}
            label={t}
            selected={t === "Все" ? filterCuisine.length === 0 : filterCuisine.includes(t)}
            onPress={() => setFilterCuisine(t === "Все" ? [] : filterCuisine.includes(t) ? filterCuisine.filter(value => value !== t) : [...filterCuisine, t])}
          />
        ))}
      </View>
      <Button
        title="Показать места"
        disabled={!options}
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
          setFilterCuisine([]);
          controller.setFilterOpenNow?.(false);
          controller.setFilterQuery?.("");
        }}
      />
    </>
  );
}

import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { filterRestaurants, MapFilters } from "../../../entities/meeting";
import MapIllustration from "../../../../assets/illustrations/map.svg";
import { Button, Chip, Row } from "../../../shared/ui/controls/index";
import { Icon } from "../../../shared/ui/Icon";
import { restaurants } from "../../../entities/meeting";
import type { Restaurant } from "../../../entities/meeting";
import { openExternalLink } from "../../../shared/api/device";
import { Text, TextInput, useTheme, useThemedStyles } from "../../../shared/theme/index";
import { createStyles, getMapPinStyle } from "./MapScreen.styles";

// Экран ресторанов на иллюстрации карты. Бронирование и окно фильтров открывает родитель.
/**
 * Показывает рестораны на SVG-карте, поиск, фильтры и действия для выбранного места.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function MapScreen({
  onBook,
  onFilters,
  filters,
}: {
  onBook: (r: Restaurant) => void;
  onFilters: () => void;
  filters: MapFilters;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [selected, setSelected] = useState(restaurants[0]); // Выбранный ресторан.
  const [query, setQuery] = useState(""); // Строка поиска.
  // Пока меняет только вид кнопки «Открыто сейчас», в фильтрации ниже не участвует.
  const [open, setOpen] = useState(true);
  // found учитывает поиск и фильтры; visible — только фильтры для меток на карте.
  const found = filterRestaurants(filters, query);
  const visible = filterRestaurants(filters);
  // Если выбранное место скрыто фильтрами, показываем первое доступное.
  // Если список пуст, active будет undefined.
  const active = visible.find((r) => r.id === selected.id) ?? visible[0];
  return (
    <View style={styles.root}>
      {/* Фон — готовая SVG-иллюстрация; метки ресторанов размещаем поверх неё. */}
      <MapIllustration width="100%" height="100%" />
      <View style={styles.top}>
        <View style={styles.search}>
          <Icon name="search" size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Рестораны рядом"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
          <Pressable onPress={onFilters} accessibilityLabel="Фильтры">
            <Icon name="filter" />
          </Pressable>
        </View>
        <Row style={styles.filtersRow}>
          {["Бюджет", "Кухня", "Расстояние"].map((t) => (
            <Pressable key={t} onPress={onFilters} style={styles.filter}>
              <Text style={styles.filterLabel}>{t}</Text>
            </Pressable>
          ))}
          <Chip
            label="Открыто сейчас"
            selected={open}
            onPress={() => setOpen(!open)}
          />
        </Row>
        {/* Результаты поиска видны только при непустом запросе. */}
        {query.length > 0 && (
          <View style={styles.searchResults}>
            {found.length ? (
              found.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    // Выбираем ресторан и закрываем результаты, очищая поиск.
                    setSelected(r);
                    setQuery("");
                  }}
                >
                  <Text style={styles.searchResultLabel}>
                    {r.name} · {r.cuisine}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptySearchLabel}>Мест не найдено</Text>
            )}
          </View>
        )}
      </View>
      <Text style={[styles.district, styles.patrikiLabel]}>ПАТРИКИ</Text>
      <Text style={[styles.district, styles.tverskoyLabel]}>ТВЕРСКОЙ</Text>
      <Text style={[styles.district, styles.arbatLabel]}>АРБАТ</Text>
      {/* Координаты меток берутся из каталога, цвет зависит от выбора. */}
      {visible.map((r, i) => (
        <Pressable
          key={r.id}
          onPress={() => setSelected(r)}
          accessibilityLabel={r.name}
          style={[
            styles.pin,
            getMapPinStyle(colors, r.x, r.y, selected.id === r.id),
          ]}
        >
          <Text style={styles.pinLabel}>{i + 1}</Text>
        </Pressable>
      ))}
      {/* Внизу показываем карточку доступного ресторана или сообщение о пустом списке. */}
      {active ? (
        <View style={styles.bottom}>
          <Row style={styles.restaurantRow}>
            <Image source={active.image} style={styles.restaurantImage} />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{active.name}</Text>
              <Text style={styles.restaurantDescription}>
                <Text style={styles.rating}>☆{active.rating}</Text> ·{" "}
                {active.price.toLocaleString("ru-RU")} ₽ · {active.distance} км
              </Text>
            </View>
            <Pressable onPress={() => onBook(active)}>
              <Icon name="chevron" />
            </Pressable>
          </Row>
          <Row style={styles.actionsRow}>
            <Button
              title="Маршрут"
              icon="pin"
              variant="outline"
              style={styles.routeButton}
              onPress={() =>
                // Открываем поиск места в Яндекс Картах; кодируем название для URL.
                openExternalLink(
                  `https://yandex.ru/maps/?text=${encodeURIComponent(
                    active.name + " Москва",
                  )}`,
                )
              }
            />
            <Button
              title="Забронировать"
              style={styles.bookingButton}
              onPress={() => onBook(active)}
            />
          </Row>
        </View>
      ) : (
        <View style={styles.bottom}>
          <Text style={styles.emptyState}>Нет мест с такими фильтрами</Text>
        </View>
      )}
    </View>
  );
}

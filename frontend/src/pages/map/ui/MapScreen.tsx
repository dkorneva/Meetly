import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Button, Row } from "../../../shared/ui/controls";
import { Icon } from "../../../shared/ui/Icon";
import PlacePhoto from "../../../shared/ui/PlacePhoto";
import {
  Text,
  TextInput,
  useThemedStyles,
  useTheme,
} from "../../../shared/theme";
import RestaurantMap, { MapEvent } from "../../../shared/ui/RestaurantMap";
import { api } from "../../../shared/api/client";
import type {
  RemoteDiscovery,
  RemoteRestaurant,
} from "../../../shared/api/contracts";
import {
  restaurantView,
  type MapFilters,
  type Meeting,
  type Restaurant,
} from "../../../entities/meeting";
import { createStyles } from "./MapScreen.styles";
/** Показывает карту, фильтры и карточку заведения. */
export default function MapScreen({
  mode = "catalog",
  meeting,
  meetings = [],
  filters,
  onFilters,
  onFilterChange,
  onBook,
  onPropose,
  onChanged,
  initialRestaurant,
}: {
  mode?: "catalog" | "meeting";
  meeting?: Meeting;
  meetings?: Meeting[];
  filters: MapFilters;
  onFilters: () => void;
  onFilterChange?: (patch: Partial<MapFilters>) => void;
  onBook: (r: Restaurant) => void;
  onPropose?: (r: Restaurant, meetingId?: string) => void | Promise<void>;
  onChanged?: () => Promise<void>;
  initialRestaurant?: Restaurant;
}) {
  const styles = useThemedStyles(createStyles),
    { colors } = useTheme();
  const [items, setItems] = useState<Restaurant[]>(
      initialRestaurant ? [initialRestaurant] : [],
    ),
    [selected, setSelected] = useState(initialRestaurant?.id ?? ""),
    [localQuery, setLocalQuery] = useState(""),
    [localOpen, setLocalOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const query = filters.q ?? localQuery;
  const open = filters.openNow ?? localOpen;
  /** Сохраняет поисковую строку карты между переходами по вкладкам. */
  const setQuery = (value: string) => { setLocalQuery(value); onFilterChange?.({q:value}); };
  /** Сохраняет фильтр открытых заведений между переходами по вкладкам. */
  const setOpen = (value: boolean) => { setLocalOpen(value); onFilterChange?.({openNow:value}); };
  const [meetingPickerOpen, setMeetingPickerOpen] = useState(false);
  const [addingPlace, setAddingPlace] = useState(false);
  const [actionSize, setActionSize] = useState({ width: 220, height: 44 });
  const [center, setCenter] = useState({
    latitude: initialRestaurant?.latitude ?? 55.7558,
    longitude: initialRestaurant?.longitude ?? 37.6176,
  });
  const request = useRef(0);
  const budget = filters.budget.match(/\d+/)?.[0];
  const filterKey = JSON.stringify([filters.cuisine, budget, open]);
  const queryKey = query.trim();
  const candidateKey = meeting?.candidates?.map(r=>r.id).join(",");
  useEffect(() => {
    if (mode === "meeting") {
      const places = meeting?.candidates ?? [];
      setItems(places);
      const focused=places.find(r=>r.id===initialRestaurant?.id)??places[0];
      setSelected(focused?.id??"");
      if(focused?.latitude!==undefined&&focused.longitude!==undefined)setCenter({latitude:focused.latitude,longitude:focused.longitude});
      setBusy(false);setError("");
      return;
    }
    const sequence = ++request.current;
    const timer = setTimeout(
      () => {
        const params = new URLSearchParams();
        if (queryKey) params.set("q", queryKey);
        if (budget) params.set("budget", budget);
        for (const cuisine of filters.cuisine) params.append("cuisines", cuisine);
        if (open) params.set("openNow", "true");
        setBusy(true);
        setError("");
        // Текстовый поиск не переписывает варианты голосования. Фильтры корректируют автоподбор.
        const method = "GET",
          path = `/restaurants/discovery?${params}`;
        void api<RemoteDiscovery>(
          path,
          method,
          undefined,
        )
          .then(async (result) => {
            if (sequence !== request.current) return;
            const places = result.items.map(restaurantView);
            setItems(places);
            setCenter(result.center);
            setError(result.warning ?? "");
            setSelected((id) =>
              places.some((r) => r.id === id) ? id : (places[0]?.id ?? ""),
            );
            if (result.changed) await onChanged?.();
          })
          .catch((e) => {
            if (sequence === request.current)
              setError(
                e instanceof Error ? e.message : "Не удалось подобрать места",
              );
          })
          .finally(() => {
            if (sequence === request.current) setBusy(false);
          });
      },
      queryKey ? 300 : 40,
    );
    return () => {
      clearTimeout(timer);
      request.current++;
    };
  }, [mode, meeting?.id, meeting?.preferencesKey, candidateKey, initialRestaurant?.id, filterKey, queryKey]);
  const onEvent = useCallback((event: MapEvent) => {
    if (event.type === "select" && event.id) setSelected(event.id);
  }, []);
  const active = items.find((r) => r.id === selected);
  useEffect(() => { setMeetingPickerOpen(false); }, [selected, mode]);
  useEffect(() => {
    if (!selected) return;
    let valid = true;
    void api<RemoteRestaurant>(`/restaurants/${selected}/details`)
      .then((r) => {
        if (valid)
          setItems((prev) =>
            prev.map((p) =>
              p.id === r.id
                ? {
                    ...p,
                    ...restaurantView(r),
                    tag: p.tag,
                  }
                : p,
            ),
          );
      })
      .catch(() => {});
    return () => {
      valid = false;
    };
  }, [selected]);
  const included = !!meeting?.candidates?.some((r) => r.id === selected);
  const canBook = mode === "meeting" && included;
  const availableMeetings = meetings.filter(item =>
    item.status === "voting" && !item.candidates?.some(place => place.id === selected),
  );
  async function chooseMeeting(target: Meeting) {
    if (!active || addingPlace) return;
    setMeetingPickerOpen(false);
    setAddingPlace(true);
    try {
      await onPropose?.(active, target.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить место во встречу");
    } finally {
      setAddingPlace(false);
    }
  }
  return (
    <View style={styles.root} accessibilityLabel={mode==="meeting"?`Вариантов встречи: ${items.length}`:`Найдено: ${items.length}, Садовое кольцо`}>
      <RestaurantMap
        items={items}
        mode={mode}
        selectedId={selected}
        center={center}
        onEvent={onEvent}
      />
      <View style={styles.top} pointerEvents="box-none">
        {mode === "meeting" ? <View style={styles.search}><Icon name="search" size={19}/><Text style={styles.searchInput} numberOfLines={1}>Варианты встречи «{meeting?.title}»</Text></View> : <View style={styles.search}>
          <Icon name="search" size={19} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск ресторанов"
            style={styles.searchInput}
            accessibilityLabel="Поиск заведений"
          />
          {busy ? (
            <ActivityIndicator size="small" color={colors.primaryText} />
          ) : (
            <Pressable onPress={onFilters} accessibilityLabel="Фильтры" hitSlop={10}>
              <Icon name="filter" size={20}/>
            </Pressable>
          )}
        </View>}
        {mode === "catalog" && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {!!budget && <Pressable accessibilityLabel="Снять фильтр бюджета" onPress={() => onFilterChange?.({budget:"Все"})} style={[styles.filter,styles.selectedFilter]}><Text style={styles.filterLabel}>{filters.budget} ×</Text></Pressable>}
          {filters.cuisine.map(cuisine => <Pressable key={cuisine} accessibilityLabel={`Снять фильтр кухни ${cuisine}`} onPress={() => onFilterChange?.({cuisine:filters.cuisine.filter(value=>value!==cuisine)})} style={[styles.filter,styles.selectedFilter]}><Text style={styles.filterLabel}>{cuisine} ×</Text></Pressable>)}
          <Pressable
            onPress={() => setOpen(!open)}
            style={[styles.filter, open && styles.selectedFilter]}
          >
            <Text style={styles.filterLabel}>Открыто сейчас</Text>
          </Pressable>
        </ScrollView>}
        {!!query && !!items.length && (
          <View style={styles.searchResults}>
            {items.slice(0, 5).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => {
                  setSelected(r.id);
                  setQuery("");
                }}
                style={styles.result}
              >
                <Text numberOfLines={1} style={styles.searchResultLabel}>
                  {r.name}
                </Text>
                <Text numberOfLines={1} style={styles.resultMeta}>
                  {r.cuisineLabel ?? r.cuisine}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {!!error && (
          <View style={styles.notice}>
            <Text style={styles.noticeText} accessibilityRole="alert">
              {error}
            </Text>
            <Text style={styles.retry} onPress={() => setQuery("")}>
              Повторить
            </Text>
          </View>
        )}
      </View>

      {meetingPickerOpen && <Pressable
        style={styles.meetingPickerDismiss}
        accessibilityRole="button"
        accessibilityLabel="Закрыть список встреч"
        onPress={() => setMeetingPickerOpen(false)}
      />}
      <View style={styles.bottom}>
        {active ? (
          <>
            <View style={styles.restaurantRow} testID="restaurant-summary">
              <PlacePhoto
                id={active.id}
                name={active.name}
                image={active.image}
                style={styles.placeIcon}
              />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName} numberOfLines={2}>
                  {active.name}
                </Text>
                <Text style={styles.restaurantDescription} numberOfLines={1}>
                  {active.cuisineLabel ?? "Ресторан"}
                </Text>
                <Text style={styles.restaurantDescription}>
                  {active.price
                    ? `${active.price.toLocaleString("ru-RU")} ₽ / чел.`
                    : "Средний чек уточняется"}
                </Text>
              </View>
            </View>
            <Row style={styles.actionsRow}>
              <Button
                title="Маршрут"
                icon="pin"
                variant="outline"
                style={styles.routeButton}
                textStyle={styles.actionLabel}
                onPress={() =>
                  void Linking.openURL(
                    `https://yandex.ru/maps/?rtext=~${active.latitude},${active.longitude}&rtt=pd`,
                  )
                }
              />
              <View style={styles.bookingAction} onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                setActionSize({ width, height });
              }}>
                <Button
                  title={canBook ? "Забронировать" : "Выбрать место"}
                  disabled={active.available === false || addingPlace}
                  style={[styles.bookingButton, !canBook && styles.meetingPickerButton]}
                  textStyle={styles.actionLabel}
                  accessibilityState={canBook ? undefined : { expanded: meetingPickerOpen }}
                  onPress={() => {
                    if (canBook) onBook(active);
                    else setMeetingPickerOpen(!meetingPickerOpen);
                  }}
                />
                {!canBook && <View pointerEvents="none" style={[styles.meetingPickerChevron, { transform: [{ rotate: meetingPickerOpen ? "-90deg" : "90deg" }] }]}>
                  <Icon name="chevron" size={12} color={colors.onPrimary} />
                </View>}
              </View>
            </Row>
          </>
        ) : (
          <>
            <Text style={styles.emptyState}>
              {busy
                ? "Подбираем места для вашей компании…"
                : "Нет мест с такими условиями. Попробуйте другую кухню или бюджет."}
            </Text>
            {!busy && (
              <Text style={styles.retry} onPress={onFilters}>
                Изменить фильтры
              </Text>
            )}
          </>
        )}
      </View>
      {meetingPickerOpen && <View style={[styles.meetingPicker, { width: Math.max(220, actionSize.width), bottom: 34 + actionSize.height }]}>
        <Text style={styles.meetingPickerTitle}>Добавить во встречу</Text>
        <ScrollView style={styles.meetingPickerList} keyboardShouldPersistTaps="handled">
          {availableMeetings.map(item => <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Добавить в «${item.title}», ${item.date}, ${item.time}`}
            style={({ pressed }) => [styles.meetingOption, pressed && styles.meetingOptionPressed]}
            onPress={() => void chooseMeeting(item)}
          >
            <Text style={styles.meetingOptionTitle}>{item.title}</Text>
            <Text style={styles.meetingOptionDate}>{item.date.split("-").reverse().join(".")} · {item.time}</Text>
          </Pressable>)}
          {!availableMeetings.length && <Text style={styles.meetingPickerEmpty}>
            Нет встреч с открытым голосованием, в которые можно добавить это место.
          </Text>}
        </ScrollView>
      </View>}

    </View>
  );
}

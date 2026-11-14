import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import WebView from "react-native-webview";
import { serverUrl } from "../api/client";
export type MapEvent = {
  type: "ready" | "tilesready" | "select" | "center" | "coordinate";
  id?: string;
  latitude?: number;
  longitude?: number;
};
/** Встраивает карту и связывает её события с приложением. */
export default function RestaurantMap({
  items,
  onEvent,
  selectedId,
  center,
  mode = "catalog",
}: {
  items: { id: string; name: string; latitude?: number; longitude?: number }[];
  onEvent: (event: MapEvent) => void;
  selectedId?: string;
  mode?: "catalog" | "meeting";
  center?: { latitude: number; longitude: number };
}) {
  const ref = useRef<WebView<{}>>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const source = `${serverUrl}/api/map`;
  const latest = useRef({ items, selectedId, center, mode });
  // В iframe передаём только данные меток: локальные Expo-изображения содержат функции
  // и не поддерживаются structured clone в window.postMessage.
  latest.current = { items: items.map(({id,name,latitude,longitude})=>({id,name,latitude,longitude})), selectedId, center, mode };
  // Изменение цены или картинки не должно пересоздавать DOM меток во время нажатия.
  const markersKey = JSON.stringify(latest.current.items);
  /** Передаёт состояние во встроенную карту. */
  const send = () => {
    const message = { type: "places", ...latest.current };
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(message, serverUrl);
    else ref.current?.postMessage(JSON.stringify(message));
  };
  /** Обрабатывает сообщение встроенной карты. */
  const receive = (data: MapEvent) => {
    if (data.type === "ready") send();
    onEvent(data);
  };
  useEffect(send, [markersKey, selectedId, center?.latitude, center?.longitude, mode]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    /** Обрабатывает событие обмена с картой. */
    const listener = (e: MessageEvent) => {
      if (e.origin === serverUrl && e.source === frame.current?.contentWindow)
        receive(e.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onEvent]);
  if (Platform.OS === "web")
    return (
      <iframe
        title="Карта ресторанов OpenStreetMap"
        ref={frame}
        src={source}
        style={{ border: 0, width: "100%", height: "100%" }}
      />
    );
  return (
    <WebView<{}>
      ref={ref}
      source={{ uri: source }}
      applicationNameForUserAgent="Meetly/1.0"
      style={{ flex: 1 }}
      originWhitelist={[serverUrl]}
      onMessage={(e) => {
        try {
          receive(JSON.parse(e.nativeEvent.data));
        } catch {}
      }}
    />
  );
}

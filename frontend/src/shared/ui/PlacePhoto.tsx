import { useEffect, useState } from "react";
import { Image, ActivityIndicator, View, StyleSheet, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { Text, useTheme } from "../theme";
import { Icon } from "./Icon";

/** Показывает встроенное фото карточки, индикатор загрузки или заглушку при ошибке. */
export default function PlacePhoto({ id, name, image, style }: {
  id: string;
  name: string;
  image?: ImageSourcePropType;
  style: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [id, image]);
  useEffect(() => {
    if (!image || loaded || failed) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [id, image, loaded, failed]);
  return (
    <View style={[style, { overflow: "hidden", backgroundColor: colors.surfaceRaised }]}>
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", gap: 8 }]}>
          {image && !failed ? (
            <ActivityIndicator color={colors.primaryText} accessibilityLabel="Загрузка фото" />
          ) : (
            <>
              <Icon name="pin" size={28} color={colors.textSecondary} />
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Нет фото</Text>
            </>
          )}
        </View>
      )}
      {image && !failed ? (
        <Image
          accessibilityLabel={`Фото ${name}`}
          source={image}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => { setFailed(true); setLoaded(false); }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

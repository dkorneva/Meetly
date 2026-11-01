import { useState } from "react";
import { useWindowDimensions, Pressable, View } from "react-native";
import IntroIllustration from "../../../../assets/illustrations/intro.svg";
import IntroMapIllustration from "../../../../assets/illustrations/intro-map.svg";
import IntroVoteIllustration from "../../../../assets/illustrations/intro-vote.svg";
import { Button, Row } from "../../../shared/ui/controls/index";
import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import {
  createStyles,
  getIllustrationSize,
  getSlideIndicator,
} from "./Onboarding.styles";

// Заголовки и описания трёх ознакомительных слайдов.
const slides = [
  {
    title: "Соберите всех в одном\nместе",
    text: "Создайте встречу и пригласите друзей, коллег или близких — всё в одном приложении.",
  },
  {
    title: "Мы подберём место за вас",
    text: "Учитываем бюджет, кухню, район, погоду и события рядом — и предлагаем 3 лучших варианта.",
  },
  {
    title: "Голосуйте и бронируйте в\nодин клик",
    text: "Участники голосуют в чате, а Meetly бронирует место автоматически.",
  },
];
// onDone завершает знакомство с приложением, onLogin открывает вход.
/**
 * Показывает ознакомительные слайды и передаёт действия завершения или входа родителю.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function Onboarding({
  onDone,
  onLogin,
}: {
  onDone: () => void;
  onLogin: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [index, setIndex] = useState(0); // Номер текущего слайда: 0, 1 или 2.
  const { width } = useWindowDimensions();
  // Ограничиваем ширину иллюстрации и оставляем по 20 единиц отступа с каждой стороны.
  const w = Math.min(width, 480) - 40;
  return (
    <View style={styles.root}>
      <Text style={styles.logo}>
        Meetly<Text style={styles.logoAccent}>.</Text>
      </Text>
      <View style={styles.content}>
        <View
          style={[
            styles.art,
            styles.illustrationSpacing,
            getIllustrationSize(w),
          ]}
        >
          {/* Выбираем иллюстрацию по номеру слайда. */}
          {index === 0 ? (
            <IntroIllustration width="100%" height="100%" />
          ) : index === 1 ? (
            <IntroMapIllustration width="100%" height="100%" />
          ) : (
            <IntroVoteIllustration width="100%" height="100%" />
          )}
        </View>
        <Text style={styles.title}>{slides[index].title}</Text>
        <Text style={styles.text}>{slides[index].text}</Text>
      </View>
      <Row style={styles.pagination}>
        {/* Нажатие на индикатор сразу открывает соответствующий слайд. */}
        {slides.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setIndex(i)}
            accessibilityLabel={`Слайд ${i + 1}`}
            style={[styles.indicator, getSlideIndicator(colors, i === index)]}
          />
        ))}
      </Row>
      <Button
        textStyle={styles.nextButtonLabel}
        title={index === 2 ? "Начать" : "Далее"}
        // На последнем слайде завершаем просмотр, на остальных — переходим дальше.
        onPress={() => (index === 2 ? onDone() : setIndex(index + 1))}
      />
      <Pressable
        // На последнем слайде открываем вход; иначе пропускаем знакомство.
        onPress={index === 2 ? onLogin : onDone}
        style={styles.skipButton}
      >
        <Text style={styles.skipLabel}>
          {index === 2 ? "У меня уже есть аккаунт" : "Пропустить"}
        </Text>
      </Pressable>
    </View>
  );
}

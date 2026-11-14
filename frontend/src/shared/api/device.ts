import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
// Linking открывает ссылки, Share вызывает стандартное меню «Поделиться».
import { Linking,Share } from "react-native";

// Открываем выбор файла для сообщения.
// Promise описывает будущий результат: вложение или null, если выбор отменён.
/**
 * Открывает системный выбор файла и возвращает имя, URI и признак изображения либо null при отмене.
 *
 * @returns Promise с данными файла или null при отмене.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export async function chooseAttachment(): Promise<
  { name: string; uri: string; image: boolean } | null
> {
  const result = await DocumentPicker.getDocumentAsync({
    // Копируем выбранный файл во временную папку приложения для дальнейшего доступа.
    copyToCacheDirectory: true,
  });
  // При отмене сразу завершаем функцию, ничего не добавляя в чат.
  if (result.canceled) return null;
  // assets — список выбранных файлов; берём первый элемент (индекс 0).
  const asset = result.assets[0];
  // Возвращаем только сведения, нужные чату: имя, адрес файла и признак изображения.
  return {
    name: asset.name,
    uri: asset.uri, // Адрес, по которому приложение обращается к выбранному файлу.
    // Тип изображения начинается с "image/", например "image/png".
    // ?. проверяет строку, только если mimeType есть; ?? false подставляет false, если его нет.
    image: asset.mimeType?.startsWith("image/") ?? false,
  };
}
// Выбираем фото профиля; результат — адрес картинки или null при отмене.
/**
 * Открывает выбор изображения профиля и возвращает URI либо null при отмене.
 *
 * @returns Promise с URI изображения или null при отмене.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export async function chooseAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"], // Разрешаем выбирать только изображения.
    allowsEditing: true, // Включаем редактирование там, где оно поддерживается.
    aspect: [1, 1], // Квадратная обрезка на Android; на iOS обрезка и так квадратная.
    quality: 0.8, // Запрашиваем качество 80%; результат зависит от платформы и формата.
  });
  return result.canceled ? null : result.assets[0].uri;
}
/**
 * Открывает системное меню отправки переданного текста.
 *
 * @param message - Сообщение для обработки.
 * @returns Результат операции; для обработчиков без результата — void.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export function shareText(message: string) {
  return Share.share({ message });
}

// Просим систему открыть адрес: например, сайт в браузере или ссылку в другом приложении.
// Возвращаем Promise от openURL, чтобы вызывающий код мог дождаться открытия или поймать ошибку.
/**
 * Передаёт URI операционной системе для открытия браузера или другого приложения.
 *
 * @param url - Адрес сайта или ссылка приложения, например tel:.
 * @returns Результат операции; для обработчиков без результата — void.
 * @throws При ошибке системного API или восстановления данных возвращённый Promise отклоняется.
 */
export function openExternalLink(url: string) {
  return Linking.openURL(url);
}

import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
/** Экспортирует календарный файл встречи. */
export async function exportCalendar(text: string, id: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `meetly-${id}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const file = new File(Paths.cache, `meetly-${id}.ics`);
    file.write(text);
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("На устройстве недоступна отправка файла");
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/calendar",
      UTI: "public.calendar-event",
    });
  }
}



import { Button } from "../../../shared/ui/controls/index";

// controller создаётся в App вызовом useAppController() и передаётся сюда
// через параметры компонентов: App → AppContent → DialogHost → AttachmentDialog.

/**
 * Предлагает выбрать файл или отправить сведения о месте в чат.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function AttachmentDialog({
  controller,
}: {
  controller: {
    sharePlaceInChat: () => void;
    pickAttachment: () => Promise<void>;
  };
}) {
  return (
    <>
      <Button
        title="Выбрать файл или фотографию"
        onPress={controller.pickAttachment}
      />
      <Button
        title="Поделиться выбранным местом"
        onPress={controller.sharePlaceInChat}
      />
    </>
  );
}

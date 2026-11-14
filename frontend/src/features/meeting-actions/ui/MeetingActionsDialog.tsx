import type { Screen } from "../../../shared/config/screens";
import type { DialogName } from "../../../shared/config/dialogs";
import type { Meeting } from "../../../entities/meeting";

import { Button } from "../../../shared/ui/controls/index";

/**
 * Показывает действия встречи с учётом её статуса.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function MeetingActionsDialog({
  controller,
}: {
  controller: {
    selectLeader: () => void;
    setScreen: (screen: Screen) => void;
    setDialog: (dialog: DialogName) => void;
    cancelCurrentBooking: () => void;
    meeting: Meeting;
    share: () => void;
  };
}) {
  const {
    selectLeader,
    setScreen,
    setDialog,
    cancelCurrentBooking,
    meeting,
    share,
  } = controller;
  return (
    <>
      <Button
        title="Участники"
        variant="outline"
        // записываем в dialog имя окна "participants".
        // по этому имени DialogHost показывает окно участников ParticipantsDialog.
        onPress={() => setDialog("participants")}
      />
      <Button
        title="Изменить предпочтения"
        variant="outline"
        onPress={() => {
          setDialog(null);
          setScreen("edit");
        }}
      />
      <Button title="Поделиться встречей" variant="outline" onPress={share} />
      {meeting.status === "voting" && (
        <Button title="Выбрать лидера" onPress={selectLeader} />
      )}
      {meeting.status === "completed" && (
        <Button
          title="Отменить бронирование"
          onPress={cancelCurrentBooking}
          variant="outline"
        />
      )}
    </>
  );
}

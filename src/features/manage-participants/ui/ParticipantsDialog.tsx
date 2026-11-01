import type { DialogName } from "../../../shared/config/dialogs";
import type { Meeting } from "../../../entities/meeting";

import { Text, useTheme, useThemedStyles } from "../../../shared/theme/index";
import { Avatars, Button, IconButton, Row } from "../../../shared/ui/controls/index";
import { createStyles } from "./ParticipantsDialog.styles";

/**
 * Показывает участников встречи, удаление и переход к приглашению.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function ParticipantsDialog({
  controller,
}: {
  controller: {
    setDialog: (dialog: DialogName) => void;
    meeting: Meeting;
    removeParticipant: (name: string) => void;
  };
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { setDialog, meeting, removeParticipant } = controller;
  return (
    <>
      {meeting.participants.map((n) => (
        <Row key={n}>
          <Row style={styles.participantInfo}>
            <Avatars names={[n]} />
            <Text style={styles.participantName}>{n}</Text>
          </Row>
          {n !== "Аня" && (
            <IconButton
              name="close"
              color={colors.textMuted}
              onPress={() => removeParticipant(n)}
            />
          )}
        </Row>
      ))}
      <Button title="Пригласить" onPress={() => setDialog("invite")} />
    </>
  );
}

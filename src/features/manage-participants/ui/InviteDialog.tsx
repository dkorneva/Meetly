

import { useState } from "react";
import type { Meeting } from "../../../entities/meeting";
import { validateParticipant } from "../../../shared/lib/participants";
import { Text, useTheme } from "../../../shared/theme/index";
import { Button, Field } from "../../../shared/ui/controls/index";
import { useUiStyles } from "../../../shared/ui/shared.styles";

/**
 * Показывает поле имени и действия добавления участника или отправки приглашения.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function InviteDialog({
  controller,
}: {
  controller: {
    inviteParticipant: () => void;
    inviteName: string;
    setInviteName: (value: string) => void;
    share: () => void;
    meeting: Meeting;
  };
}) {
  const uiStyles = useUiStyles();
  const { colors } = useTheme();
  const [attempted, setAttempted] = useState(false);

  const { inviteParticipant, inviteName, setInviteName, share, meeting } = controller;
  const error = validateParticipant(inviteName, meeting.participants);
  return (
    <>
      <Text style={uiStyles.muted}>
        Добавьте участника во встречу или отправьте приглашение друзьям.
      </Text>
      <Field
        label="Имя участника"
        value={inviteName}
        onChangeText={setInviteName}
        placeholder="Например, Саша"
      />
      {attempted && !!error && <Text accessibilityRole="alert" style={{ color: colors.accentText }}>{error}</Text>}
      <Button title="Добавить участника" onPress={() => {
        setAttempted(true);
        if (!error) inviteParticipant();
      }} />
      <Button title="Поделиться приглашением" variant="outline" onPress={share} />
    </>
  );
}

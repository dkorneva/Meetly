

import { Text } from "../../../shared/theme/index";
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
  };
}) {
  const uiStyles = useUiStyles();

  const { inviteParticipant, inviteName, setInviteName, share } = controller;
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
      <Button title="Добавить участника" onPress={inviteParticipant} />
      <Button title="Поделиться приглашением" variant="outline" onPress={share} />
    </>
  );
}

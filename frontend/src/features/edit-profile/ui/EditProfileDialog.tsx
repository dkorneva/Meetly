

import { Button, Field } from "../../../shared/ui/controls/index";

/**
 * Показывает редактируемые имя и email, выбор фотографии и сохранение профиля.
 *
 * @param props - Свойства компонента: данные для отображения и обработчики действий.
 * @returns Элементы интерфейса React.
 */
export default function EditProfileDialog({
  controller,
}: {
  controller: {
    saveProfile: () => void;
    editName: string;
    setEditName: (value: string) => void;
    editEmail: string;
    setEditEmail: (value: string) => void;
    pickAvatar: () => Promise<void>;
  };
}) {
  const {
    saveProfile,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    pickAvatar,
  } = controller;
  return (
    <>
      <Button title="Выбрать фотографию" variant="outline" onPress={pickAvatar} />
      <Field label="Имя" value={editName} onChangeText={setEditName} />
      <Field
        label="Электронная почта"
        value={editEmail}
        onChangeText={setEditEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Сохранить" onPress={saveProfile} />
    </>
  );
}

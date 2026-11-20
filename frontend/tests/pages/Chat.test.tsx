import { render, fireEvent, act } from "@testing-library/react-native";
import { Chat, ChatsScreen } from "../../src/pages/chat";
import { restaurants } from "../data";
import { makeController } from "../fixtures";
import { openExternalLink } from "../../src/shared/api/device";
import { dayLabel, messageDay, continuesGroup } from "../../src/pages/chat/model/messages";
import { type Message } from "../../src/entities/meeting";



describe("Chat", () => {
  describe("Chat", () => {
    const props = () => ({
      meeting: makeController().meeting,
      messages: [],
      leader: restaurants[0].name,
      onLeader: jest.fn(),
      onSend: jest.fn(),
      onLike: jest.fn(),
      onAttach: jest.fn(),
    });
    test("отправляет очищенный текст и очищает поле", async () => {
      const p = props();
      const ui = await render(<Chat {...p} />);
      await fireEvent.changeText(
        ui.getByPlaceholderText("Сообщение"),
        " Привет! ",
      );
      await fireEvent.press(ui.getByLabelText("Отправить сообщение"));
      expect(p.onSend).toHaveBeenCalledWith("Привет!");
      expect(ui.getByPlaceholderText("Сообщение").props.value).toBe("");
    });
    test("не отправляет сообщение из пробелов", async () => {
      const p = props();
      const ui = await render(<Chat {...p} />);
      await fireEvent.changeText(ui.getByPlaceholderText("Сообщение"), "   ");
      await fireEvent.press(ui.getByLabelText("Отправить сообщение"));
      expect(p.onSend).not.toHaveBeenCalled();
    });
    test("вызывает открытие вложений", async () => {
      const p = props();
      const ui = await render(<Chat {...p} />);
      await fireEvent.press(ui.getByLabelText("Прикрепить файл"));
      expect(p.onAttach).toHaveBeenCalledTimes(1);
    });
    test("показывает системное сообщение и карточку выбранного места", async () => {
      const p = props();
      const messages = [
        {
          id: "sys",
          name: "",
          time: "",
          kind: "system" as const,
          text: "Встреча создана",
        },
        {
          id: "place",
          name: "",
          time: "",
          kind: "selected" as const,
          text: "Терраса завтра",
        },
      ];
      const ui = await render(<Chat {...p} messages={messages} />);
      expect(ui.getByText("Встреча создана")).toBeOnTheScreen();
      expect(ui.getByText("Место выбрано")).toBeOnTheScreen();
      expect(ui.getByText("Терраса завтра")).toBeOnTheScreen();
    });
    test("передаёт идентификатор сообщения при долгом нажатии", async () => {
      const p = props();
      const ui = await render(
        <Chat
          {...p}
          messages={[{ id: "msg", name: "Маша", time: "12:00", text: "Привет" }]}
        />,
      );
      await fireEvent(ui.getByText("Привет"), "longPress");
      expect(p.onLike).toHaveBeenCalledWith("msg");
    });
    test("подписывает автора один раз подряд, разделяет дни и сообщения разных людей с одинаковым именем", async () => {
      const p=props();
      const messages=[
        {id:'1',senderId:'a',name:'Маша',text:'Первое',time:'12:00',createdAt:'2026-10-01T09:00:00Z'},
        {id:'2',senderId:'a',name:'Маша',text:'Второе',time:'12:01',createdAt:'2026-10-01T09:01:00Z'},
        {id:'3',senderId:'b',name:'Маша',text:'Другой человек',time:'12:02',createdAt:'2026-10-01T09:02:00Z'},
        {id:'4',senderId:'b',name:'Маша',text:'Следующий день',time:'12:00',createdAt:'2026-10-02T09:00:00Z'},
        {id:'5',senderId:'b',name:'',text:'Системное событие',time:'12:01',createdAt:'2026-10-02T09:01:00Z',kind:'system' as const},
        {id:'6',senderId:'b',name:'Маша',text:'После события',time:'12:02',createdAt:'2026-10-02T09:02:00Z'},
      ];
      const ui=await render(<Chat {...p} messages={messages}/>);
      expect(ui.getByTestId('message-author-1')).toBeOnTheScreen();
      expect(ui.queryByTestId('message-author-2')).toBeNull();
      for(const id of ['3','4','6'])expect(ui.getByTestId('message-author-'+id)).toBeOnTheScreen();
      expect(ui.getByText('1 октября 2026 г.')).toBeOnTheScreen();
      expect(ui.getByText('2 октября 2026 г.')).toBeOnTheScreen();
    });
    test.each(["selected", "booked", "completed"] as const)("сохраняет плашку лидера при статусе %s и сообщение в истории",async(status)=>{
      const p=props();
      const ui=await render(<Chat {...p} meeting={{...p.meeting,status,restaurantId:restaurants[0].id}} messages={[{id:"chosen",name:"",time:"",kind:"selected",text:"Терраса, 7 ноября в 19:00"}]}/>);
      expect(ui.getByText('ЛИДИРУЕТ')).toBeOnTheScreen();
      expect(ui.queryByText('МЕСТО ВЫБРАНО')).toBeNull();
      expect(ui.queryByText('БРОНИРОВАНИЕ ПОДТВЕРЖДЕНО')).toBeNull();
      expect(ui.getByText('Место выбрано')).toBeOnTheScreen();
      await fireEvent.press(ui.getByLabelText('Открыть лидера голосования'));
      expect(p.onLeader).toHaveBeenCalledTimes(1);
    });
  });
});

describe("ChatsScreen", () => {
  test('список показывает все встречи, свежий чат первым, превью и поиск',async()=>{
    const base=makeController().meeting,onOpen=jest.fn();
    const meetings=[{...base,id:'old',title:'Деловая встреча',lastMessage:{text:'До встречи',name:'Анна',senderId:'a',kind:'text',createdAt:'2026-10-01T12:00:00Z'}},
      {...base,id:'new',title:'Вечер с друзьями',status:'completed' as const,lastMessage:{text:'Готово',name:'Иван',senderId:'me',kind:'text',createdAt:'2026-10-02T12:00:00Z'}}];
    const ui=await render(<ChatsScreen meetings={meetings} userId="me" onOpen={onOpen}/>);
    expect(ui.getAllByRole('button')[0]).toHaveProp('accessibilityLabel','Открыть чат Вечер с друзьями');
    expect(ui.getByText('Вы: ')).toBeOnTheScreen();
    await fireEvent.press(ui.getByLabelText('Открыть чат Вечер с друзьями'));
    expect(onOpen).toHaveBeenCalledWith('new');
    await fireEvent.changeText(ui.getByLabelText('Поиск чатов'),'Деловая');
    expect(ui.queryByText('Вечер с друзьями')).toBeNull();
    expect(ui.getByText('Деловая встреча')).toBeOnTheScreen();
  });

  test('пустой список даёт понятную подсказку',async()=>{
    const ui=await render(<ChatsScreen meetings={[]} onOpen={jest.fn()}/>);
    expect(ui.getByText('Здесь будут чаты встреч')).toBeOnTheScreen();
  });

  test('выбранное место в превью подписано кратко',async()=>{
   const meeting={...makeController().meeting,lastMessage:{text:'Терраса, 7 ноября в 19:00',kind:'selected',name:'',senderId:'owner',createdAt:'2026-11-07T10:00:00Z'}};
   const ui=await render(<ChatsScreen meetings={[meeting]} onOpen={jest.fn()}/>);
   expect(ui.getByText('Место выбрано')).toBeOnTheScreen();
   expect(ui.queryByText('Терраса, 7 ноября в 19:00')).toBeNull();
  });
});

describe("chat.behavior", () => {
  const message = (patch: Partial<Message> = {}): Message => ({ id: "one", name: "Анна", text: "Документ", time: "12:00", createdAt: "2026-01-01T09:00:00Z", ...patch });
  test("вложение открывается системным приложением, реакции передают ID сообщения", async () => {
    const onLike = jest.fn(), onLoadOlder = jest.fn();
    const item = message({ attachment: { uri: "https://example.test/file", image: true, name: "Фото" }, liked: true });
    const ui = await render(<Chat meeting={makeController().meeting} messages={[item]} leader="Кафе" onLeader={jest.fn()} onSend={jest.fn()} onLike={onLike} onAttach={jest.fn()} hasOlderMessages onLoadOlder={onLoadOlder} />);
    await act(async () => { await fireEvent.press(ui.getByText("Документ")); });
    expect(openExternalLink).toHaveBeenCalledWith("https://example.test/file");
    await fireEvent(ui.getByText("Документ"), "longPress");
    expect(onLike).toHaveBeenCalledWith("one");
    await fireEvent.press(ui.getByLabelText("Реакция на сообщение"));
    expect(onLike).toHaveBeenCalledTimes(2);
    await fireEvent.press(ui.getByText("Загрузить более ранние сообщения"));
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });
  test("день сообщения определяется по Москве, подписи сегодня и вчера учитывают дату", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-11-18T10:00:00Z"));
    try {
      expect(dayLabel(message({ createdAt: "2026-11-18T09:00:00Z" }))).toBe("Сегодня");
      expect(dayLabel(message({ createdAt: "2026-11-17T09:00:00Z" }))).toBe("Вчера");
      expect(dayLabel(message({ createdAt: undefined }))).toBe("");
      expect(messageDay(message({ createdAt: undefined }))).toBe("");
      expect(messageDay(message({ createdAt: "2026-11-17T22:00:00Z" }))).toBe(messageDay(message({ createdAt: "2026-11-18T01:00:00Z" })));
    } finally { jest.useRealTimers(); }
  });
  test("группировка учитывает ID автора, день, системные сообщения и старые сообщения без ID", () => {
    const first = message({ senderId: "author" });
    expect(continuesGroup(first, message({ senderId: "author", name: "Другое имя" }))).toBe(true);
    expect(continuesGroup(first, message({ senderId: "other" }))).toBe(false);
    expect(continuesGroup(first, message({ senderId: "author", kind: "system" }))).toBe(false);
    expect(continuesGroup(message(), message())).toBe(true);
    expect(continuesGroup(message(), message({ mine: true }))).toBe(false);
    expect(continuesGroup(undefined, message())).toBe(false);
  });
});

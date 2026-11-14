import { render, fireEvent } from "@testing-library/react-native";
import { Chat } from "../../src/pages/chat";
import { restaurants } from "../data";
import { makeController } from ".././fixtures";

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

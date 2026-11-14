import {render,fireEvent} from '@testing-library/react-native';
import {ChatsScreen} from '../../src/pages/chat';
import {makeController} from '../fixtures';

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

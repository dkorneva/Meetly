import {render,fireEvent,waitFor} from '@testing-library/react-native';
import {MapScreen} from '../../src/pages/map';
import {api} from '../../src/shared/api/client';
import {restaurantView} from '../../src/entities/meeting';
import {makeController} from '../fixtures';
jest.mock('../../src/shared/ui/RestaurantMap',()=>({__esModule:true,default:(props:unknown)=>require('react').createElement(require('react-native').View,{testID:'map',...(props as object)})}));
const filters={budget:'Все',cuisine:[] as string[]};
const places=Array.from({length:12},(_,i)=>({id:`place-${i}`,name:`Ресторан ${i}`,latitude:55.7558+i*.001,longitude:37.6176,cuisine:'italian',cuisineLabel:'Итальянская',price:1200,address:'Москва, адрес',source:'osm',website:'https://cafe.example',phone:'+74950000000',city:'Москва',district:'Центр',outdoor:false,openingHours:'24/7'}));
const response={items:places,center:{latitude:55.7558,longitude:37.6176},total:12,unknownPriceCount:0,source:'osm-database'};
beforeEach(()=>{jest.mocked(api).mockImplementation(async path=>path.includes('/details')?places.find(p=>path.includes(p.id))!:response)});

test('Обычная карта показывает весь каталог без выбранной встречи и не ограничивает метки восемью',async()=>{
  const ui=await render(<MapScreen filters={filters} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByLabelText('Найдено: 12, Садовое кольцо')).toBeOnTheScreen());
  expect(ui.getByTestId('map').props.items).toHaveLength(12);
  expect(api).toHaveBeenCalledWith(expect.stringContaining('/restaurants/discovery?'),'GET',undefined);
  expect(jest.mocked(api).mock.calls.some(([p])=>p.includes('/meetings/'))).toBe(false);
});
test('Бюджет и кухня передаются фильтрам каталога, встреча не изменяется',async()=>{
  const ui=await render(<MapScreen meeting={makeController().meeting} filters={{...filters,budget:'До 1500 ₽',cuisine:['Итальянская']}} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  expect(jest.mocked(api).mock.calls.some(([p])=>p.includes('/restaurants/discovery?')&&p.includes('budget=1500')&&p.includes('cuisines='))).toBe(true);
  expect(jest.mocked(api).mock.calls.some(([p])=>p.includes('/apply'))).toBe(false);
});
test('Из карточки встречи отображаются только её варианты, выбранная метка сохраняется независимо от фильтров каталога',async()=>{
  const candidates=places.slice(0,3).map(restaurantView);const meeting={...makeController().meeting!,candidates};
  const ui=await render(<MapScreen mode="meeting" meeting={meeting} initialRestaurant={candidates[1]} filters={{...filters,budget:'До 1000 ₽',cuisine:['Японская']}} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByLabelText('Вариантов встречи: 3')).toBeOnTheScreen());
  expect(ui.getByTestId('map').props.items.map((p:{id:string})=>p.id)).toEqual(candidates.map(p=>p.id));
  expect(ui.getByTestId('map').props.selectedId).toBe(candidates[1].id);
  expect(jest.mocked(api).mock.calls.some(([p])=>p.includes('/discovery')||p.includes('/recommendations'))).toBe(false);
  expect(ui.queryByLabelText('Фильтры')).toBeNull();
});
test('Список предлагает только открытые встречи без этого заведения и добавляет место в выбранную встречу',async()=>{
  const base=makeController().meeting;
  const meetings=[
    {...base,id:'first',title:'Первый ужин',status:'voting' as const,candidates:[]},
    {...base,id:'second',title:'Второй ужин',status:'voting' as const,candidates:[]},
    {...base,id:'closed',title:'Голосование закрыто',status:'selected' as const,candidates:[]},
    {...base,id:'already',title:'Уже добавлено',status:'voting' as const,candidates:[restaurantView(places[0])]},
  ];
  const onPropose=jest.fn();const ui=await render(<MapScreen meetings={meetings} filters={filters} onBook={jest.fn()} onPropose={onPropose} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  await fireEvent.press(ui.getByRole('button',{name:'Выбрать место'}));
  expect(onPropose).not.toHaveBeenCalled();
  expect(ui.getByRole('button',{name:'Выбрать место'}).props.accessibilityState).toEqual(expect.objectContaining({expanded:true}));
  expect(ui.getByText('Первый ужин')).toBeOnTheScreen();
  expect(ui.getByText('Второй ужин')).toBeOnTheScreen();
  expect(ui.queryByText('Голосование закрыто')).toBeNull();
  expect(ui.queryByText('Уже добавлено')).toBeNull();
  await fireEvent.press(ui.getByRole('button',{name:/Добавить в «Второй ужин»/}));
  expect(onPropose).toHaveBeenCalledWith(expect.objectContaining({id:'place-0'}),'second');
  await waitFor(()=>expect(ui.queryByText('Добавить во встречу')).toBeNull());
});

test('Без подходящих встреч список объясняет причину и закрывается нажатием вне списка',async()=>{
  const onPropose=jest.fn();const ui=await render(<MapScreen filters={filters} onBook={jest.fn()} onPropose={onPropose} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  await fireEvent.press(ui.getByRole('button',{name:'Выбрать место'}));
  expect(ui.getByText('Нет встреч с открытым голосованием')).toBeOnTheScreen();
  await fireEvent.press(ui.getByRole('button',{name:'Закрыть список встреч'}));
  expect(ui.queryByText('Добавить во встречу')).toBeNull();
  expect(onPropose).not.toHaveBeenCalled();
});

test('При выборе другой метки список закрывается, а добавленное ранее место снова доступно для другой метки',async()=>{
  const meeting={...makeController().meeting,candidates:[restaurantView(places[0])]};
  const ui=await render(<MapScreen meetings={[meeting]} filters={filters} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  await fireEvent.press(ui.getByRole('button',{name:'Выбрать место'}));
  await fireEvent(ui.getByTestId('map'),'event',{type:'select',id:'place-1'});
  expect(ui.queryByText('Добавить во встречу')).toBeNull();
  await fireEvent.press(ui.getByRole('button',{name:'Выбрать место'}));
  expect(ui.getByRole('button',{name:/Добавить в «Ужин с командой»/})).toBeOnTheScreen();
});

test('Карта вариантов встречи сохраняет действие бронирования',async()=>{
  const onBook=jest.fn(),candidate=restaurantView(places[0]);
  const meeting={...makeController().meeting,candidates:[candidate]};
  const ui=await render(<MapScreen mode="meeting" meeting={meeting} filters={filters} onBook={onBook} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  await fireEvent.press(ui.getByRole('button',{name:'Забронировать'}));
  expect(onBook).toHaveBeenCalledWith(expect.objectContaining({id:'place-0'}));
  expect(ui.queryByText('Добавить во встречу')).toBeNull();
});
test('Ошибка каталога показана явно',async()=>{
  jest.mocked(api).mockRejectedValue(new Error('Каталог недоступен'));
  const ui=await render(<MapScreen filters={filters} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByRole('alert')).toHaveTextContent('Каталог недоступен'));
});

test('Выбор метки обновляет карточку, нажатие на саму карточку не открывает подробности',async()=>{
  const ui=await render(<MapScreen filters={filters} onBook={jest.fn()} onFilters={jest.fn()}/>);
  await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
  expect(ui.queryByRole('button',{name:'Подробнее о Ресторан 0'})).toBeNull();
  await fireEvent.press(ui.getByText('Ресторан 0'));
  expect(ui.queryByText('О ресторане')).toBeNull();
  await fireEvent(ui.getByTestId('map'),'event',{type:'select',id:'place-1'});
  await waitFor(()=>expect(ui.getByText('Ресторан 1')).toBeOnTheScreen());
  expect(ui.getByTestId('map').props.selectedId).toBe('place-1');
  expect(ui.queryByText('О ресторане')).toBeNull();
});

test('передаёт несколько кухонь и позволяет снять отдельный фильтр', async()=>{
 const onFilterChange=jest.fn();
 const ui=await render(<MapScreen filters={{budget:'До 1500 ₽',cuisine:['Японская','Грузинская']}} onFilterChange={onFilterChange} onBook={jest.fn()} onFilters={jest.fn()}/>);
 await waitFor(()=>expect(ui.getByText('Ресторан 0')).toBeOnTheScreen());
 const path=jest.mocked(api).mock.calls.find(([p])=>p.includes('/restaurants/discovery?'))![0];
 expect(new URLSearchParams(path.split('?')[1]).getAll('cuisines')).toEqual(['Японская','Грузинская']);
 await fireEvent.press(ui.getByLabelText('Снять фильтр кухни Японская'));
 expect(onFilterChange).toHaveBeenCalledWith({cuisine:['Грузинская']});
 await fireEvent.press(ui.getByLabelText('Снять фильтр бюджета'));
 expect(onFilterChange).toHaveBeenCalledWith({budget:'Все'});
});

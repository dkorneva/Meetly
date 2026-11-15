import type { Restaurant } from "./models";
import type { RemoteRestaurant } from "../../../shared/api/contracts";
// Shared card photos; selection by ID stays stable between sessions.
const restaurantPhotos = [
  require("../../../../assets/restaurants/coffeemania-nikitskaya.webp"),
  require("../../../../assets/restaurants/dr-zhivago.webp"),
  require("../../../../assets/restaurants/hachiko-pyatnitskaya.webp"),
  require("../../../../assets/restaurants/jagannath-kuznetsky.webp"),
  require("../../../../assets/restaurants/kappo-hiroki.webp"),
  require("../../../../assets/restaurants/manul-okhotny.webp"),
  require("../../../../assets/restaurants/mollusca-dmitrovka.webp"),
  require("../../../../assets/restaurants/pizza22-solyanka.webp"),
  require("../../../../assets/restaurants/saldens-pyatnitskaya.webp"),
  require("../../../../assets/restaurants/space-paveletskaya.webp"),
];
/** Каталог заполняется только ответами сервера; демонстрационных записей нет. */
export const restaurants: Restaurant[] = [];
/** Преобразует ответ сервера в карточку со встроенным фото. */
export function restaurantView(r: RemoteRestaurant): Restaurant {
  const photoIndex = [...r.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % restaurantPhotos.length;
  return {
    ...r,
    cuisineLabel: r.cuisineLabel?.replace(/\s*[·•]\s*/g, ", "),
    rating: "",
    tag: r.matchLabel ?? "Реальное заведение",
    image: restaurantPhotos[photoIndex],
    vk: "",
  };
}
/** Обновляет клиентский каталог заведений. */
export function replaceCatalog(items: Restaurant[]) {
  restaurants.splice(0, restaurants.length, ...items);
}

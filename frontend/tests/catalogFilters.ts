import type { CatalogFilters } from "../src/shared/api/contracts";
export const catalogFilters: CatalogFilters = {
 cuisines:["Итальянская","Японская","Русская","Кофе","Бар","Вегетарианская","Грузинская","Чешская","Азербайджанская","Веганская","Суши"],
 budget:{min:500,max:7200,step:100,prices:[600,1000,1500,2500,5000,6500,7200]},
 formats:["В помещении","На улице","Не важно"],
};

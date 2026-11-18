import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useCatalogFilters } from "../src/shared/api/useCatalogFilters";
import { api } from "../src/shared/api/client";
import { catalogFilters } from "./catalogFilters";
test("ошибка фильтров отображается, повторная попытка загружает актуальные варианты", async () => {
  jest.mocked(api).mockRejectedValueOnce(new Error("Нет сети")).mockResolvedValueOnce(catalogFilters);
  const { result } = await renderHook(() => useCatalogFilters());
  await waitFor(() => expect(result.current.error).toBe("Нет сети"));
  await act(() => result.current.retry());
  await waitFor(() => expect(result.current.options).toEqual(catalogFilters));
  expect(result.current.error).toBe("");
});
test.each([{}, { cuisines: [], budget: {}, formats: [] }, { cuisines: [], budget: { prices: [] } }])("неполный ответ сервера не используется как набор фильтров: %j", async body => {
  jest.mocked(api).mockResolvedValueOnce(body);
  const { result } = await renderHook(() => useCatalogFilters());
  await waitFor(() => expect(result.current.error).toContain("Не удалось загрузить варианты"));
  expect(result.current.options).toBeNull();
});

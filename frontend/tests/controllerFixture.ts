import { renderHook, waitFor } from "@testing-library/react-native";
import { useAppController } from "../src/app/model/useAppController";
import { api, restoreSession } from "../src/shared/api/client";
import { makeController } from "./fixtures";
export function controllerStore() {
  return makeController().store;
}
export async function renderController(store = controllerStore()) {
  jest.mocked(restoreSession).mockResolvedValue(true);
  jest.mocked(api).mockImplementation(async (path, method = "GET") => {
    if (path === "/users/me")
      return {
        id: "owner",
        name: store.name,
        email: store.email,
        dark: false,
        calendar: true,
      };
    if (path === "/restaurants") return [];
    if (path === "/meetings" && method === "GET")
      return store.meetings.map((m) => ({
        ...m,
        ownerId: "owner",
        startsAt: `${m.date}T${m.time}:00+03:00`,
        members: [
          {
            userId: "owner",
            user: { id: "owner", name: store.name },
            budget: m.budget,
            cuisines: JSON.stringify(m.cuisines),
          },
        ],
        candidates: [],
      }));
    if (path.endsWith("/messages") && method === "GET")
      return { items: [], nextCursor: null };
    return { id: "created" };
  });
  const hook = await renderHook(() => useAppController());
  await waitFor(() => expect(hook.result.current.store.session).toBe(true));
  return hook;
}

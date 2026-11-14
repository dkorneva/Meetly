import { render, fireEvent } from "@testing-library/react-native";
import { RestaurantCard } from "../../src/pages/meeting-detail";
import { restaurants } from "../../src/entities/meeting";

describe("RestaurantCard", () => {
  test("показывает ресторан и передаёт голос", async () => {
    const onVote = jest.fn();
    const ui = await render(<RestaurantCard restaurant={restaurants[0]} voted={false} onVote={onVote} />);
    expect(ui.getByText(restaurants[0].name)).toBeOnTheScreen();
    await fireEvent.press(ui.getByRole("button", { name: "Голосовать" }));
    expect(onVote).toHaveBeenCalledTimes(1);
  });
});

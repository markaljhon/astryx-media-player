import { describe, expect, test } from "bun:test";
import { shouldPersistPlayerPreferenceChange } from "../features/players/api/playerPreferencePersistence";

describe("shouldPersistPlayerPreferenceChange", () => {
  test("does not persist default player state before media hydration", () => {
    expect(
      shouldPersistPlayerPreferenceChange({
        hasHydratedMedia: false,
        hydratedValue: null,
        nextValue: false,
        skipHydrationEcho: false,
      }),
    ).toBe(false);
  });

  test("persists the first user change when hydration did not change the media value", () => {
    expect(
      shouldPersistPlayerPreferenceChange({
        hasHydratedMedia: true,
        hydratedValue: false,
        nextValue: true,
        skipHydrationEcho: true,
      }),
    ).toBe(true);
  });

  test("skips the hydration echo when the next value matches the hydrated value", () => {
    expect(
      shouldPersistPlayerPreferenceChange({
        hasHydratedMedia: true,
        hydratedValue: true,
        nextValue: true,
        skipHydrationEcho: true,
      }),
    ).toBe(false);
  });
});

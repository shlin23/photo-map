import { describe, expect, it } from "vitest";

import { navigationItems } from "../src/lib/navigation";

describe("primary routes", () => {
  it("contains the four release pages without duplicate paths", () => {
    const paths = navigationItems.map((item) => item.href);

    expect(paths).toEqual(["/", "/dashboard", "/upload", "/map"]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("uses concise English navigation labels", () => {
    expect(navigationItems.every((item) => item.label.trim().length > 0)).toBe(true);
    expect(navigationItems.map((item) => item.label)).toEqual(["Home", "Dashboard", "Upload", "Map"]);
  });
});

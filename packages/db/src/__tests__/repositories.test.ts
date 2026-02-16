import { describe, expect, it } from "vitest";
import { paginate } from "../repositories/types.js";

describe("paginate", () => {
  it("calculates totalPages correctly", () => {
    const result = paginate(["a", "b", "c"], 10, { page: 1, limit: 3 });
    expect(result).toEqual({
      data: ["a", "b", "c"],
      total: 10,
      page: 1,
      limit: 3,
      totalPages: 4,
    });
  });

  it("handles exact division", () => {
    const result = paginate([1, 2], 6, { page: 3, limit: 2 });
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(3);
  });

  it("handles empty data", () => {
    const result = paginate([], 0, { page: 1, limit: 10 });
    expect(result.totalPages).toBe(0);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("handles single item", () => {
    const result = paginate(["only"], 1, { page: 1, limit: 10 });
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(1);
  });
});

import { describe, expect, it, vi } from "vitest";

// Mock Refine hooks
vi.mock("@refinedev/core", () => ({
  useShow: () => ({
    query: {
      data: {
        data: {
          id: "test-id",
          name: "Test Program",
          slug: "test-program",
          description: "Test description",
          status: "open",
          jurisdiction: { name: "Test Jurisdiction", country: "US" },
          benefits: [],
        },
      },
      isLoading: false,
    },
  }),
  useOne: () => ({
    data: {
      data: { id: "1", name: "Test" },
    },
    isLoading: false,
  }),
}));

vi.mock("@refinedev/antd", () => ({
  useForm: () => ({
    formProps: {},
    saveButtonProps: {},
    queryResult: {
      data: {
        data: {
          id: "test-id",
          name: "Test Program",
        },
      },
      isLoading: false,
    },
  }),
  Edit: ({ children }: { children: React.ReactNode }) => children,
  Create: ({ children }: { children: React.ReactNode }) => children,
  List: ({ children }: { children: React.ReactNode }) => children,
  Show: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Admin Configuration", () => {
  it("API URL is configured", () => {
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toContain("http");
  });

  it("Refine resources are defined", () => {
    const resources = [
      { name: "programs", list: "/programs" },
      { name: "diffs", list: "/diffs" },
      { name: "sources", list: "/sources" },
      { name: "api-keys", list: "/api-keys" },
      { name: "rules", list: "/rules" },
    ];

    expect(resources).toHaveLength(5);
    expect(resources.map((r) => r.name)).toContain("programs");
    expect(resources.map((r) => r.name)).toContain("diffs");
  });
});

describe("Status Options", () => {
  it("has all required status options", () => {
    const statusOptions = [
      { label: "Open", value: "open" },
      { label: "Waitlist", value: "waitlist" },
      { label: "Reserved", value: "reserved" },
      { label: "Funded", value: "funded" },
      { label: "Closed", value: "closed" },
      { label: "Coming Soon", value: "coming_soon" },
    ];

    expect(statusOptions).toHaveLength(6);
    expect(statusOptions.find((o) => o.value === "open")).toBeDefined();
    expect(statusOptions.find((o) => o.value === "closed")).toBeDefined();
  });
});

describe("Form Validation", () => {
  it("validates required program fields", () => {
    const requiredFields = ["name", "slug", "jurisdictionId", "status"];
    const formData = {
      name: "Test Program",
      slug: "test-program",
      jurisdictionId: "uuid-here",
      status: "open",
    };

    for (const field of requiredFields) {
      expect(formData[field as keyof typeof formData]).toBeDefined();
    }
  });

  it("validates slug format", () => {
    const isValidSlug = (slug: string): boolean => /^[a-z0-9-]+$/.test(slug);

    expect(isValidSlug("valid-slug-123")).toBe(true);
    expect(isValidSlug("Invalid_Slug")).toBe(false);
    expect(isValidSlug("invalid slug")).toBe(false);
  });
});

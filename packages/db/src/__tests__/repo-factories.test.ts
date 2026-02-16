import { describe, expect, it, vi } from "vitest";
import { apiKeyRepo } from "../repositories/api-key.repo.js";
import { benefitRepo } from "../repositories/benefit.repo.js";
import { crawlSnapshotRepo } from "../repositories/crawl-snapshot.repo.js";
import { diffRepo } from "../repositories/diff.repo.js";
import { geoMappingRepo } from "../repositories/geo-mapping.repo.js";
import { jurisdictionRepo } from "../repositories/jurisdiction.repo.js";
import { programRepo } from "../repositories/program.repo.js";
import { sourceRepo } from "../repositories/source.repo.js";
import { stackabilityRepo } from "../repositories/stackability.repo.js";
import type { DbClient } from "../repositories/types.js";
import { verificationRepo } from "../repositories/verification.repo.js";

/**
 * Creates a mock DbClient that returns chainable query builders.
 * Each terminal method (limit, returning, etc.) resolves to the provided rows.
 */
function createMockDb(rows: unknown[] = []) {
  const makeChain = (): Promise<unknown[]> & Record<string, unknown> => {
    const proxy = Promise.resolve(rows) as Promise<unknown[]> & Record<string, unknown>;
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "from",
      "where",
      "innerJoin",
      "leftJoin",
      "orderBy",
      "limit",
      "offset",
      "set",
      "values",
      "returning",
      "$dynamic",
    ];
    for (const method of methods) {
      proxy[method] = vi.fn(() => proxy);
    }
    return proxy;
  };

  const chain: Record<string, unknown> = {};

  chain.select = vi.fn(() => makeChain());
  chain.insert = vi.fn(() => makeChain());
  chain.update = vi.fn(() => makeChain());
  chain.delete = vi.fn(() => makeChain());
  chain.transaction = vi.fn();

  return chain as unknown as DbClient;
}

function createMockDbWithSelectBatches(selectBatches: unknown[][]) {
  const makeChain = (rows: unknown[]): Promise<unknown[]> & Record<string, unknown> => {
    const proxy = Promise.resolve(rows) as Promise<unknown[]> & Record<string, unknown>;
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "from",
      "where",
      "innerJoin",
      "leftJoin",
      "orderBy",
      "limit",
      "offset",
      "set",
      "values",
      "returning",
      "$dynamic",
    ];
    for (const method of methods) {
      proxy[method] = vi.fn(() => proxy);
    }
    return proxy;
  };

  let selectIndex = 0;
  const db: Record<string, unknown> = {};
  db.select = vi.fn(() => {
    const rows = selectBatches[selectIndex] ?? [];
    selectIndex += 1;
    return makeChain(rows);
  });
  db.insert = vi.fn(() => makeChain([]));
  db.update = vi.fn(() => makeChain([]));
  db.delete = vi.fn(() => makeChain([]));
  db.transaction = vi.fn();

  return db as unknown as DbClient;
}

describe("jurisdictionRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = jurisdictionRepo(db);
    expect(typeof repo.findAll).toBe("function");
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.findByCountry).toBe("function");
    expect(typeof repo.findByPostalCode).toBe("function");
    expect(typeof repo.create).toBe("function");
  });

  it("findAll returns rows without pagination", async () => {
    const mockRows = [{ id: "1", name: "US Federal" }];
    const db = createMockDb(mockRows);
    const repo = jurisdictionRepo(db);
    const result = await repo.findAll();
    expect(result).toEqual(mockRows);
  });

  it("findAll returns paginated result", async () => {
    const db = createMockDbWithSelectBatches([[{ id: "1", name: "US Federal" }], [{ count: 7 }]]);
    const repo = jurisdictionRepo(db);
    const result = await repo.findAll({ page: 2, limit: 3 });

    expect(result).toEqual({
      data: [{ id: "1", name: "US Federal" }],
      total: 7,
      page: 2,
      limit: 3,
      totalPages: 3,
    });
  });

  it("findById returns first row", async () => {
    const mockRow = { id: "1", name: "US Federal" };
    const db = createMockDb([mockRow]);
    const repo = jurisdictionRepo(db);
    const result = await repo.findById("1");
    expect(result).toEqual(mockRow);
  });

  it("findById returns undefined when no rows", async () => {
    const db = createMockDb([]);
    const repo = jurisdictionRepo(db);
    const result = await repo.findById("missing");
    expect(result).toBeUndefined();
  });

  it("findByCountry returns rows", async () => {
    const mockRows = [{ id: "1", name: "California" }];
    const db = createMockDb(mockRows);
    const repo = jurisdictionRepo(db);
    const result = await repo.findByCountry("US");
    expect(result).toEqual(mockRows);
  });

  it("findByPostalCode returns empty when no mapping found", async () => {
    const db = createMockDb([]);
    const repo = jurisdictionRepo(db);
    const result = await repo.findByPostalCode("00000", "US");
    expect(result).toEqual([]);
  });

  it("findByPostalCode returns jurisdictions when mapping exists", async () => {
    const db = createMockDbWithSelectBatches([
      [{ postalCode: "90210", country: "US", jurisdictionIds: ["j-1", "j-2"] }],
      [
        { id: "j-1", name: "US Federal" },
        { id: "j-2", name: "California" },
      ],
    ]);
    const repo = jurisdictionRepo(db);
    const result = await repo.findByPostalCode("90210", "US");

    expect(result).toEqual([
      { id: "j-1", name: "US Federal" },
      { id: "j-2", name: "California" },
    ]);
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "new-1", name: "Test" };
    const db = createMockDb([newRow]);
    const repo = jurisdictionRepo(db);
    const result = await repo.create({
      name: "Test",
      isoCode: "T",
      country: "US",
      level: "federal",
    });
    expect(result).toEqual(newRow);
  });
});

describe("programRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = programRepo(db);
    expect(typeof repo.findAll).toBe("function");
    expect(typeof repo.findBySlug).toBe("function");
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.findByJurisdiction).toBe("function");
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.update).toBe("function");
    expect(typeof repo.createVersion).toBe("function");
    expect(typeof repo.findVersions).toBe("function");
    expect(typeof repo.findCategoryIds).toBe("function");
  });

  it("findBySlug returns first row", async () => {
    const mockRow = { id: "1", slug: "test-program" };
    const db = createMockDb([mockRow]);
    const repo = programRepo(db);
    const result = await repo.findBySlug("test-program");
    expect(result).toEqual(mockRow);
  });

  it("findBySlug returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = programRepo(db);
    const result = await repo.findBySlug("missing");
    expect(result).toBeUndefined();
  });

  it("findBySlug with country scoping returns program row", async () => {
    const mockRow = { program: { id: "1", slug: "test-program" } };
    const db = createMockDb([mockRow]);
    const repo = programRepo(db);
    const result = await repo.findBySlug("US", "test-program");
    expect(result).toEqual(mockRow.program);
  });

  it("findBySlug with country returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = programRepo(db);
    const result = await repo.findBySlug("UK", "missing");
    expect(result).toBeUndefined();
  });

  it("findBySlug supports backward-compatible argument order", async () => {
    const mockRow = { program: { id: "1", slug: "test-program" } };
    const db = createMockDb([mockRow]);
    const repo = programRepo(db);
    const result = await repo.findBySlug("test-program", "US");
    expect(result).toEqual(mockRow.program);
  });

  it("findAll returns rows when unpaginated", async () => {
    const rows = [
      { program: { id: "1", name: "Program 1" } },
      { program: { id: "2", name: "Program 2" } },
    ];
    const db = createMockDb(rows);
    const repo = programRepo(db);
    const result = await repo.findAll({ country: "US", status: "open" });
    expect(result).toEqual([
      { id: "1", name: "Program 1" },
      { id: "2", name: "Program 2" },
    ]);
  });

  it("findAll returns rows without filters", async () => {
    const rows = [{ program: { id: "1", name: "Program 1" } }];
    const db = createMockDb(rows);
    const repo = programRepo(db);
    const result = await repo.findAll();
    expect(result).toEqual([{ id: "1", name: "Program 1" }]);
  });

  it("findAll returns paginated data with filters", async () => {
    const db = createMockDbWithSelectBatches([
      [{ program: { id: "1", name: "Program 1" } }],
      [{ count: 9 }],
    ]);
    const repo = programRepo(db);
    const result = await repo.findAll({ country: "US", status: "open" }, { page: 1, limit: 5 });

    expect(result).toEqual({
      data: [{ id: "1", name: "Program 1" }],
      total: 9,
      page: 1,
      limit: 5,
      totalPages: 2,
    });
  });

  it("findAll returns paginated data without country filter", async () => {
    const db = createMockDbWithSelectBatches([
      [{ program: { id: "2", name: "Program 2" } }],
      [{ count: 4 }],
    ]);
    const repo = programRepo(db);
    const result = await repo.findAll({ status: "open" }, { page: 2, limit: 2 });

    expect(result).toEqual({
      data: [{ id: "2", name: "Program 2" }],
      total: 4,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it("findById returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = programRepo(db);
    const result = await repo.findById("missing");
    expect(result).toBeUndefined();
  });

  it("findById returns program with benefits and eligibility", async () => {
    const programRows = [{ id: "p-1", name: "Program 1" }];
    const benefitRows = [{ id: "b-1", programId: "p-1" }];
    const ruleRows = [{ id: "r-1", programId: "p-1" }];
    const db = createMockDbWithSelectBatches([programRows, benefitRows, ruleRows]);
    const repo = programRepo(db);
    const result = await repo.findById("p-1");

    expect(result).toEqual({
      id: "p-1",
      name: "Program 1",
      benefits: [{ id: "b-1", programId: "p-1" }],
      eligibilityRules: [{ id: "r-1", programId: "p-1" }],
    });
  });

  it("findByJurisdiction returns rows", async () => {
    const mockRows = [{ id: "1", name: "Program 1" }];
    const db = createMockDb(mockRows);
    const repo = programRepo(db);
    const result = await repo.findByJurisdiction("j-1");
    expect(result).toEqual(mockRows);
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "new-1", name: "New Program" };
    const db = createMockDb([newRow]);
    const repo = programRepo(db);
    const result = await repo.create({
      jurisdictionId: "j-1",
      name: "New Program",
      slug: "new-program",
    });
    expect(result).toEqual(newRow);
  });

  it("createMany returns inserted rows", async () => {
    const inserted = [{ id: "b-1" }, { id: "b-2" }];
    const db = createMockDb(inserted);
    const repo = benefitRepo(db);
    const result = await repo.createMany([
      { programId: "p-1", type: "rebate", currency: "USD" },
      { programId: "p-1", type: "tax_credit", currency: "USD" },
    ]);
    expect(result).toEqual(inserted);
  });

  it("update returns updated row", async () => {
    const updated = { id: "1", name: "Updated" };
    const db = createMockDb([updated]);
    const repo = programRepo(db);
    const result = await repo.update("1", { name: "Updated" });
    expect(result).toEqual(updated);
  });

  it("createVersion returns version row", async () => {
    const version = { id: "v-1", programId: "p-1" };
    const db = createMockDb([version]);
    const repo = programRepo(db);
    const result = await repo.createVersion("p-1", { status: "open" }, ["status"], "admin");
    expect(result).toEqual(version);
  });

  it("findVersions returns rows", async () => {
    const versions = [{ id: "v-1" }, { id: "v-2" }];
    const db = createMockDb(versions);
    const repo = programRepo(db);
    const result = await repo.findVersions("p-1");
    expect(result).toEqual(versions);
  });

  it("findCategoryIds returns mapped ids", async () => {
    const rows = [{ categoryId: "c-1" }, { categoryId: "c-2" }];
    const db = createMockDb(rows);
    const repo = programRepo(db);
    const result = await repo.findCategoryIds("p-1");
    expect(result).toEqual(["c-1", "c-2"]);
  });
});

describe("benefitRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = benefitRepo(db);
    expect(typeof repo.findByProgram).toBe("function");
    expect(typeof repo.findEligibleByLocation).toBe("function");
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.createMany).toBe("function");
  });

  it("findByProgram returns rows", async () => {
    const mockRows = [{ id: "b-1", type: "rebate" }];
    const db = createMockDb(mockRows);
    const repo = benefitRepo(db);
    const result = await repo.findByProgram("p-1");
    expect(result).toEqual(mockRows);
  });

  it("findEligibleByLocation returns empty when no mapping", async () => {
    const db = createMockDb([]);
    const repo = benefitRepo(db);
    const result = await repo.findEligibleByLocation("00000", "US");
    expect(result).toEqual([]);
  });

  it("findEligibleByLocation returns eligible benefits", async () => {
    const db = createMockDbWithSelectBatches([
      [{ postalCode: "90210", country: "US", jurisdictionIds: ["j-1"] }],
      [
        {
          benefit: { id: "b-1", programId: "p-1", type: "rebate" },
          jurisdictionId: "j-1",
          programName: "Program 1",
          programSlug: "program-1",
        },
      ],
    ]);
    const repo = benefitRepo(db);
    const result = await repo.findEligibleByLocation("90210", "US", "cat-1");

    expect(result).toEqual([
      {
        id: "b-1",
        programId: "p-1",
        type: "rebate",
        programName: "Program 1",
        programSlug: "program-1",
      },
    ]);
  });

  it("createMany returns empty array for empty input", async () => {
    const db = createMockDb();
    const repo = benefitRepo(db);
    const result = await repo.createMany([]);
    expect(result).toEqual([]);
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "b-1", type: "rebate" };
    const db = createMockDb([newRow]);
    const repo = benefitRepo(db);
    const result = await repo.create({ programId: "p-1", type: "rebate", currency: "USD" });
    expect(result).toEqual(newRow);
  });
});

describe("sourceRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = sourceRepo(db);
    expect(typeof repo.findAll).toBe("function");
    expect(typeof repo.findActive).toBe("function");
    expect(typeof repo.findDueForCrawl).toBe("function");
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.markCrawled).toBe("function");
    expect(typeof repo.deactivate).toBe("function");
  });

  it("findAll returns rows", async () => {
    const mockRows = [{ id: "s-1", url: "https://example.com" }];
    const db = createMockDb(mockRows);
    const repo = sourceRepo(db);
    const result = await repo.findAll();
    expect(result).toEqual(mockRows);
  });

  it("findActive returns active rows", async () => {
    const mockRows = [{ id: "s-1", isActive: true }];
    const db = createMockDb(mockRows);
    const repo = sourceRepo(db);
    const result = await repo.findActive();
    expect(result).toEqual(mockRows);
  });

  it("findDueForCrawl returns rows", async () => {
    const mockRows = [{ id: "s-1", isActive: true }];
    const db = createMockDb(mockRows);
    const repo = sourceRepo(db);
    const result = await repo.findDueForCrawl();
    expect(result).toEqual(mockRows);
  });

  it("findById returns first row", async () => {
    const mockRow = { id: "s-1" };
    const db = createMockDb([mockRow]);
    const repo = sourceRepo(db);
    const result = await repo.findById("s-1");
    expect(result).toEqual(mockRow);
  });

  it("findById returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = sourceRepo(db);
    const result = await repo.findById("missing");
    expect(result).toBeUndefined();
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "s-1", url: "https://example.com" };
    const db = createMockDb([newRow]);
    const repo = sourceRepo(db);
    const result = await repo.create({ url: "https://example.com", jurisdictionId: "j-1" });
    expect(result).toEqual(newRow);
  });

  it("markCrawled returns updated row", async () => {
    const updated = { id: "s-1", lastCrawlAt: new Date() };
    const db = createMockDb([updated]);
    const repo = sourceRepo(db);
    const result = await repo.markCrawled("s-1", "etag-1", "Mon, 01 Jan 2024");
    expect(result).toEqual(updated);
  });

  it("markCrawled handles missing etag and lastModified", async () => {
    const updated = { id: "s-1", lastCrawlAt: new Date(), etag: null, lastModifiedHeader: null };
    const db = createMockDb([updated]);
    const repo = sourceRepo(db);
    const result = await repo.markCrawled("s-1");
    expect(result).toEqual(updated);
  });

  it("deactivate returns updated row", async () => {
    const updated = { id: "s-1", isActive: false };
    const db = createMockDb([updated]);
    const repo = sourceRepo(db);
    const result = await repo.deactivate("s-1");
    expect(result).toEqual(updated);
  });
});

describe("crawlSnapshotRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = crawlSnapshotRepo(db);
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.findLatestBySource).toBe("function");
    expect(typeof repo.findById).toBe("function");
    expect(typeof repo.findBySource).toBe("function");
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "cs-1" };
    const db = createMockDb([newRow]);
    const repo = crawlSnapshotRepo(db);
    const result = await repo.create({
      sourceId: "s-1",
      rawHtmlPath: "artifacts/s-1/2026-02-16/abc.html",
      contentHash: "sha256-abc123",
    });
    expect(result).toEqual(newRow);
  });

  it("findLatestBySource returns first row", async () => {
    const mockRow = { id: "cs-1" };
    const db = createMockDb([mockRow]);
    const repo = crawlSnapshotRepo(db);
    const result = await repo.findLatestBySource("s-1");
    expect(result).toEqual(mockRow);
  });

  it("findLatestBySource returns undefined when none", async () => {
    const db = createMockDb([]);
    const repo = crawlSnapshotRepo(db);
    const result = await repo.findLatestBySource("missing");
    expect(result).toBeUndefined();
  });

  it("findById returns row or undefined", async () => {
    const db = createMockDb([]);
    const repo = crawlSnapshotRepo(db);
    const result = await repo.findById("missing");
    expect(result).toBeUndefined();
  });

  it("findBySource returns rows", async () => {
    const rows = [{ id: "cs-1" }, { id: "cs-2" }];
    const db = createMockDb(rows);
    const repo = crawlSnapshotRepo(db);
    const result = await repo.findBySource("s-1");
    expect(result).toEqual(rows);
  });
});

describe("diffRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = diffRepo(db);
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.findUnreviewed).toBe("function");
    expect(typeof repo.findBySource).toBe("function");
    expect(typeof repo.markReviewed).toBe("function");
    expect(typeof repo.findById).toBe("function");
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "d-1" };
    const db = createMockDb([newRow]);
    const repo = diffRepo(db);
    const result = await repo.create({
      sourceId: "s-1",
      oldSnapshotId: "cs-1",
      newSnapshotId: "cs-2",
      diffType: "text",
      significanceScore: 75,
    });
    expect(result).toEqual(newRow);
  });

  it("findUnreviewed returns rows", async () => {
    const mockRows = [{ id: "d-1", reviewed: false }];
    const db = createMockDb(mockRows);
    const repo = diffRepo(db);
    const result = await repo.findUnreviewed();
    expect(result).toEqual(mockRows);
  });

  it("findById returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = diffRepo(db);
    const result = await repo.findById("missing");
    expect(result).toBeUndefined();
  });

  it("findBySource returns rows", async () => {
    const rows = [{ id: "d-1", sourceId: "s-1" }];
    const db = createMockDb(rows);
    const repo = diffRepo(db);
    const result = await repo.findBySource("s-1");
    expect(result).toEqual(rows);
  });

  it("markReviewed returns updated row", async () => {
    const updated = { id: "d-1", reviewed: true };
    const db = createMockDb([updated]);
    const repo = diffRepo(db);
    const result = await repo.markReviewed("d-1", "admin@test.com");
    expect(result).toEqual(updated);
  });
});

describe("verificationRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = verificationRepo(db);
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.findLatestByProgram).toBe("function");
    expect(typeof repo.findByProgram).toBe("function");
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "v-1" };
    const db = createMockDb([newRow]);
    const repo = verificationRepo(db);
    const result = await repo.create({
      programId: "p-1",
      verifiedBy: "system",
      verificationMethod: "auto_crawl",
    });
    expect(result).toEqual(newRow);
  });

  it("findLatestByProgram returns first row", async () => {
    const mockRow = { id: "v-1" };
    const db = createMockDb([mockRow]);
    const repo = verificationRepo(db);
    const result = await repo.findLatestByProgram("p-1");
    expect(result).toEqual(mockRow);
  });

  it("findLatestByProgram returns undefined when none", async () => {
    const db = createMockDb([]);
    const repo = verificationRepo(db);
    const result = await repo.findLatestByProgram("missing");
    expect(result).toBeUndefined();
  });

  it("findByProgram returns rows", async () => {
    const mockRows = [{ id: "v-1" }, { id: "v-2" }];
    const db = createMockDb(mockRows);
    const repo = verificationRepo(db);
    const result = await repo.findByProgram("p-1");
    expect(result).toEqual(mockRows);
  });
});

describe("geoMappingRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = geoMappingRepo(db);
    expect(typeof repo.findByPostalCode).toBe("function");
    expect(typeof repo.bulkCreate).toBe("function");
    expect(typeof repo.findByStateProvince).toBe("function");
  });

  it("findByPostalCode returns first row", async () => {
    const mockRow = { postalCode: "90210", country: "US" };
    const db = createMockDb([mockRow]);
    const repo = geoMappingRepo(db);
    const result = await repo.findByPostalCode("90210", "US");
    expect(result).toEqual(mockRow);
  });

  it("findByPostalCode returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = geoMappingRepo(db);
    const result = await repo.findByPostalCode("00000", "US");
    expect(result).toBeUndefined();
  });

  it("bulkCreate returns empty for empty input", async () => {
    const db = createMockDb();
    const repo = geoMappingRepo(db);
    const result = await repo.bulkCreate([]);
    expect(result).toEqual([]);
  });

  it("bulkCreate returns inserted rows", async () => {
    const rows = [{ postalCode: "90210" }, { postalCode: "94102" }];
    const db = createMockDb(rows);
    const repo = geoMappingRepo(db);
    const result = await repo.bulkCreate([
      { postalCode: "90210", country: "US", jurisdictionIds: ["j-1"] },
      { postalCode: "94102", country: "US", jurisdictionIds: ["j-1", "j-2"] },
    ]);
    expect(result).toEqual(rows);
  });

  it("findByStateProvince returns rows", async () => {
    const mockRows = [{ postalCode: "90210" }, { postalCode: "94102" }];
    const db = createMockDb(mockRows);
    const repo = geoMappingRepo(db);
    const result = await repo.findByStateProvince("CA", "US");
    expect(result).toEqual(mockRows);
  });
});

describe("stackabilityRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = stackabilityRepo(db);
    expect(typeof repo.findByProgram).toBe("function");
    expect(typeof repo.findByJurisdiction).toBe("function");
    expect(typeof repo.create).toBe("function");
  });

  it("findByProgram returns rows", async () => {
    const mockRows = [{ id: "sc-1", programAId: "p-1", programBId: "p-2" }];
    const db = createMockDb(mockRows);
    const repo = stackabilityRepo(db);
    const result = await repo.findByProgram("p-1");
    expect(result).toEqual(mockRows);
  });

  it("findByJurisdiction returns empty when no programs", async () => {
    const db = createMockDb([]);
    const repo = stackabilityRepo(db);
    const result = await repo.findByJurisdiction("j-1");
    expect(result).toEqual([]);
  });

  it("findByJurisdiction returns constraints for jurisdiction programs", async () => {
    const db = createMockDbWithSelectBatches([
      [{ id: "p-1" }, { id: "p-2" }],
      [
        { id: "sc-1", programAId: "p-1", programBId: "x-1" },
        { id: "sc-2", programAId: "x-2", programBId: "x-3" },
        { id: "sc-3", programAId: "x-4", programBId: "p-2" },
      ],
    ]);
    const repo = stackabilityRepo(db);
    const result = await repo.findByJurisdiction("j-1");

    expect(result).toEqual([
      { id: "sc-1", programAId: "p-1", programBId: "x-1" },
      { id: "sc-3", programAId: "x-4", programBId: "p-2" },
    ]);
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "sc-1" };
    const db = createMockDb([newRow]);
    const repo = stackabilityRepo(db);
    const result = await repo.create({
      programAId: "p-1",
      programBId: "p-2",
      constraintType: "cannot_combine",
    });
    expect(result).toEqual(newRow);
  });
});

describe("apiKeyRepo", () => {
  it("returns expected method interface", () => {
    const db = createMockDb();
    const repo = apiKeyRepo(db);
    expect(typeof repo.findByHash).toBe("function");
    expect(typeof repo.create).toBe("function");
    expect(typeof repo.deactivate).toBe("function");
    expect(typeof repo.touchLastUsed).toBe("function");
  });

  it("findByHash returns first row", async () => {
    const mockRow = { id: "ak-1", keyHash: "abc123" };
    const db = createMockDb([mockRow]);
    const repo = apiKeyRepo(db);
    const result = await repo.findByHash("abc123");
    expect(result).toEqual(mockRow);
  });

  it("findByHash returns undefined when not found", async () => {
    const db = createMockDb([]);
    const repo = apiKeyRepo(db);
    const result = await repo.findByHash("missing");
    expect(result).toBeUndefined();
  });

  it("create returns inserted row", async () => {
    const newRow = { id: "ak-1" };
    const db = createMockDb([newRow]);
    const repo = apiKeyRepo(db);
    const result = await repo.create({
      customerName: "Test Key",
      keyHash: "hash",
      keyPrefix: "vh_",
    });
    expect(result).toEqual(newRow);
  });

  it("deactivate returns updated row", async () => {
    const updated = { id: "ak-1", isActive: false };
    const db = createMockDb([updated]);
    const repo = apiKeyRepo(db);
    const result = await repo.deactivate("ak-1");
    expect(result).toEqual(updated);
  });

  it("touchLastUsed does not throw", async () => {
    const db = createMockDb([]);
    const repo = apiKeyRepo(db);
    await expect(repo.touchLastUsed("ak-1")).resolves.toBeUndefined();
  });
});

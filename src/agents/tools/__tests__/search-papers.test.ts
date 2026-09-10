import { describe, it } from "node:test";
import assert from "node:assert";
import { searchPapersTool } from "../search-papers";

describe("searchPapers", () => {
  it("returns papers for valid query", async () => {
    const result = await searchPapersTool.execute(
      { query: "transformer attention mechanisms", maxResults: 3 },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.papers));
    assert.ok(result.papers.length > 0);
    assert.ok(result.papers.length <= 3);
  });

  it("returns paper with required fields", async () => {
    const result = await searchPapersTool.execute(
      { query: "machine learning", maxResults: 2 },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.papers.length > 0);

    const paper = result.papers[0];
    assert.ok(paper.title);
    assert.ok(paper.year);
    assert.ok(typeof paper.citations === "number" || paper.citations === undefined);
    assert.ok(paper.authors);
    assert.strictEqual(typeof paper.title, "string");
    assert.strictEqual(typeof paper.year, "number");
  });

  it("respects maxResults limit", async () => {
    const result = await searchPapersTool.execute(
      { query: "neural networks", maxResults: 2 },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.papers.length <= 2);
  });

  it("returns totalResults count", async () => {
    const result = await searchPapersTool.execute(
      { query: "AI", maxResults: 1 },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(typeof result.totalResults, "number");
    assert.ok(result.totalResults > 0);
  });
});

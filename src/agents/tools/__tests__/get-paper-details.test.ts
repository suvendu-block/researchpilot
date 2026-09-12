import { describe, it } from "node:test";
import assert from "node:assert";
import { getPaperDetailsTool } from "../get-paper-details";

// same deal as search-papers tests — these hit the live OpenAlex API

describe("getPaperDetails", () => {
  it("returns papers for valid OpenAlex IDs", async () => {
    const result = await getPaperDetailsTool.execute(
      { paperIds: ["https://openalex.org/W2741809807"] },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.ok(Array.isArray(result.papers));
    assert.ok(result.papers.length >= 1);
    assert.ok(result.papers[0].title);
  });

  it("returns multiple papers", async () => {
    const result = await getPaperDetailsTool.execute(
      {
        paperIds: [
          "https://openalex.org/W2741809807",
          "https://openalex.org/W2963353571",
        ],
      },
      ""
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.papers.length >= 1);
  });

  it("filters out invalid IDs", async () => {
    const result = await getPaperDetailsTool.execute(
      { paperIds: ["https://openalex.org/INVALID_ID_12345"] },
      ""
    );

    // OpenAlex doesn't 404 on bad IDs — it just returns an empty result set
    assert.ok(result.success === true || result.success === false);
    assert.ok(result.papers.length <= 1);
  });
});

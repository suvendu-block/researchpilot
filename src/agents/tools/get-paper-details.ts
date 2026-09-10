import { tool } from "ai";
import { z } from "zod";

export const getPaperDetailsTool = tool({
  description:
    "Get full details for specific papers by their OpenAlex IDs. Use this to get complete abstracts and metadata for the most relevant papers.",
  parameters: z.object({
    paperIds: z
      .array(z.string())
      .min(1)
      .max(10)
      .describe("Array of OpenAlex paper IDs to look up"),
  }),
  execute: async ({ paperIds }) => {
    const filter = paperIds.join("|");
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("filter", `openalex:${filter}`);
    url.searchParams.set(
      "select",
      "id,title,authorships,publication_year,cited_by_count,doi,primary_location,abstract_inverted_index"
    );

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ResearchPilot/1.0 (mailto:research@pilot.dev)",
      },
    });

    if (!res.ok) {
      return { success: false, papers: [] };
    }

    const data = await res.json();

    const papers = (data.results ?? []).map((paper: any) => {
      let abstract = "";
      if (paper.abstract_inverted_index) {
        const index = paper.abstract_inverted_index;
        const words: { pos: number; word: string }[] = [];
        for (const [word, positions] of Object.entries(index)) {
          for (const pos of positions as number[]) {
            words.push({ pos, word });
          }
        }
        abstract = words
          .sort((a, b) => a.pos - b.pos)
          .map((w) => w.word)
          .join(" ");
      }

      const authors = (paper.authorships ?? [])
        .map((a: any) => a.author?.display_name)
        .filter(Boolean);

      const venue =
        paper.primary_location?.source?.display_name ?? undefined;

      return {
        id: paper.id,
        title: paper.title,
        authors,
        abstract,
        year: paper.publication_year,
        citationCount: paper.cited_by_count,
        url: paper.doi
          ? `https://doi.org/${paper.doi}`
          : paper.id,
        venue,
        doi: paper.doi ?? undefined,
      };
    });

    return {
      success: true,
      papers,
    };
  },
});

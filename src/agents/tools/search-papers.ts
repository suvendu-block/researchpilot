import { tool } from "ai";
import { z } from "zod";

export const searchPapersTool = tool({
  description:
    "Search for academic papers by topic. Returns paper titles, authors, abstracts, year, and citation count.",
  parameters: z.object({
    query: z.string().describe("Search query or keywords"),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of papers to return"),
  }),
  execute: async ({ query, maxResults }) => {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", query);
    url.searchParams.set("per_page", String(maxResults));
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
      throw new Error(`OpenAlex API error: ${res.status}`);
    }

    const data = await res.json();

    const papers = (data.results ?? []).map((paper: any) => {
      // Reconstruct abstract from inverted index
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
      totalResults: data.meta?.count ?? 0,
    };
  },
});

import { atomParser } from "../lib/parse/atom-parser.js";
import type { JsonFeed } from "../lib/parse/parse-xml-feed";
import { parseXmlFeed } from "../lib/parse/parse-xml-feed.js";
import { rssParser } from "../lib/parse/rss-parser.js";
import { expect } from "../test-helper/assertion.js";
import { loadXmlFixture } from "../test-helper/load-fixture.js";
import { describe } from "../test-helper/scheduler.js";

describe("Parse feed", ({ spec, beforeEach, afterEach }) => {
  spec("Rejects non feed xml", async () => {
    await expect(async () => await parseXmlFixture("non-feed.xml")).toThrow();
  });

  spec("No error thrown on basic setup", async () => {
    await runMatrix(["empty-atom.xml", "empty-rss.xml", "empty-rdf.xml"], async (filename) => {
      await parseXmlFixture(filename);
    });
  });

  spec("JSON feed version", async () => {
    await runMatrix(["empty-atom.xml", "empty-rss.xml", "empty-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.version).toEqual("https://jsonfeed.org/version/1.1");
    });
  });

  spec("Parse channel title", async () => {
    await runMatrix(["empty-atom.xml", "empty-rss.xml", "empty-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.title).toEqual("Mock channel title");
    });
  });

  spec("Parse home page url", async () => {
    await runMatrix(["empty-atom.xml", "empty-rss.xml", "empty-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.home_page_url).toEqual("http://mock-domain.com");
    });
  });

  spec("Parse empty items", async () => {
    await runMatrix(["empty-atom.xml", "empty-rss.xml", "empty-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.items.length).toEqual(0);
    });
  });

  spec("Parse single item", async () => {
    await runMatrix(["single-item-atom.xml", "single-item-rss.xml", "single-item-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.items.length).toEqual(1);
    });
  });

  spec("Parse multiple items", async () => {
    await runMatrix(["multi-item-atom.xml", "multi-item-rss.xml", "multi-item-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.items.length > 1).toEqual(true);
    });
  });

  spec("Parse item title", async () => {
    await runMatrix(["single-item-atom.xml", "single-item-rss.xml", "single-item-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.items[0].title).toEqual("Mock item title 1");
    });
  });

  spec("Parse item url", async () => {
    await runMatrix(["single-item-atom.xml", "single-item-rss.xml", "single-item-rdf.xml"], async (filename) => {
      const jsonFeed = await parseXmlFixture(filename);
      await expect(jsonFeed.items[0].url).toEqual("http://mock-domain.com/item/1");
    });
  });

  spec("Parse item summary of plaintext", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[0].content_text).toEqual("Plaintext description");
        await expect(jsonFeed.items[0].content_html).toEqual("Plaintext description");
      }
    );
  });

  spec("Parse item summary of escaped HTML entities", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[1].content_text).toEqual("I'm bold");
        await expect(jsonFeed.items[1].content_html).toEqual("I'm <b>bold</b>");
      }
    );
  });

  spec("Parse item summary of CDATA", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[2].content_text).toEqual("I'm bold");
        await expect(jsonFeed.items[2].content_html).toEqual("I'm <b>bold</b>");
      }
    );
  });

  spec("Parse item summary of double escaped HTML entities", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[3].content_text).toEqual("I'm <b>bold</b>");
        await expect(jsonFeed.items[3].content_html).toEqual("I'm &lt;b&gt;bold&lt;/b&gt;");
      }
    );
  });

  spec("Parse item summary of CDATA containing escaped HTML entities", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[4].content_text).toEqual("I'm <b>bold</b>");
        await expect(jsonFeed.items[4].content_html).toEqual("I'm &lt;b&gt;bold&lt;/b&gt;");
      }
    );
  });

  spec("Parse item summary of HTML", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[5].content_text).toEqual("I'm bold");
        await expect(jsonFeed.items[5].content_html).toEqual("I'm <b>bold</b>");
      }
    );
  });

  spec("Parse item summary of printable entities", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[6].content_text).toEqual("AT&T");
        await expect(jsonFeed.items[6].content_html).toEqual("AT&T"); // We shouldn't escape the &
      }
    );
  });

  spec("Parse item summary with plaintext surrounded by whitespace", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[7].content_text).toEqual("Plaintext description");
        await expect(jsonFeed.items[7].content_html).toEqual("Plaintext description");
      }
    );
  });

  spec("Parse item summary with HTML surrounded by whitespace", async () => {
    await runMatrix(
      ["field-decoding-atom.xml", "field-decoding-rss.xml", "field-decoding-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[8].content_text).toEqual("I'm bold");
        await expect(jsonFeed.items[8].content_html).toEqual("I'm <b>bold</b>");
      }
    );
  });

  spec("Parse item with description but no content:encoded/RSS 2.0", async () => {
    await runMatrix(
      ["field-priority-atom.xml", "field-priority-rss.xml", "field-priority-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[0].summary).toEqual("I'm description");
        await expect(jsonFeed.items[0].content_html).toEqual("I'm <b>description</b>");
        await expect(jsonFeed.items[0].content_text).toEqual("I'm description");
      }
    );
  });

  spec("Parse item with description and content:encoded/RSS 2.0", async () => {
    await runMatrix(
      ["field-priority-atom.xml", "field-priority-rss.xml", "field-priority-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[1].summary).toEqual("I'm description");
        await expect(jsonFeed.items[1].content_html).toEqual("I'm <b>encoded content</b>");
        await expect(jsonFeed.items[1].content_text).toEqual("I'm encoded content");
      }
    );
  });

  spec("Parse item with no description but with content:encoded/RSS 2.0", async () => {
    await runMatrix(
      ["field-priority-atom.xml", "field-priority-rss.xml", "field-priority-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[2].summary).toEqual("I'm encoded content");
        await expect(jsonFeed.items[2].content_html).toEqual("I'm <b>encoded content</b>");
        await expect(jsonFeed.items[2].content_text).toEqual("I'm encoded content");
      }
    );
  });

  spec("Parse item with neither description nor content:encoded/RSS 2.0", async () => {
    await runMatrix(
      ["field-priority-atom.xml", "field-priority-rss.xml", "field-priority-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[3].summary).toEqual("");
        await expect(jsonFeed.items[3].content_html).toEqual("");
        await expect(jsonFeed.items[3].content_text).toEqual("");
      }
    );
  });

  spec("Parse item with CDATA description but no content:encoded/RSS 2.0", async () => {
    await runMatrix(
      ["field-priority-atom.xml", "field-priority-rss.xml", "field-priority-rdf.xml"],
      async (filename) => {
        const jsonFeed = await parseXmlFixture(filename);
        await expect(jsonFeed.items[4].summary).toEqual("I'm description");
        await expect(jsonFeed.items[4].content_html).toEqual("I'm <b>description</b>");
        await expect(jsonFeed.items[4].content_text).toEqual("I'm description");
      }
    );
  });
});

async function parseXmlFixture(fixtureFilename: string): Promise<JsonFeed> {
  const feedContent = await loadXmlFixture(fixtureFilename);
  return parseXmlFeed({
    rawString: feedContent,
    xmlParsers: [rssParser, atomParser],
  });
}

async function runMatrix(filenames: string[], assertion: (filename: string) => Promise<void>) {
  for (let filename of filenames) {
    try {
      await assertion(filename);
    } catch (error) {
      if (error instanceof Error) {
        error.message += `\nError occured in ${filename}`;
      }
      throw error;
    }
  }
}

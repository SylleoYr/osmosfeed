import cheerio, { Cheerio, CheerioAPI, Node, Element } from "cheerio";
import { ElementType } from "htmlparser2";

export interface JsonFeed {
  version: string;
  title: string;
  home_page_url?: string;
  feed_url?: string;
  items: JsonFeedItem[];
}

export interface JsonFeedItem {
  id: string;
  url?: string;
  title?: string;
  content_html?: string;
  content_text?: string;
  summary?: string;
}

export abstract class AbstractJsonFeedConverter {
  constructor(protected $: CheerioAPI) {}

  convert(): JsonFeed {
    return {
      ...this.generateMeta(this.$),
      ...this.transformChannel(this.$),
      items: this.transformItems(this.$),
    };
  }

  abstract getItems(): Cheerio<Node>;

  abstract generateMeta($: CheerioAPI): Record<string, any>;
  abstract transformChannel($: CheerioAPI): any;
  abstract transformItems($: CheerioAPI): any;
}

export class RssToJsonFeedConverter extends AbstractJsonFeedConverter {
  getItems() {
    return this.$("item");
  }

  generateMeta() {
    return {
      version: "https://jsonfeed.org/version/1.1",
    };
  }

  transformChannel($: CheerioAPI) {
    return {
      title: decodeField($("rss channel title")).text, // TODO title should be strictly plaintext
      home_page_url: $("rss channel link").text(),
      feed_url: "", // TODO fill with user provided feed url
    };
  }

  // TODO refactor after we have 3 feed types
  transformItems($: CheerioAPI) {
    return $("rss item").map((i, element) => {
      const { html: descriptionHtml, text: descriptionText } = decodeField($("description", element));
      const { html: encodedContentHtml, text: encodedContentText } = decodeField($("content\\:encoded", element));

      return {
        title: $("title", element).text(), // TODO support html
        url: $("link", element).text(),
        summary: firstContentfulString(descriptionText, encodedContentText),
        content_text: firstContentfulString(encodedContentText, descriptionText),
        content_html: firstContentfulString(encodedContentHtml, descriptionHtml),
      };
    });
  }
}

function firstContentfulString(...strings: string[]) {
  return strings.find((s) => s) ?? "";
}

function $hasCdata($: Cheerio<Element>) {
  return $.toArray().some(elementHasCdata);
}

function elementHasCdata(element: Element) {
  return element.children.some((c) => c.type === ElementType.CDATA);
}

// TODO expose as utility API
function decodeField($: Cheerio<Element>): { html: string; text: string } {
  const html = $hasCdata($) ? $.text() : $.html() ?? "";
  const text = cheerio.load(html).text();

  return { html, text };
}

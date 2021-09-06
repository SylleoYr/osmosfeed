import { coerceError } from "./coerce-error";
import { decode, decodeAtomElement, getNonEmptyString } from "./decode";
import type { XmlResolver } from "./parse-xml-feed";

export const atomItemResolver: XmlResolver = (_upstreamValue, item$) => {
  const description = decodeAtomElement(item$("summary"));
  const content = decodeAtomElement(item$("content"));

  const datePublished = item$(`published`).text();
  const dateUpdated = item$(`updated`).text();

  return {
    id: "",
    title: decode(item$("title")).text(),
    url: item$("link").attr("href"),
    summary: getNonEmptyString(description.text, content.text),
    content_text: getNonEmptyString(content.text, description.text),
    content_html: getNonEmptyString(content.html, description.html),
    image: item$(`link[rel="enclosure"][type^="image"]`).attr("href"),
    date_published: datePublished ? coerceError(() => new Date(datePublished).toISOString(), undefined) : undefined,
    date_modified: dateUpdated ? coerceError(() => new Date(dateUpdated).toISOString(), undefined) : undefined,
  };
};

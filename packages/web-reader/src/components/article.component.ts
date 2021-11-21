import { JsonFeedItem } from "@osmoscraft/osmosfeed-core";
import { sanitizeHtml } from "../utils/sanitize";
import { ChannelModel } from "./channel.component";

export interface ItemModel {
  data: JsonFeedItem;
  parent: ChannelModel;
}
export function Article(model: ItemModel) {
  const sensibleTimestamp = model.data.date_modified ?? model.data.date_published;

  return `
<osmos-article>
  <article class="article js-horizontal-scroll__item">
    ${model.data.image ? `<img class="article__image" src="${model.data.image}">` : ""}
    <a class="u-reset" href="#" data-read-url="${model.data.url}">
      <h2 class="article__title">${sanitizeHtml(model.data.title)}</h2>
    </a>
    ${sensibleTimestamp ? `<time class="js-datetime" datetime="${sensibleTimestamp}">${sensibleTimestamp}</time>` : ""}
    <a class="u-reset" href="#" data-read-url="${model.data.url}">
      <p class="article__summary">${sanitizeHtml(model.data.summary)}</p>
    </a>
    <a class="u-reset" href="${model.data.url}">Open original</a>
  </article>
</osmos-article>
  `.trim();
}

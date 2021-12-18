import { JsonFeed } from "@osmosfeed/types";
import { Channel } from "./channel.component";

export interface AppModel {
  data: JsonFeed[];
  embeddedScripts: EmbeddedTextFile[];
  embeddedStylesheets: EmbeddedTextFile[];
  embeddedFavicon?: EmbeddedMediaFile; // TODO implement
}

export interface EmbeddedTextFile {
  content: string;
}

export interface EmbeddedMediaFile {
  content: Buffer;
  mime: string;
}

export function App(model: AppModel) {
  return `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>osmos::feed</title>
    ${model.embeddedStylesheets.map((resource) => `<style>${resource.content}</style>`).join("\n")}
    ${
      model.embeddedFavicon
        ? `<link rel="icon" type="${model.embeddedFavicon.mime}" href="data:${
            model.embeddedFavicon.mime
          };base64,${model.embeddedFavicon.content.toString("base64")}">`
        : ""
    }
	</head>
	<body>
    <osmos-app>
      <div class="c-feed-list">
      ${model.data.map((channel) => Channel({ parent: model, data: channel })).join("\n")}
      </div>
    </osmos-app>
    ${model.embeddedScripts.map((resource) => `<script type="module">${resource.content}</script>`).join("\n")}
	</body>
</html>
`.trim();
}

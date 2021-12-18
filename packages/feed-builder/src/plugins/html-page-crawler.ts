import { Plugin } from "../types";
import { mimeMap } from "./lib/mime-map";
import { sha256 } from "./lib/sha256";

export function useHtmlPageCrawler(): Plugin {
  const filesToKeep: string[] = [];

  return {
    packageName: "@osmosfeed/html-page-crawler",
    transformItem: async ({ data, api }) => {
      const { url } = data.item;

      if (!url) {
        return data.item;
      }
      const filename = `${sha256(url)}.html`;

      const cachedContent = await api.storage.readPluginDataFile(filename);
      if (cachedContent) {
        api.log.trace(`Skip crawl cached page ${url}`);
        filesToKeep.push(filename);
        return {
          ...data.item,
          _plugin: {
            ...data.item._plugin,
            pageFilename: filename,
          },
        };
      }

      api.log.info(`Crawl ${url}`);
      const res = await api.network.get(url);

      if (!res.contentType?.includes(mimeMap[".html"])) {
        return data.item;
      }

      // Assuming http client cannot handle cache.
      if (res.statusCode !== 200) {
        return data.item;
      }

      const content = res.buffer;
      await api.storage.writePluginDataFile(filename, content);
      api.log.info(`Save crawled page ${url}`);
      filesToKeep.push(filename);

      return {
        ...data.item,
        _plugin: {
          ...data.item._plugin,
          pageFilename: filename,
        },
      };
    },
    buildEnd: async ({ data, api }) => {
      await api.storage.prunePluginDataFiles({
        keep: filesToKeep,
      });

      return data;
    },
  };
}

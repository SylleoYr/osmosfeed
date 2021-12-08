import { JsonFeed, JsonFeedItem } from "@osmoscraft/osmosfeed-types";

export interface Plugins {
  onFeeds?: FeedsPlugin[];
  onFeed?: FeedPlugin[];
  onItem?: ItemPlugin[];
}

// TODO onFeeds rename to onSources
// separate plugin temporary data from jsonFeed output data

export type PartialJsonFeed = Partial<JsonFeed<PartialJsonFeedItem>>;
export type PartialJsonFeedItem = Partial<JsonFeedItem>;

export type FeedsPlugin = (input: { feeds: PartialJsonFeed[] }) => Promise<PartialJsonFeed[]>;
export type FeedPlugin = (input: { feed: PartialJsonFeed; feeds: PartialJsonFeed[] }) => Promise<PartialJsonFeed>;
export type ItemPlugin = (input: {
  item: PartialJsonFeedItem;
  feed: PartialJsonFeed;
  feeds: PartialJsonFeed[];
}) => Promise<PartialJsonFeedItem>;

// Implement unit test util plugins to help output other plugins
// Implement runtime that invokes plugins
const plugins: Plugins = {
  onFeeds: [inlineSourcesPlugin({ urls: ["https://www.example.com"] })],
  onFeed: [feedDownloadPlugin(), feedParserPlugin()],
  onItem: [],
};

export function feedParserPlugin(): FeedPlugin {
  const plugin: FeedPlugin = async (input) => {
    const { feed } = input;

    const html = feed._feed_download_plugin?.raw;
    if (!html) return feed;

    const parsedFeed: PartialJsonFeed = {
      ...feed,
      title: "hello",
      items: [],
    };

    return parsedFeed;
  };

  return plugin;
}

export function feedDownloadPlugin(): FeedPlugin {
  const plugin: FeedPlugin = async (input) => {
    const { feed } = input;
    const url = feed.feed_url;
    if (!url) return feed;

    const downloadedFeed: PartialJsonFeed = {
      ...feed,
      _feed_download_plugin: {
        raw: "hello world",
      },
    };

    return downloadedFeed;
  };

  return plugin;
}

export interface InlineSourcesPluginConfig {
  urls: string[];
}
export function inlineSourcesPlugin(config: InlineSourcesPluginConfig): FeedsPlugin {
  const jsonFeeds: PartialJsonFeed[] = config.urls.map((url) => ({ feed_url: url }));

  const plugin: FeedsPlugin = async () => {
    return jsonFeeds;
  };

  return plugin;
}

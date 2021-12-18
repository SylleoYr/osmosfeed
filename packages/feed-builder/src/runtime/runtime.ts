import { JsonFeed, ProjectOutput } from "@osmosfeed/types";
import {
  BuildEndHookApi,
  BuildEndHookData,
  ConfigHookData,
  FeedHookApi,
  FeedHookData,
  ItemHookApi,
  ItemHookData,
  PartialJsonFeed,
  PartialProjectConfig,
  Plugin,
} from "../types/plugin";
import { LogApi } from "./api/log";
import { NetworkApi } from "./api/network";
import { StorageApi } from "./api/storage";
import { FeedFormatError, ProjectConfigError } from "./lib/error-types";
import { reduceAsync } from "./lib/reduce-async";
import { isFeed, isProjectConfig, isValidFeed } from "./lib/type-guards";

export interface FeedBuilderInput {
  plugins?: Plugin[];
}

export interface FeedBuilderOutput {
  feeds?: JsonFeed[];
  errors?: any[];
}

export async function build(input: FeedBuilderInput): Promise<FeedBuilderOutput> {
  const { plugins = [] } = input;

  const configPlugins = plugins.filter((plugin) => plugin.config);
  const transformFeedPlugins = plugins.filter((plugin) => plugin.transformFeed);
  const transformItemPlugins = plugins.filter((plugin) => plugin.transformItem);
  const buildEndPlugins = plugins.filter((plugin) => plugin.buildEnd);

  const projectConfig = await reduceAsync(
    configPlugins,
    (config, plugin) => {
      const data: ConfigHookData = {
        config,
      };
      return plugin.config!({ data });
    },
    {} as PartialProjectConfig
  );

  if (!isProjectConfig(projectConfig)) {
    return {
      errors: [new ProjectConfigError()],
    };
  }

  const feedsErrors: any[] = [];
  const feeds = await Promise.all(
    (projectConfig.sources ?? []).map(async (sourceConfig) => {
      try {
        const feedBase = await reduceAsync(
          transformFeedPlugins,
          (feed, plugin) => {
            const data: FeedHookData = {
              pluginId: plugin.id,
              feed,
              sourceConfig,
              projectConfig,
            };

            const api: FeedHookApi = {
              storage: new StorageApi({ pluginId: plugin.id }),
              network: new NetworkApi(),
              log: new LogApi(),
            };

            return plugin.transformFeed!({ data, api });
          },
          {} as PartialJsonFeed
        );

        // TODO add feed url to the error details
        if (!isFeed(feedBase)) throw new FeedFormatError();

        // TODO skip item without URL?

        const itemsBase = feedBase.items ?? [];
        const itemsEnriched = await Promise.all(
          itemsBase.map(async (itemDry) => {
            const itemEnriched = await reduceAsync(
              transformItemPlugins,
              (item, plugin) => {
                const data: ItemHookData = {
                  pluginId: plugin.id,
                  item,
                  feed: feedBase,
                  sourceConfig,
                  projectConfig,
                };
                const api: ItemHookApi = {
                  storage: new StorageApi({ pluginId: plugin.id }),
                  network: new NetworkApi(),
                  log: new LogApi(),
                };

                return plugin.transformItem!({ data, api });
              },
              itemDry
            );

            // TODO item level try...catch

            return itemEnriched;
          })
        );

        return { ...feedBase, items: itemsEnriched };
      } catch (error) {
        feedsErrors.push(error);
        return null;
      }
    })
  );

  const validFeeds = feeds.filter(isValidFeed);

  const finalizedOutput = await reduceAsync(
    buildEndPlugins,
    (buildOutput, plugin) => {
      const data: BuildEndHookData = {
        pluginId: plugin.id,
        feeds: buildOutput.feeds,
        projectConfig,
      };
      const api: BuildEndHookApi = {
        storage: new StorageApi({ pluginId: plugin.id }),
        log: new LogApi(),
      };
      return plugin.buildEnd!({ data, api });
    },
    {
      feeds: validFeeds,
    } as ProjectOutput
  );

  // TODO remove any plugin folders that were not in use

  return {
    feeds: finalizedOutput.feeds,
    ...(feedsErrors.length ? { errors: feedsErrors } : {}),
  };
}

import { BuildEndHookData, BuildEndHookInput, ItemHookData, ItemHookInput, Plugin } from "../../types";

export function runItemTransformHook(plugin: Plugin, input: ItemHookInput) {
  return plugin.transformItem!(input);
}

export function runBuildEndHook(plugin: Plugin, input: BuildEndHookInput) {
  return plugin.buildEnd!(input);
}

export interface SingleItemMockInput {
  url?: string;
  id: string;
  _plugin?: any;
}
export function mockDataForSingleItem(input: SingleItemMockInput): ItemHookData {
  return {
    pluginId: "",
    item: {
      id: input.id,
      url: input.url,
      _plugin: input._plugin,
    },
    feed: {
      version: "",
      title: "",
      items: [
        {
          id: input.id,
          url: input.url,
        },
      ],
    },
    sourceConfig: {
      url: "https://mock-domain/feed.xml",
    },
    projectConfig: {
      sources: [
        {
          url: "https://mock-domain/feed.xml",
        },
      ],
    },
  };
}

export function mockDataForSingleItemBuildEnd(input: SingleItemMockInput): BuildEndHookData {
  const mockData = mockDataForSingleItem(input);
  return {
    pluginId: "",
    feeds: [mockData.feed],
    projectConfig: mockData.projectConfig,
  };
}

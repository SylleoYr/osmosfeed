import { ProjectConfig } from "@osmoscraft/osmosfeed-types";
import { Plugin } from "../types/plugins";

export function useInlineConfig(config: ProjectConfig): Plugin {
  return {
    id: "0e7216f9-8179-4f52-b162-120a2dc6e6ef",
    onConfig: async () => config,
  };
}

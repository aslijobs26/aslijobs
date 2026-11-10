import type { PipelineStage } from "mongoose";
import { ApplicationModel } from "../../applications/application.model.js";
import {
  APPLICATION_ACTIVITY_CATEGORIES,
  buildApplicationEventCountPipeline,
  buildApplicationEventPagePipeline,
  buildTimestampedActivityCountPipeline,
  buildTimestampedActivityPipeline,
  type ActivityEntryBase,
  type ActivitySource,
  type ApplicationActivityCategory,
  type ApplicationActivityRow,
  type TimestampedActivitySourceConfig,
} from "./activity-timeline.js";

export type RunActivityPipeline = (pipeline: PipelineStage[]) => Promise<unknown[]>;

/** The builders return plain stage objects; Mongoose's stage union is narrower. */
export function asPipeline(stages: Record<string, unknown>[]): PipelineStage[] {
  return stages as unknown as PipelineStage[];
}

export function readActivityCount(rows: unknown[]): number {
  const value = (rows[0] as { count?: unknown } | undefined)?.count;
  return typeof value === "number" ? value : 0;
}

export function timestampedActivitySource<
  C extends string,
  E extends ActivityEntryBase<C>,
  Row,
>(options: {
  name: string;
  category: C;
  config: TimestampedActivitySourceConfig;
  run: RunActivityPipeline;
  toEntry: (row: Row) => E;
}): ActivitySource<C, E> {
  const { category, config, run, toEntry } = options;
  return {
    name: options.name,
    categories: [category],
    async fetch({ cursor, limit, category: filter }) {
      if (filter && filter !== category) {
        return [];
      }
      const rows = await run(
        asPipeline(buildTimestampedActivityPipeline(config, { cursor, limit })),
      );
      return (rows as Row[]).map(toEntry);
    },
    async count() {
      const rows = await run(
        asPipeline(buildTimestampedActivityCountPipeline(config)),
      );
      return { [category]: readActivityCount(rows) } as Partial<Record<C, number>>;
    },
  };
}

/** Application, interview and offer events for the applications in `match`. */
export function applicationActivitySource<
  C extends string,
  E extends ActivityEntryBase<C>,
>(options: {
  match: Record<string, unknown>;
  toEntry: (row: ApplicationActivityRow) => E;
}): ActivitySource<C, E> {
  const categories = APPLICATION_ACTIVITY_CATEGORIES as unknown as readonly C[];
  return {
    name: "applications",
    categories,
    async fetch({ cursor, limit, category }) {
      const rows = await ApplicationModel.aggregate(
        asPipeline(
          buildApplicationEventPagePipeline({
            match: options.match,
            cursor,
            limit,
            category,
          }),
        ),
      ).exec();
      return (rows as ApplicationActivityRow[]).map(options.toEntry);
    },
    async count() {
      const rows = (await ApplicationModel.aggregate(
        asPipeline(buildApplicationEventCountPipeline(options.match)),
      ).exec()) as Array<{ _id?: unknown; count?: unknown }>;
      const counts: Partial<Record<C, number>> = {};
      for (const row of rows) {
        const category = row._id as ApplicationActivityCategory;
        if (
          APPLICATION_ACTIVITY_CATEGORIES.includes(category) &&
          typeof row.count === "number"
        ) {
          counts[category as unknown as C] = row.count;
        }
      }
      return counts;
    },
  };
}

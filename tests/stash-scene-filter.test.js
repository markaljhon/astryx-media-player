import { describe, expect, test } from "bun:test";
import * as searchFilters from "../src/features/media/api/adapters/stash/searchFilters.ts";

const { createStashSceneFilter } = searchFilters;

const textCriterion = {
  value: "Lena",
  modifier: "INCLUDES",
};

const sceneOrPerformerTextFilter = {
  title: textCriterion,
  OR: {
    details: textCriterion,
    OR: {
      path: textCriterion,
      OR: {
        performers_filter: {
          name: textCriterion,
        },
      },
    },
  },
};

describe("createStashSceneFilter", () => {
  test("searches scenes by text or performer name", () => {
    expect(createStashSceneFilter("Lena", [])).toEqual(
      sceneOrPerformerTextFilter,
    );
  });

  test("keeps scene and performer text alternatives grouped when tags are applied", () => {
    expect(createStashSceneFilter("Lena", ["7"])).toEqual({
      tags: {
        value: ["7"],
        modifier: "INCLUDES_ALL",
      },
      AND: sceneOrPerformerTextFilter,
    });
  });

  test("keeps tag filters without text search", () => {
    expect(createStashSceneFilter(undefined, ["7"])).toEqual({
      tags: {
        value: ["7"],
        modifier: "INCLUDES_ALL",
      },
    });
  });

  test("ignores blank text searches", () => {
    expect(createStashSceneFilter("   ", ["7"])).toEqual({
      tags: {
        value: ["7"],
        modifier: "INCLUDES_ALL",
      },
    });
  });

  test("plans separate scene text and performer searches", () => {
    expect(searchFilters.createStashSceneSearchRequests(" nene ", ["7"])).toEqual([
      {
        query: "nene",
        sceneFilter: {
          tags: {
            value: ["7"],
            modifier: "INCLUDES_ALL",
          },
        },
      },
      {
        query: undefined,
        sceneFilter: {
          tags: {
            value: ["7"],
            modifier: "INCLUDES_ALL",
          },
          AND: {
            performers_filter: {
              name: {
                value: "nene",
                modifier: "INCLUDES",
              },
            },
          },
        },
      },
    ]);
  });
});

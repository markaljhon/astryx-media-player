type StashSceneFilter = Record<string, unknown>;

export type StashSceneSearchRequest = {
  query: string | undefined;
  sceneFilter: StashSceneFilter | null;
};

const textSearchModifier = "INCLUDES";

const createTextCriterion = (value: string) => {
  return {
    value,
    modifier: textSearchModifier,
  };
};

const chainFilters = (
  operator: "AND" | "OR",
  filters: StashSceneFilter[],
): StashSceneFilter | null => {
  const [firstFilter] = filters;

  if (!firstFilter) {
    return null;
  }

  return filters.slice(0, -1).reduceRight((combinedFilter, filter) => {
    return {
      ...filter,
      [operator]: combinedFilter,
    };
  }, filters[filters.length - 1]);
};

const createSceneTextSearchFilter = (
  query: string | undefined,
): StashSceneFilter | null => {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return null;
  }

  return chainFilters("OR", [
    {
      title: createTextCriterion(trimmedQuery),
    },
    {
      details: createTextCriterion(trimmedQuery),
    },
    {
      path: createTextCriterion(trimmedQuery),
    },
    {
      performers_filter: {
        name: createTextCriterion(trimmedQuery),
      },
    },
  ]);
};

const createPerformerTextSearchFilter = (
  query: string | undefined,
): StashSceneFilter | null => {
  const trimmedQuery = query?.trim();

  if (!trimmedQuery) {
    return null;
  }

  return {
    performers_filter: {
      name: createTextCriterion(trimmedQuery),
    },
  };
};

export const createTagSceneFilter = (tagIds: string[]) => {
  if (tagIds.length === 0) {
    return null;
  }

  return {
    tags: {
      value: tagIds,
      modifier: "INCLUDES_ALL",
    },
  };
};

export const createStashSceneFilter = (
  query: string | undefined,
  tagIds: string[],
) => {
  const filters = [
    createTagSceneFilter(tagIds),
    createSceneTextSearchFilter(query),
  ].filter((filter): filter is StashSceneFilter => Boolean(filter));

  if (filters.length === 0) {
    return null;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return chainFilters("AND", filters);
};

export const createStashSceneSearchRequests = (
  query: string | undefined,
  tagIds: string[],
): StashSceneSearchRequest[] => {
  const trimmedQuery = query?.trim();
  const tagFilter = createTagSceneFilter(tagIds);

  if (!trimmedQuery) {
    return [
      {
        query: undefined,
        sceneFilter: tagFilter,
      },
    ];
  }

  return [
    {
      query: trimmedQuery,
      sceneFilter: tagFilter,
    },
    {
      query: undefined,
      sceneFilter: chainFilters(
        "AND",
        [tagFilter, createPerformerTextSearchFilter(trimmedQuery)].filter(
          (filter): filter is StashSceneFilter => Boolean(filter),
        ),
      ),
    },
  ];
};

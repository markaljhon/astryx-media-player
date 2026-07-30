export type MediaLibrarySearch = {
  q: string;
  tags: string[];
  vr: boolean;
  page: number;
  pageSize: number;
};

export const mediaSearchDefaults = {
  q: "",
  tags: [],
  vr: true,
  page: 1,
  pageSize: 10,
} satisfies MediaLibrarySearch;

const allowedPageSizes = [10, 25, 50, 100] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const coerceString = (value: unknown, fallback: string) => {
  return typeof value === "string" ? value : fallback;
};

const coerceStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }

  return [];
};

const coerceBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const coercePositiveInteger = (value: unknown, fallback: number) => {
  const numericValue =
    typeof value === "number" ? value
    : typeof value === "string" ? Number(value)
    : Number.NaN;

  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return fallback;
  }

  return numericValue;
};

const coercePageSize = (value: unknown) => {
  const pageSize = coercePositiveInteger(value, mediaSearchDefaults.pageSize);

  return allowedPageSizes.includes(pageSize as (typeof allowedPageSizes)[number]) ?
      pageSize
    : mediaSearchDefaults.pageSize;
};

export const validateMediaSearch = (
  search: Record<string, unknown>,
): MediaLibrarySearch => {
  const routeSearch = isRecord(search) ? search : {};

  return {
    q: coerceString(routeSearch.q, mediaSearchDefaults.q),
    tags: coerceStringArray(routeSearch.tags),
    vr: coerceBoolean(routeSearch.vr, mediaSearchDefaults.vr),
    page: coercePositiveInteger(routeSearch.page, mediaSearchDefaults.page),
    pageSize: coercePageSize(routeSearch.pageSize),
  };
};

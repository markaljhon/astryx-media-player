import type { HlsConfig, LoaderContext } from "hls.js";

const stashProxyPathnamePrefix = "/stash/";

export const createHlsPlaybackConfig = (
  sourceUrl: string,
): Partial<HlsConfig> => {
  return {
    fetchSetup: (context, initParams) => {
      return new Request(getProxiedHlsRequestUrl(context, sourceUrl), {
        ...initParams,
        credentials: "include",
      });
    },
    xhrSetup: (xhr, url) => {
      xhr.open("GET", getProxiedHlsRequestUrl(url, sourceUrl), true);
      xhr.withCredentials = true;
    },
  };
};

const getProxiedHlsRequestUrl = (
  request: LoaderContext | string,
  sourceUrl: string,
) => {
  const requestUrl = new URL(
    typeof request === "string" ? request : request.url,
    window.location.href,
  );
  const source = new URL(sourceUrl, window.location.href);

  if (!shouldRouteThroughStashProxy(requestUrl, source)) {
    return requestUrl.toString();
  }

  return new URL(
    `/stash${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
    window.location.origin,
  ).toString();
};

const shouldRouteThroughStashProxy = (requestUrl: URL, source: URL) => {
  const stashServerOrigin = getConfiguredStashServerOrigin();

  return (
    isLocalStashProxyUrl(source) &&
    ((requestUrl.origin === window.location.origin &&
      !isLocalStashProxyUrl(requestUrl)) ||
      requestUrl.origin === stashServerOrigin)
  );
};

const isLocalStashProxyUrl = (url: URL) => {
  return (
    url.origin === window.location.origin &&
    url.pathname.startsWith(stashProxyPathnamePrefix)
  );
};

const getConfiguredStashServerOrigin = () => {
  const endpoint = import.meta.env.VITE_STASH_GRAPHQL_ENDPOINT?.trim();

  if (!endpoint) {
    return undefined;
  }

  try {
    return new URL(endpoint, window.location.href).origin;
  } catch {
    return undefined;
  }
};

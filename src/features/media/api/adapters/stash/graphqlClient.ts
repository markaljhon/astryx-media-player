export type StashGraphQlOperation<
  TData,
  TVariables extends Record<string, unknown>,
> = {
  document: string;
  name: string;
  readonly __result?: TData;
  readonly __variables?: TVariables;
};

export type StashGraphQlRequestConfig = {
  endpoint: string;
  headers?: Record<string, string>;
  invalidContentTypeMessage?: string;
  validateContentType?: boolean;
};

type GraphQlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message?: string }>;
};

const graphQlContentTypes = [
  "application/graphql-response+json",
  "application/json",
  "application/graphql+json",
];

const isGraphQlContentType = (contentType: string) => {
  return graphQlContentTypes.some((graphQlContentType) =>
    contentType.includes(graphQlContentType),
  );
};

const getGraphQlErrorMessage = <TData>(payload: GraphQlResponse<TData>) => {
  return payload.errors
    ?.map((error) => error.message)
    .filter((message): message is string => Boolean(message))
    .join(" ");
};

export const requestStashGraphQl = async <
  TData,
  TVariables extends Record<string, unknown>,
>(
  config: StashGraphQlRequestConfig,
  operation: StashGraphQlOperation<TData, TVariables>,
  variables: TVariables,
) => {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify({
      query: operation.document,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stash ${operation.name} returned HTTP ${response.status}.`);
  }

  const shouldValidateContentType = config.validateContentType ?? true;
  const contentType = response.headers.get("content-type") ?? "";
  if (shouldValidateContentType && !isGraphQlContentType(contentType)) {
    throw new Error(
      config.invalidContentTypeMessage ??
        `Stash ${operation.name} returned a non-GraphQL response.`,
    );
  }

  const payload = (await response.json()) as GraphQlResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(
      getGraphQlErrorMessage(payload) ||
        `Stash ${operation.name} returned a GraphQL error.`,
    );
  }

  return {
    endpoint: config.endpoint,
    data: payload.data,
  };
};

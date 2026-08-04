import {
  defaultMediaProviderId,
  fetchAllMediaTags,
  fetchMediaList,
  listMediaProviders,
} from "@/features/media/api/mediaApi";
import { MediaGalleryCard } from "@/features/media/components/MediaGalleryCard";
import {
  mediaSearchDefaults,
  validateMediaSearch,
  type MediaLibrarySearch,
} from "@/features/media/routing/mediaSearch";
import { ThemeToggleIconButton } from "@/features/theme/ThemeToggleIconButton";
import { ProtectedAppShell } from "@/layouts/ProtectedAppShell";
import type { MediaPage, MediaTag, MediaTagFilter } from "@/types/media";
import {
  Center,
  DropdownMenu,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Layout,
  LayoutContent,
  LayoutFooter,
  Pagination,
  StackItem,
  Text,
  TextInput,
  Tokenizer,
  Toolbar,
  useAppShellMobile,
  VStack,
  type SearchSource,
} from "@astryxdesign/core";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { Clapperboard, EllipsisVertical, Tag } from "lucide-react";
import React from "react";
import { useDebouncedCallback } from "use-debounce";

const defaultVrTagName = "VR";
const searchDebounceMs = 250;

type GallerySearch = MediaLibrarySearch & {
  providerId: string;
};

type MediaTagToken = {
  id: string;
  label: string;
  name: string;
  isDefault?: boolean;
};

const defaultVrTag: MediaTagToken = {
  id: "default-tag:vr",
  label: "vr",
  name: defaultVrTagName,
  isDefault: true,
};

const gallerySearchDefaults = {
  ...mediaSearchDefaults,
  providerId: defaultMediaProviderId,
} satisfies GallerySearch;

const getProviderLabel = (providerId: string) => {
  return providerId
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

const validateGallerySearch = (
  search: Record<string, unknown>,
): GallerySearch => {
  const mediaSearch = validateMediaSearch(search);
  const providerIds = new Set(
    listMediaProviders().map((provider) => provider.id),
  );
  const requestedProviderId = search.providerId;
  const providerId =
    (
      typeof requestedProviderId === "string"
      && providerIds.has(requestedProviderId)
    ) ?
      requestedProviderId
    : gallerySearchDefaults.providerId;

  return {
    ...mediaSearch,
    providerId,
  };
};

const getGalleryTagFilters = (search: GallerySearch): MediaTagFilter[] => {
  return [
    ...(search.vr ? [{ name: defaultVrTagName }] : []),
    ...search.tags.map((tagName) => ({ name: tagName })),
  ];
};

const toMediaTagToken = (tag: MediaTag): MediaTagToken => {
  return {
    id: tag.id,
    label: tag.label,
    name: tag.name,
  };
};

const toTagSearchToken = (tag: MediaTag): MediaTagToken | null => {
  if (tag.name.toLowerCase() === defaultVrTag.name.toLowerCase()) {
    return null;
  }

  return toMediaTagToken(tag);
};

const tagCatalogByProvider = new Map<string, Promise<MediaTagToken[]>>();

const fetchGalleryTagCatalog = (providerId: string) => {
  const cachedCatalog = tagCatalogByProvider.get(providerId);

  if (cachedCatalog) {
    return cachedCatalog;
  }

  const catalog = fetchAllMediaTags({ providerId })
    .then((tags) =>
      tags.flatMap((tag) => {
        const token = toTagSearchToken(tag);

        return token ? [token] : [];
      }),
    )
    .catch(() => {
      tagCatalogByProvider.delete(providerId);

      return [];
    });

  tagCatalogByProvider.set(providerId, catalog);

  return catalog;
};

const matchesTagSearch = (tag: MediaTagToken, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    tag.name.toLowerCase().includes(normalizedQuery)
    || tag.label.toLowerCase().includes(normalizedQuery)
  );
};

const isDefaultTag = (tag: MediaTagToken) => {
  return tag.id === defaultVrTag.id;
};

const getRouteTag = (tagName: string, tagCatalog: MediaTagToken[]) => {
  const normalizedTagName = tagName.trim().toLowerCase();

  return (
    tagCatalog.find((tag) => {
      return (
        tag.id.toLowerCase() === normalizedTagName
        || tag.name.toLowerCase() === normalizedTagName
        || tag.label.toLowerCase() === normalizedTagName
      );
    }) ?? {
      id: `route-tag:${tagName}`,
      label: tagName,
      name: tagName,
    }
  );
};

const getUniqueTagNames = (tags: MediaTagToken[]) => {
  const uniqueTagNames = new Map<string, string>();

  for (const tag of tags) {
    if (!isDefaultTag(tag)) {
      uniqueTagNames.set(tag.name.toLowerCase(), tag.name);
    }
  }

  return [...uniqueTagNames.values()];
};

const MediaGalleryPage = () => {
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const focusSearchInput = () => {
    searchInputRef.current?.focus();
  };

  return (
    <ProtectedAppShell>
      <Layout
        content={<MediaGalleryContent searchInputRef={searchInputRef} />}
        footer={
          <LayoutFooter label="Gallery navigation" hasDivider padding={0}>
            <MediaGalleryNav onSearchClick={focusSearchInput} />
          </LayoutFooter>
        }
      />
    </ProtectedAppShell>
  );
};

const MediaGalleryContent = ({
  searchInputRef,
}: {
  searchInputRef: React.Ref<HTMLInputElement>;
}) => {
  const { mediaPage, tagCatalog } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const providers = React.useMemo(() => listMediaProviders(), []);
  const selectedTags = React.useMemo(
    () => [
      ...(search.vr ? [defaultVrTag] : []),
      ...search.tags.map((tagName) => getRouteTag(tagName, tagCatalog)),
    ],
    [search.tags, search.vr, tagCatalog],
  );
  const tagSearchSource = React.useMemo<SearchSource<MediaTagToken>>(() => {
    const searchTags = (searchQuery: string) => {
      return tagCatalog.filter((tag) => matchesTagSearch(tag, searchQuery));
    };

    return {
      search: searchTags,
      bootstrap: () => searchTags(""),
    };
  }, [tagCatalog]);
  const { isMobile } = useAppShellMobile();

  const updateSearch = (nextSearch: Partial<GallerySearch>) => {
    void navigate({
      replace: true,
      search: (currentSearch) => ({
        ...currentSearch,
        ...nextSearch,
      }),
    });
  };

  const onPlay = (sceneId: string) => {
    void navigate({
      to: "/media/player/$sceneId",
      params: { sceneId: sceneId },
      search: { ...mediaSearchDefaults, providerId: search.providerId },
    });
  };

  return (
    <LayoutContent role="main">
      <VStack gap={2} paddingBlock={3}>
        <HStack gap={3} paddingInline={3}>
          <StackItem size="fill">
            <Heading level={2}>Media Gallery</Heading>
          </StackItem>
          <DropdownMenu
            button={{
              label: `${getProviderLabel(search.providerId)}`,
              variant: "ghost",
            }}
            items={providers.map((provider) => ({
              label: getProviderLabel(provider.id),
              isDisabled: provider.id === search.providerId,
              onClick: () => updateSearch({ providerId: provider.id, page: 1 }),
            }))}
          />
          <ThemeToggleIconButton />
        </HStack>
        <MediaGallerySearchBar
          search={search.q}
          tags={selectedTags}
          tagCatalog={tagCatalog}
          tagSearchSource={tagSearchSource}
          searchInputRef={searchInputRef}
          setSearch={(nextSearch) => updateSearch({ q: nextSearch, page: 1 })}
          setTags={(nextTags) =>
            updateSearch({
              tags: getUniqueTagNames(nextTags),
              vr: nextTags.some((tag) => isDefaultTag(tag)),
              page: 1,
            })
          }
        />
        <StackItem
          size="fill"
          style={isMobile ? undefined : { paddingInline: "var(--spacing-3)" }}
        >
          <MediaItemList
            page={mediaPage}
            onPageChange={(nextPage) => updateSearch({ page: nextPage })}
            onPageSizeChange={(nextPageSize) =>
              updateSearch({ pageSize: nextPageSize, page: 1 })
            }
            onPlay={onPlay}
          />
        </StackItem>
      </VStack>
    </LayoutContent>
  );
};

const MediaItemList = ({
  page: { items, page, pageSize, totalItems },
  onPageChange,
  onPageSizeChange,
  onPlay,
}: {
  page: MediaPage;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  onPlay: (sceneId: string) => void;
}) => {
  return items.length === 0 ?
      <Center style={{ paddingBlock: "var(--spacing-4)" }}>
        <VStack gap={2} hAlign="center">
          <Icon icon={Clapperboard} size="lg" color="secondary" />
          <Text type="body" weight="bold">
            No media is available yet.
          </Text>
          <Text type="supporting" color="secondary">
            Try a different search term or register another provider adapter
            later.
          </Text>
        </VStack>
      </Center>
    : <>
        <MediaItemRangeText
          itemCount={items.length}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
        />
        <Grid columns={{ minWidth: 280, max: 4, repeat: "fit" }} gap={2}>
          {items.map((item) => (
            <MediaGalleryCard
              key={item.id}
              item={item}
              onPlay={(item) => onPlay(item.id)}
            />
          ))}
        </Grid>
        <Pagination
          page={page}
          onChange={onPageChange}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 25, 50, 100]}
          variant="pages"
          style={{ paddingBlock: "var(--spacing-4)" }}
        />
      </>;
};

const MediaItemRangeText = ({
  itemCount,
  page,
  pageSize,
  totalItems,
}: {
  itemCount: number;
  page: number;
  pageSize: number;
  totalItems: number;
}) => {
  const rangeLabel =
    itemCount === totalItems ?
      `${itemCount} of ${totalItems}`
    : `${(page - 1) * pageSize + 1}-${(page - 1) * pageSize + itemCount} of ${totalItems}`;

  return (
    <Text type="supporting" color="secondary">
      Showing {rangeLabel} items
    </Text>
  );
};

const MediaGallerySearchBar = ({
  search,
  tags,
  tagCatalog,
  tagSearchSource,
  searchInputRef,
  setSearch,
  setTags,
}: {
  search: string;
  tags: MediaTagToken[];
  tagCatalog: MediaTagToken[];
  tagSearchSource: SearchSource<MediaTagToken>;
  searchInputRef: React.Ref<HTMLInputElement>;
  setSearch: (value: string) => void;
  setTags: (value: MediaTagToken[]) => void;
}) => {
  const [searchValue, setSearchValue] = React.useState(search);
  const setDebouncedSearch = useDebouncedCallback(
    (value: string) => setSearch(value),
    searchDebounceMs,
  );
  const onChange = (value: string) => {
    setSearchValue(value);
    setDebouncedSearch(value);
  };

  return (
    <Toolbar
      label="Media gallery search"
      size="lg"
      gap={3}
      startContent={
        <VStack gap={2} width="100%">
          <HStack gap={2} width="100%">
            <StackItem size="fill">
              <TextInput
                ref={searchInputRef}
                label="Search"
                isLabelHidden
                placeholder="Search videos, scenes, and more..."
                value={searchValue}
                onChange={onChange}
                startIcon={<Icon icon="search" />}
                hasClear={true}
              />
            </StackItem>
            <IconButton
              label="Filter options"
              icon={<Icon icon={EllipsisVertical} />}
            />
          </HStack>
          <StackItem size="fill">
            <MediaTagsTokenizer
              tags={tags}
              tagCatalog={tagCatalog}
              tagSearchSource={tagSearchSource}
              setTags={setTags}
            />
          </StackItem>
        </VStack>
      }
    />
  );
};

const MediaTagsTokenizer = ({
  tags,
  tagCatalog,
  tagSearchSource,
  setTags,
}: {
  tags: MediaTagToken[];
  tagCatalog: MediaTagToken[];
  tagSearchSource: SearchSource<MediaTagToken>;
  setTags: (value: MediaTagToken[]) => void;
}) => {
  console.log({ tags, tagCatalog, tagSearchSource });
  return (
    <Tokenizer
      label="Tags"
      size="lg"
      isLabelHidden
      startIcon={
        <Icon icon={Tag} style={{ marginInlineEnd: "var(--spacing-1)" }} />
      }
      value={tags}
      onChange={setTags}
      searchSource={tagSearchSource}
      placeholder="Add tags"
      hasEntriesOnFocus
      maxMenuItems={Math.max(10, tagCatalog.length)}
      hasClear
      debounceMs={200}
    />
  );
};

const MediaGalleryNav = ({
  onSearchClick,
}: {
  onSearchClick: () => void;
}) => {
  const { mediaPage } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { isMobile } = useAppShellMobile();
  const { page, pageSize, totalItems } = mediaPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;
  const goToPage = (nextPage: number) => {
    void navigate({
      replace: true,
      search: (currentSearch) => ({
        ...currentSearch,
        page: nextPage,
      }),
    });
  };

  return (
    <Toolbar
      label="Media gallery navigation"
      size="lg"
      startContent={
        <HStack gap={3} hAlign={isMobile ? "around" : "end"} width="100%">
          <IconButton
            label="More navigation options"
            tooltip="More navigation options"
            variant="ghost"
            icon={<Icon icon="moreHorizontal" />}
          />
          <IconButton
            label="Search gallery"
            tooltip="Search gallery"
            variant="ghost"
            icon={<Icon icon="search" />}
            onClick={onSearchClick}
          />
          <IconButton
            label="Previous page"
            tooltip="Previous page"
            variant="ghost"
            icon={<Icon icon="chevronLeft" />}
            isDisabled={!canGoPrevious}
            onClick={() => goToPage(page - 1)}
          />
          <IconButton
            label="Next page"
            tooltip="Next page"
            variant="ghost"
            icon={<Icon icon="chevronRight" />}
            isDisabled={!canGoNext}
            onClick={() => goToPage(page + 1)}
          />
        </HStack>
      }
    />
  );
};

export const Route = createFileRoute("/gallery")({
  validateSearch: validateGallerySearch,
  search: {
    middlewares: [stripSearchParams(gallerySearchDefaults)],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [mediaPage, tagCatalog] = await Promise.all([
      fetchMediaList({
        providerId: deps.providerId,
        query: deps.q.trim(),
        tags: getGalleryTagFilters(deps),
        page: deps.page,
        pageSize: deps.pageSize,
        paginated: true,
      }),
      fetchGalleryTagCatalog(deps.providerId),
    ]);

    return {
      mediaPage,
      tagCatalog,
    };
  },
  component: MediaGalleryPage,
});

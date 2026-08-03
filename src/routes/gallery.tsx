import {
  defaultMediaProviderId,
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
import type { MediaPage, MediaTagFilter } from "@/types/media";
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
  Toolbar,
  useAppShellMobile,
  VStack,
} from "@astryxdesign/core";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { Clapperboard } from "lucide-react";
import React from "react";
import { useDebouncedCallback } from "use-debounce";

const defaultVrTagName = "VR";
const searchDebounceMs = 250;

type GallerySearch = MediaLibrarySearch & {
  providerId: string;
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

const MediaGalleryPage = () => {
  return (
    <ProtectedAppShell>
      <Layout
        content={<MediaGalleryContent />}
        footer={
          <LayoutFooter label="Gallery navigation" hasDivider padding={0}>
            <MediaGalleryNav />
          </LayoutFooter>
        }
      />
    </ProtectedAppShell>
  );
};

const MediaGalleryContent = () => {
  const mediaPage = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const providers = React.useMemo(() => listMediaProviders(), []);
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
          setSearch={(nextSearch) => updateSearch({ q: nextSearch, page: 1 })}
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
}: {
  page: MediaPage;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
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
        <Text type="supporting" color="secondary">
          Showing {items.length} of {totalItems} items
        </Text>
        <Grid columns={{ minWidth: 280, max: 4, repeat: "fit" }} gap={2}>
          {items.map((item) => (
            <MediaGalleryCard key={item.id} item={item} />
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

const MediaGallerySearchBar = ({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (value: string) => void;
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

  React.useEffect(() => {
    setDebouncedSearch.cancel();
    setSearchValue(search);
  }, [search, setDebouncedSearch]);

  return (
    <Toolbar
      label="Media gallery search"
      size="lg"
      gap={3}
      startContent={
        <HStack gap={3} width="100%">
          <StackItem size="fill">
            <TextInput
              label="Search"
              isLabelHidden
              placeholder="Search videos, scenes, and more..."
              value={searchValue}
              onChange={onChange}
              startIcon={<Icon icon="search" />}
              hasClear={true}
            />
          </StackItem>
          <IconButton label="Filter options" icon={<Icon icon="funnel" />} />
        </HStack>
      }
    />
  );
};

const MediaGalleryNav = () => {
  const { isMobile } = useAppShellMobile();

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
          />
          <IconButton
            label="Previous item"
            tooltip="Previous item"
            variant="ghost"
            icon={<Icon icon="chevronLeft" />}
          />
          <IconButton
            label="Next item"
            tooltip="Next item"
            variant="ghost"
            icon={<Icon icon="chevronRight" />}
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
    return fetchMediaList({
      providerId: deps.providerId,
      query: deps.q.trim(),
      tags: getGalleryTagFilters(deps),
      page: deps.page,
      pageSize: deps.pageSize,
      paginated: true,
    });
  },
  component: MediaGalleryPage,
});

import { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Heading,
  Pagination,
  Section,
  Text,
  Token,
  Tokenizer,
  VStack,
  type SearchSource,
} from "@astryxdesign/core";
import { useAppShellMobile } from "@astryxdesign/core/AppShell";
import {
  fetchMediaTags,
  fetchMediaList,
  type MediaItem,
  type MediaListResult,
  type MediaTag,
} from "../../features/media/api/mediaApi";
import { MediaGalleryCard } from "../../features/media/components/MediaGalleryCard";
import { MediaSearchBar } from "../../features/media/components/MediaSearchBar";
import { MediaSkeletonGallery } from "../../features/media/components/MediaSkeletonGallery";
import { VideoPlayerAdapter } from "../../features/players/components/VideoPlayerAdapter";

type MediaTagToken = MediaTag & {
  isDefault?: boolean;
  isEnabled?: boolean;
};

const defaultVrTag: MediaTagToken = {
  id: "default-tag:vr",
  label: "vr",
  name: "VR",
  isDefault: true,
  isEnabled: true,
};

function isDefaultTag(tag: MediaTagToken) {
  return tag.id === defaultVrTag.id;
}

export function MediaLibraryPage(props: { providerId?: string }) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<MediaTagToken[]>([
    defaultVrTag,
  ]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedPlayerItem, setSelectedPlayerItem] = useState<MediaItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const activeTagFilters = useMemo(
    () =>
      selectedTags
        .filter((tag) => tag.isEnabled !== false)
        .map((tag) => ({
          id: tag.isDefault ? undefined : tag.id,
          name: tag.name,
        })),
    [selectedTags],
  );

  const tagSearchSource = useMemo<SearchSource<MediaTagToken>>(
    () => {
      async function searchTags(searchQuery: string) {
        const tags = await fetchMediaTags({
          providerId: props.providerId,
          query: searchQuery,
          limit: 10,
        });

        return tags
          .filter(
            (tag) =>
              tag.name.toLowerCase() !== defaultVrTag.name.toLowerCase(),
          )
          .map((tag) => ({ ...tag, isEnabled: true }));
      }

      return {
        search: searchTags,
        bootstrap: () => searchTags(""),
      };
    },
    [props.providerId],
  );

  const { isMobile } = useAppShellMobile();

  useEffect(() => {
    let isActive = true;

    async function loadMedia() {
      setIsLoading(true);
      setError(null);

      try {
        const result: MediaListResult = await fetchMediaList({
          // providerId: "stash",
          // providerId:  "local",
          providerId: props.providerId,
          query: trimmedQuery,
          tags: activeTagFilters,
          page,
          pageSize,
          paginated: true,
        });

        if (isActive) {
          setItems(result.items);
          setTotalItems(result.totalItems);
        }
      } catch (loadError) {
        if (isActive) {
          setItems([]);
          setTotalItems(0);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load media items.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadMedia();

    return () => {
      isActive = false;
    };
  }, [activeTagFilters, page, pageSize, props.providerId, trimmedQuery]);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  function handleTagsChange(nextTags: MediaTagToken[]) {
    setSelectedTags((currentTags) => {
      const currentDefaultTag =
        currentTags.find(isDefaultTag) ?? defaultVrTag;
      const uniqueTags = new Map<string, MediaTagToken>();

      for (const tag of nextTags) {
        if (!isDefaultTag(tag)) {
          uniqueTags.set(tag.id, { ...tag, isEnabled: true });
        }
      }

      return [currentDefaultTag, ...uniqueTags.values()];
    });
    setPage(1);
  }

  function toggleDefaultTag() {
    setSelectedTags((currentTags) =>
      currentTags.map((tag) =>
        isDefaultTag(tag)
          ? { ...tag, isEnabled: tag.isEnabled === false }
          : tag,
      ),
    );
    setPage(1);
  }

  function handlePlayerOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setSelectedPlayerItem(null);
    }
  }

  return (
    <Section variant="transparent" height="100%" className="safe-area">
      <VStack gap={4} height="100%">
        <VStack gap={1}>
          <Heading level={1}>Media Library</Heading>
          <Text type="body" color="secondary">
            Search the collection and browse media from the active provider.
          </Text>
        </VStack>

        <MediaSearchBar value={query} onChange={handleQueryChange} />

        <Tokenizer
          label="Tags"
          value={selectedTags}
          onChange={handleTagsChange}
          searchSource={tagSearchSource}
          placeholder="Add tags"
          hasEntriesOnFocus
          debounceMs={200}
          renderToken={(tag, onRemove) =>
            isDefaultTag(tag) ? (
              <Token
                label={tag.label}
                color={tag.isEnabled === false ? "gray" : "cyan"}
                onClick={toggleDefaultTag}
                description={
                  tag.isEnabled === false
                    ? "Click to enable the default VR tag filter."
                    : "Click to disable the default VR tag filter."
                }
              />
            ) : (
              <Token label={tag.label} color="gray" onRemove={onRemove} />
            )
          }
        />

        <Section variant="muted" padding={0} height="100%">
          <VStack gap={3}>
            <VStack gap={1} padding={3}>
              <Heading level={2}>Gallery preview</Heading>
              <Text type="supporting" color="secondary">
                {error
                  ? "The media provider returned an error."
                  : items.length > 0
                    ? `Showing ${items.length} item${items.length === 1 ? "" : "s"}${trimmedQuery.length > 0 ? ` for "${trimmedQuery}"` : ""}.`
                    : trimmedQuery.length > 0
                      ? `No items matched "${trimmedQuery}".`
                      : "Showing the current media library from the default provider."}
              </Text>
            </VStack>

            {isLoading ? (
              <VStack paddingInline={isMobile ? 0 : 3}>
                <MediaSkeletonGallery count={8} />
              </VStack>
            ) : error ? (
              <VStack gap={1} padding={3}>
                <Text type="body" color="secondary">
                  {error}
                </Text>
              </VStack>
            ) : items.length === 0 ? (
              <VStack gap={1} padding={3}>
                <Text type="body">
                  No media is available yet for this provider.
                </Text>
                <Text type="supporting" color="secondary">
                  Try a different search term or register another provider
                  adapter later.
                </Text>
              </VStack>
            ) : (
              <VStack paddingInline={isMobile ? 0 : 3} height="100%">
                <Grid columns={{ minWidth: 220, max: 4 }} gap={3}>
                  {items.map((item) => (
                    <MediaGalleryCard
                      key={item.id}
                      item={item}
                      onPlay={setSelectedPlayerItem}
                    />
                  ))}
                </Grid>
                <Pagination
                  page={page}
                  onChange={setPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 25, 50, 100]}
                  variant="count"
                  style={{ paddingBlock: "var(--spacing-4)" }}
                />
              </VStack>
            )}
          </VStack>
        </Section>
      </VStack>
      <VideoPlayerAdapter
        item={selectedPlayerItem}
        onOpenChange={handlePlayerOpenChange}
      />
    </Section>
  );
}

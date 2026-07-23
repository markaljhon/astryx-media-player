import { useState } from "react";
import { Heading, Section, Text, VStack } from "@astryxdesign/core";
import { MediaSearchBar } from "../../features/media/components/MediaSearchBar";
import { MediaSkeletonGallery } from "../../features/media/components/MediaSkeletonGallery";

export function MediaLibraryPage() {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  return (
    <Section variant="transparent" padding={4}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={1}>Media Library</Heading>
          <Text type="body" color="secondary">
            Search the collection and browse a responsive skeleton gallery while
            we wire up real media sources.
          </Text>
        </VStack>

        <MediaSearchBar value={query} onChange={setQuery} />

        <Section variant="muted" padding={4}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={2}>Gallery preview</Heading>
              <Text type="supporting" color="secondary">
                {trimmedQuery.length > 0
                  ? `Filtering placeholder results for "${trimmedQuery}".`
                  : "A loading grid for video thumbnails and future player variants."}
              </Text>
            </VStack>

            <MediaSkeletonGallery count={8} />
          </VStack>
        </Section>
      </VStack>
    </Section>
  );
}

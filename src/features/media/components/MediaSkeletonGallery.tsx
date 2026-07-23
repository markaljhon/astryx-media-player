import { Grid } from "@astryxdesign/core";
import { MediaSkeletonCard } from "./MediaSkeletonCard";

type MediaSkeletonGalleryProps = {
  count?: number;
};

export function MediaSkeletonGallery({ count = 8 }: MediaSkeletonGalleryProps) {
  return (
    <Grid columns={{ minWidth: 220, max: 4 }} gap={3}>
      {Array.from({ length: count }, (_, index) => (
        <MediaSkeletonCard key={index} index={index} />
      ))}
    </Grid>
  );
}

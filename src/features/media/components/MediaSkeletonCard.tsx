import { Card, Skeleton, VStack } from "@astryxdesign/core";

type MediaSkeletonCardProps = {
  index: number;
};

export function MediaSkeletonCard({ index }: MediaSkeletonCardProps) {
  return (
    <Card padding={3}>
      <VStack gap={2}>
        <Skeleton width="100%" height={160} radius={2} index={index * 3} />
        <VStack gap={1}>
          <Skeleton width="74%" height={18} radius={1} index={index * 3 + 1} />
          <Skeleton width="48%" height={14} radius={1} index={index * 3 + 2} />
        </VStack>
      </VStack>
    </Card>
  );
}

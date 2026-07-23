export type MediaItem = {
  id: string;
  title: string;
  kind: "video";
};

export async function searchMedia(_query: string): Promise<MediaItem[]> {
  return [];
}

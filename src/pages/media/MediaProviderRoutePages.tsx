import { getRouteApi } from "@tanstack/react-router";
import { MediaLibraryPage } from "@/pages/media/MediaLibraryPage";

const providerRouteApi = getRouteApi("/media/$providerId");

export const StashMediaRoutePage = () => {
  return <MediaLibraryPage providerId="stash" />;
};

export const MediaProviderRoutePage = () => {
  const { providerId } = providerRouteApi.useParams();

  return <MediaLibraryPage providerId={providerId} />;
};

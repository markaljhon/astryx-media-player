import { useVideoTexture } from "@react-three/drei";
import { useMediaAttach } from "@videojs/react";
import { Suspense, useEffect } from "react";
import { BackSide, ClampToEdgeWrapping } from "three";

type SpatialVideoMaterialProps = {
  url: string;
};

export const SpatialVideoMaterial = (props: SpatialVideoMaterialProps) => {
  const texture = useVideoTexture(props.url, {
    crossOrigin: "anonymous",
    muted: false,
    playsInline: true,
  });
  const setMedia = useMediaAttach();

  useEffect(() => {
    if (!setMedia) {
      return;
    }

    const video = texture.image;
    setMedia(video);

    return () => {
      setMedia?.((currentMedia) =>
        currentMedia === video ? null : currentMedia,
      );
      video.pause();
    };
  }, [setMedia, texture.image]);

  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.repeat.set(-0.5, 1);
  texture.offset.set(0.5, 0);

  return (
    <Suspense fallback={<meshBasicMaterial color="black" wireframe />}>
      <meshBasicMaterial map={texture} side={BackSide} toneMapped={false} />
    </Suspense>
  );
};

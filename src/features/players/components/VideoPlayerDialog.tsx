import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  Icon,
  IconButton,
  StackItem,
  VStack,
} from "@astryxdesign/core";

export type VideoPlayerDialogProps = {
  children: ReactNode;
  closeLabel: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const videoDialogSurfaceStyle: CSSProperties = {
  backgroundColor: "var(--color-on-light)",
  height: "100dvh",
  minHeight: 0,
  overflow: "hidden",
  position: "relative",
  width: "100dvw",
};

const videoDialogCloseButtonStyle: CSSProperties = {
  position: "absolute",
  right: "calc(env(safe-area-inset-right) + var(--spacing-2))",
  top: "calc(env(safe-area-inset-top) + var(--spacing-2))",
  zIndex: 2,
};

const videoDialogPlayerStyle: CSSProperties = {
  height: "100dvh",
  minHeight: 0,
  minWidth: 0,
  width: "100dvw",
};

export const VideoPlayerDialog = ({
  children,
  closeLabel,
  isOpen,
  onOpenChange,
}: VideoPlayerDialogProps) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="fullscreen"
      purpose="info"
      padding={0}
    >
      <VStack height="100%" gap={0} padding={0} style={videoDialogSurfaceStyle}>
        <IconButton
          label={closeLabel}
          icon={<Icon icon="chevronLeft" color="inherit" />}
          variant="ghost"
          style={videoDialogCloseButtonStyle}
          onClick={() => onOpenChange(false)}
        />
        <StackItem
          size="fill"
          crossAlignSelf="stretch"
          style={videoDialogPlayerStyle}
        >
          {children}
        </StackItem>
      </VStack>
    </Dialog>,
    document.body,
  );
};

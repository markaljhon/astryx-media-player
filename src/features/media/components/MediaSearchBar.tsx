import { TextInput } from "@astryxdesign/core";

type MediaSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export const MediaSearchBar = ({ value, onChange }: MediaSearchBarProps) => {
  return (
    <TextInput
      label="Search media"
      value={value}
      onChange={(nextValue) => onChange(nextValue)}
      size="lg"
      placeholder="Search videos, clips, and playlists"
      hasClear
    />
  );
};

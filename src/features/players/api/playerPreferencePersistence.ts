type PlayerPreferenceChangeOptions<T> = {
  hasHydratedMedia: boolean;
  hydratedValue: T | null;
  nextValue: T;
  skipHydrationEcho: boolean;
};

export const shouldPersistPlayerPreferenceChange = <T,>({
  hasHydratedMedia,
  hydratedValue,
  nextValue,
  skipHydrationEcho,
}: PlayerPreferenceChangeOptions<T>) => {
  if (!hasHydratedMedia) {
    return false;
  }

  return !skipHydrationEcho || hydratedValue !== nextValue;
};

import type { MediaProviderAdapter, MediaProviderId } from "./mediaTypes";

const providerRegistry = new Map<MediaProviderId, MediaProviderAdapter>();

export const defaultMediaProviderId = "local";

export function registerMediaProvider(adapter: MediaProviderAdapter) {
  providerRegistry.set(adapter.id, adapter);
  return adapter;
}

export function getMediaProvider(providerId: MediaProviderId = defaultMediaProviderId) {
  return providerRegistry.get(providerId);
}

export function listMediaProviders() {
  return Array.from(providerRegistry.values());
}

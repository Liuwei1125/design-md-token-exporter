export async function getStoredValue<T>(key: string, fallback?: T): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  const value = result[key] as T | undefined;
  return value === undefined ? fallback : value;
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function removeStoredValue(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

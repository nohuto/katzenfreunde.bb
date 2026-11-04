export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

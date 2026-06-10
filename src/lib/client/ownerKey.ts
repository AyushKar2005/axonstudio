const OWNER_KEY = "axon:owner-key:v1";

export function getOwnerKey() {
  if (typeof window === "undefined") return "";

  let key = localStorage.getItem(OWNER_KEY);

  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, key);
  }

  return key;
}

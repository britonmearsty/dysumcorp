"use client";

import { useEffect, useState } from "react";

export type StorageDeleteBehavior = "ask" | "always" | "never";

export function useStorageDeleteBehavior() {
  const [behavior, setBehavior] = useState<StorageDeleteBehavior>("ask");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/storage-delete-behavior")
      .then((r) => r.json())
      .then((d) => {
        if (d.storageDeleteBehavior) setBehavior(d.storageDeleteBehavior);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { behavior, loaded };
}

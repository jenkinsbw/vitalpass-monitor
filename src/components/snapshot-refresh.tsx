"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SnapshotRefreshValue = {
  version: number;
  bump: () => void;
};

const SnapshotRefreshContext = createContext<SnapshotRefreshValue | null>(null);

export function SnapshotRefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);

  return (
    <SnapshotRefreshContext.Provider value={value}>
      {children}
    </SnapshotRefreshContext.Provider>
  );
}

export function useSnapshotRefresh(): SnapshotRefreshValue {
  const value = useContext(SnapshotRefreshContext);

  if (!value) {
    throw new Error("Snapshot refresh is missing.");
  }

  return value;
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type RealtimeStatus = "connecting" | "connected" | "disconnected";

type RealtimeEventPayload = {
  id?: string;
  type: string;
  payload?: unknown;
  createdAt?: string;
};

type RealtimeContextValue = {
  status: RealtimeStatus;
  lastEvent: string;
  lastEventType: string | null;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "connecting",
  lastEvent: "Belum ada event",
  lastEventType: null,
});

const REFRESH_EVENT_TYPES = new Set([
  "check.completed",
  "website.status_changed",
  "incident.created",
  "incident.resolved",
  "notification.sent",
]);

function shouldRefreshPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/graph") ||
    pathname.startsWith("/websites") ||
    pathname.startsWith("/incidents") ||
    pathname.startsWith("/notifications")
  );
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [lastEvent, setLastEvent] = useState("Belum ada event");
  const [lastEventType, setLastEventType] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      setStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEventPayload;

        if (data.type === "connected") {
          setStatus("connected");
          setLastEvent(`connected - ${new Date().toLocaleTimeString("id-ID")}`);
          setLastEventType(data.type);
          return;
        }

        if (data.type === "ping") {
          setStatus("connected");
          return;
        }

        setStatus("connected");
        setLastEvent(`${data.type} - ${new Date().toLocaleTimeString("id-ID")}`);
        setLastEventType(data.type);

        if (REFRESH_EVENT_TYPES.has(data.type) && shouldRefreshPath(pathname)) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to parse realtime event", error);
      }
    };

    eventSource.onerror = () => {
      setStatus("disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, [pathname, router]);

  const value = useMemo(
    () => ({
      status,
      lastEvent,
      lastEventType,
    }),
    [status, lastEvent, lastEventType]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
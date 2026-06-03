"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { api } from "@/store/apiSlice";

export function useLiveOperationsTelemetry() {
  const dispatch = useDispatch();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let isUnmounted = false;

    // Helper to resolve ws url based on env & browser context
    const getWsUrl = (useFallback = false) => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      let host = "localhost:4000";

      if (typeof window !== "undefined") {
        if (apiBase) {
          // Parse host from URL: http://localhost:4000/api -> localhost:4000
          const urlMatch = apiBase.match(/^https?:\/\/([^/]+)/);
          if (urlMatch) host = urlMatch[1];
        } else {
          host = window.location.host;
        }

        // Hostname alignment for local environments (prevents ::1 / 127.0.0.1 mixed conflicts)
        if (window.location.hostname === "127.0.0.1" && host.includes("localhost")) {
          host = host.replace("localhost", "127.0.0.1");
        } else if (window.location.hostname === "localhost" && host.includes("127.0.0.1")) {
          host = host.replace("127.0.0.1", "localhost");
        }
      }

      // If we are asked to use fallback due to IPv6 / IPv4 local binding mismatch
      if (useFallback) {
        if (host.includes("localhost")) {
          host = host.replace("localhost", "127.0.0.1");
        } else if (host.includes("127.0.0.1")) {
          host = host.replace("127.0.0.1", "localhost");
        }
      }

      const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
      return `${protocol}://${host}`;
    };

    const connect = () => {
      if (isUnmounted) return;

      // Close existing connection if any
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
      }

      // Alternate hosts on successive failures to handle binding discrepancies
      const useFallbackHost = retryCountRef.current > 0 && retryCountRef.current % 2 !== 0;
      const targetUrl = getWsUrl(useFallbackHost);

      console.log(`[ws] Connecting to live telemetry at: ${targetUrl}`);
      const socket = new WebSocket(targetUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isUnmounted) {
          socket.close();
          return;
        }
        console.log("[ws] Connected to Mediso Live Operations Telemetry");
        retryCountRef.current = 0; // Reset retry counter on successful connection
      };

      socket.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "OCCUPANCY_CHANGED") {
            console.log("[ws] Received occupancy update:", payload.data);
            
            // Force invalidate RTK Query caches to trigger instant page refetches
            dispatch(api.util.invalidateTags(["Availability", "Appointment", "Resource"]));
          }
        } catch (err) {
          console.error("[ws] Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = () => {
        // Suppress noisy logs; trigger reconnect fallback in onclose
        console.warn(`[ws] Connection attempt to ${targetUrl} failed.`);
      };

      socket.onclose = () => {
        if (isUnmounted) return;
        
        // Calculate retry delay with exponential backoff (2s, 4s, 8s, max 15s)
        const delay = Math.min(15000, Math.pow(2, retryCountRef.current) * 2000);
        console.log(`[ws] Disconnected. Retrying connection in ${(delay / 1000).toFixed(0)}s...`);
        
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (e) {}
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dispatch]);
}

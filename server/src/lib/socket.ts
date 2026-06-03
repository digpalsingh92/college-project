import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

let wss: WebSocketServer | null = null;

export const initWebSocket = (server: HttpServer) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[ws] Client connected to live operations telemetry');

    ws.on('close', () => {
      console.log('[ws] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[ws] WebSocket error:', error);
    });
  });

  console.log('[ws] WebSocket server successfully bound to HTTP server');
};

export const broadcastOccupancyUpdate = (data: { category: string; availableUnits: number; totalUnits: number }) => {
  if (!wss) {
    return;
  }

  const payload = JSON.stringify({
    type: 'OCCUPANCY_CHANGED',
    data,
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

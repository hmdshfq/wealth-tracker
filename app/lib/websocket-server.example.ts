/**
 * Example WebSocket server for real-time portfolio updates
 * Run with: npx ts-node app/lib/websocket-server.example.ts
 * or convert to JS and run with: node app/lib/websocket-server.example.js
 * 
 * For production, consider using:
 * - Socket.io for broader browser support
 * - A proper WebSocket infrastructure (e.g., Pusher, Ably, or AWS API Gateway WebSocket)
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

interface PortfolioUpdate {
  type: 'portfolio_update';
  netWorth: number;
  timestamp: string;
}

// Store connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  clients.add(ws);

  // Send initial portfolio value
  const initialUpdate: PortfolioUpdate = {
    type: 'portfolio_update',
    netWorth: 3200, // Starting value in PLN
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(initialUpdate));

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Simulate portfolio value changes every 5 seconds
let currentNetWorth = 3200;

setInterval(() => {
  // Random fluctuation between -2% and +3%
  const change = currentNetWorth * (Math.random() * 0.05 - 0.02);
  currentNetWorth = Math.max(0, currentNetWorth + change);

  const update: PortfolioUpdate = {
    type: 'portfolio_update',
    netWorth: Math.round(currentNetWorth * 100) / 100,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });

  console.log(`Broadcast: ${JSON.stringify(update)}`);
}, 5000);

console.log(`WebSocket server running on ws://localhost:${PORT}`);

/**
 * Alternative: Using Next.js API Route with Server-Sent Events (SSE)
 * 
 * If you prefer not to run a separate WebSocket server, you can use
 * Server-Sent Events through a Next.js API route:
 * 
 * // app/api/portfolio-stream/route.ts
 * export async function GET() {
 *   const encoder = new TextEncoder();
 *   const stream = new ReadableStream({
 *     start(controller) {
 *       const interval = setInterval(() => {
 *         const data = JSON.stringify({
 *           type: 'portfolio_update',
 *           netWorth: Math.random() * 10000,
 *           timestamp: new Date().toISOString(),
 *         });
 *         controller.enqueue(encoder.encode(`data: ${data}\n\n`));
 *       }, 5000);
 * 
 *       return () => clearInterval(interval);
 *     },
 *   });
 * 
 *   return new Response(stream, {
 *     headers: {
 *       'Content-Type': 'text/event-stream',
 *       'Cache-Control': 'no-cache',
 *       'Connection': 'keep-alive',
 *     },
 *   });
 * }
 */

import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

class NotifierService {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Keep-alive ping every 30s
    const ping = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, 30000);

    this.clients.set(id, { id, res });

    res.on('close', () => {
      clearInterval(ping);
      this.clients.delete(id);
    });
  }

  broadcast(event: string, data: object) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (!client.res.writableEnded) {
        client.res.write(payload);
      }
    }
  }

  get connectedCount() {
    return this.clients.size;
  }
}

export const notifier = new NotifierService();

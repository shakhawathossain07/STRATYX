export class GridEventStream {
  private ws: WebSocket | null = null;
  private handlers: Set<(event: any) => void> = new Set();

  constructor(private seriesId: string) {}

  connect() {
    const apiKey = import.meta.env.VITE_GRID_API_KEY;

    // For demo purposes, we'll mock the connection if the key is missing
    if (!apiKey) {
      console.warn('GRID API Key missing. Simulating event stream.');
      this.simulateEvents();
      return;
    }

    // Official GRID WebSocket endpoint with API key authentication
    const url = `wss://api.grid.gg/series-events/v1/${this.seriesId}?key=${apiKey}`;

    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('Connected to GRID Series Events');
    };

    this.ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      this.handlers.forEach(handler => handler(event));
    };

    this.ws.onclose = () => {
      console.log('Disconnected from GRID Series Events');
      // Attempt reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  onEvent(handler: (event: any) => void) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private simulateEvents() {
    setInterval(() => {
      const mockEvent = {
        type: 'kill',
        timestamp: new Date().toISOString(),
        data: {
          attacker: 'm0NESY',
          victim: 'jL',
          weapon: 'awp',
          isHeadshot: true
        }
      };
      this.handlers.forEach(handler => handler(mockEvent));
    }, 10000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

window.Api = {
  async getOverview() {
    const res = await fetch('/api/overview');
    return res.json();
  },
  async getInspect(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/inspect${query ? `?${query}` : ''}`);
    return res.json();
  },
  async getNotifications() {
    const res = await fetch('/api/notifications');
    return res.json();
  },
  async getDevices(refresh = false) {
    const res = await fetch(`/api/devices${refresh ? '?refresh=1' : ''}`);
    return res.json();
  },
  async clearNotifications() {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    return res.json();
  },
  connectStream(onEvent) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/stream`;
    
    let socket = new WebSocket(wsUrl);
    
    const setup = (ws) => {
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const { event: eventName, data } = JSON.parse(event.data);
          onEvent(eventName, data);
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected, retrying in 2s...');
        setTimeout(() => {
          socket = new WebSocket(wsUrl);
          setup(socket);
        }, 2000);
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error', err);
        ws.close();
      };
    };
    
    setup(socket);
    
    return {
      close: () => {
        socket.onclose = null; // Prevent reconnect
        socket.close();
      }
    };
  }
};

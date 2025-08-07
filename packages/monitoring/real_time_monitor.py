#!/usr/bin/env python3
"""
Real-Time Monitoring Server
Connects to actual orchestration metrics, not mocks
"""

import asyncio
import json
import websockets
import aiofiles
import redis.asyncio as redis
from pathlib import Path
from datetime import datetime
import time
from typing import Dict, Set, Any
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MetricsFileHandler(FileSystemEventHandler):
    """Watch metrics file for changes"""
    
    def __init__(self, server):
        self.server = server
        
    def on_modified(self, event):
        if event.src_path.endswith('metrics.json'):
            asyncio.run_coroutine_threadsafe(
                self.server.broadcast_metrics(),
                self.server.loop
            )

class RealTimeMonitoringServer:
    """WebSocket server for real-time metrics"""
    
    def __init__(self, port: int = 8765):
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.metrics_file = Path.home() / ".claude" / "orchestration" / "metrics.json"
        self.redis_client = None
        self.loop = None
        
    async def start(self):
        """Start the monitoring server"""
        self.loop = asyncio.get_event_loop()
        
        # Connect to Redis for real-time data
        try:
            self.redis_client = await redis.from_url(
                "redis://localhost:6379",
                decode_responses=True
            )
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
        
        # Setup file watcher for metrics.json
        if self.metrics_file.parent.exists():
            observer = Observer()
            observer.schedule(
                MetricsFileHandler(self),
                str(self.metrics_file.parent),
                recursive=False
            )
            observer.start()
            logger.info(f"Watching {self.metrics_file}")
        
        # Start WebSocket server
        async with websockets.serve(self.handler, "localhost", self.port):
            logger.info(f"Monitoring server started on ws://localhost:{self.port}")
            
            # Start metric collection loop
            await asyncio.gather(
                self.collect_metrics_loop(),
                self.redis_subscription_loop(),
                asyncio.Future()  # Keep running
            )
    
    async def handler(self, websocket, path):
        """Handle WebSocket connections"""
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")
        
        try:
            # Send current metrics on connect
            metrics = await self.get_current_metrics()
            await websocket.send(json.dumps(metrics))
            
            # Keep connection alive
            await websocket.wait_closed()
            
        finally:
            self.clients.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.clients)}")
    
    async def get_current_metrics(self) -> Dict[str, Any]:
        """Get current metrics from all sources"""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "source": "real",
            "system": {},
            "agents": {},
            "queues": {},
            "tasks": {}
        }
        
        # Try to read from metrics file
        if self.metrics_file.exists():
            try:
                async with aiofiles.open(self.metrics_file, 'r') as f:
                    file_metrics = json.loads(await f.read())
                    metrics.update(file_metrics)
            except Exception as e:
                logger.error(f"Error reading metrics file: {e}")
        
        # Get Redis metrics if available
        if self.redis_client:
            try:
                # Queue depths
                for queue in ["ui-specialist", "backend-specialist", "quality-lead"]:
                    depth = await self.redis_client.llen(f"queue:{queue}")
                    metrics["queues"][queue] = {
                        "depth": depth,
                        "processing": await self.redis_client.llen(f"processing:{queue}")
                    }
                
                # Task counts
                metrics["tasks"]["completed"] = int(await self.redis_client.get("tasks:completed") or 0)
                metrics["tasks"]["failed"] = int(await self.redis_client.get("tasks:failed") or 0)
                metrics["tasks"]["active"] = int(await self.redis_client.get("tasks:active") or 0)
                
                # Agent health
                agent_keys = await self.redis_client.keys("agent:*:health")
                for key in agent_keys:
                    agent_id = key.split(":")[1]
                    health_data = await self.redis_client.hgetall(key)
                    metrics["agents"][agent_id] = health_data
                    
            except Exception as e:
                logger.error(f"Error getting Redis metrics: {e}")
        
        # System metrics
        try:
            import psutil
            metrics["system"] = {
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "network_io": {
                    "bytes_sent": psutil.net_io_counters().bytes_sent,
                    "bytes_recv": psutil.net_io_counters().bytes_recv
                }
            }
        except ImportError:
            pass
        
        return metrics
    
    async def broadcast_metrics(self):
        """Broadcast metrics to all connected clients"""
        if not self.clients:
            return
            
        metrics = await self.get_current_metrics()
        message = json.dumps(metrics)
        
        # Send to all clients
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.ConnectionClosed:
                disconnected.add(client)
        
        # Remove disconnected clients
        self.clients -= disconnected
    
    async def collect_metrics_loop(self):
        """Periodically collect and broadcast metrics"""
        while True:
            await asyncio.sleep(2)  # Update every 2 seconds
            await self.broadcast_metrics()
    
    async def redis_subscription_loop(self):
        """Subscribe to Redis pub/sub for real-time updates"""
        if not self.redis_client:
            return
            
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe("metrics:update", "agent:status", "task:complete")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    # Immediately broadcast on Redis events
                    await self.broadcast_metrics()
                    
        except Exception as e:
            logger.error(f"Redis subscription error: {e}")

class MonitoringClient:
    """Client library for sending metrics"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis_client = None
        
    async def connect(self):
        """Connect to Redis"""
        self.redis_client = await redis.from_url(self.redis_url)
    
    async def increment_counter(self, key: str, amount: int = 1):
        """Increment a counter metric"""
        if self.redis_client:
            await self.redis_client.incrby(key, amount)
            await self.redis_client.publish("metrics:update", key)
    
    async def set_gauge(self, key: str, value: float):
        """Set a gauge metric"""
        if self.redis_client:
            await self.redis_client.set(key, value)
            await self.redis_client.publish("metrics:update", key)
    
    async def record_timing(self, key: str, duration: float):
        """Record a timing metric"""
        if self.redis_client:
            await self.redis_client.lpush(f"timing:{key}", duration)
            await self.redis_client.ltrim(f"timing:{key}", 0, 999)  # Keep last 1000
            await self.redis_client.publish("metrics:update", key)
    
    async def update_agent_health(self, agent_id: str, health: Dict[str, Any]):
        """Update agent health status"""
        if self.redis_client:
            await self.redis_client.hset(
                f"agent:{agent_id}:health",
                mapping=health
            )
            await self.redis_client.publish("agent:status", agent_id)

# HTML Dashboard that connects to this server
HTML_DASHBOARD = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-Time Orchestration Monitor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
            color: #ffffff;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #00d9ff, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 10px;
            animation: pulse 2s infinite;
        }
        
        .status-connected {
            background: #10b981;
        }
        
        .status-disconnected {
            background: #ef4444;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #00d9ff;
        }
        
        .metric-label {
            color: #a1a1aa;
            margin-top: 5px;
        }
        
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .agent-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .agent-status {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-left: 5px;
        }
        
        .agent-ready { background: #10b981; }
        .agent-busy { background: #f59e0b; }
        .agent-error { background: #ef4444; }
        
        #logContainer {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
        
        .log-entry {
            margin-bottom: 5px;
            opacity: 0;
            animation: fadeIn 0.3s forwards;
        }
        
        @keyframes fadeIn {
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Real-Time Orchestration Monitor</h1>
        <p>WebSocket Status: <span id="status">Connecting...</span><span id="statusIndicator" class="status-indicator status-disconnected"></span></p>
    </div>
    
    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value" id="tasksCompleted">0</div>
            <div class="metric-label">Tasks Completed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="tasksFailed">0</div>
            <div class="metric-label">Tasks Failed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="queueDepth">0</div>
            <div class="metric-label">Total Queue Depth</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="cpuUsage">0%</div>
            <div class="metric-label">CPU Usage</div>
        </div>
    </div>
    
    <h2>Agent Status</h2>
    <div id="agentGrid" class="agent-grid"></div>
    
    <h2>Live Log</h2>
    <div id="logContainer"></div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8765');
        const statusEl = document.getElementById('status');
        const statusIndicator = document.getElementById('statusIndicator');
        const logContainer = document.getElementById('logContainer');
        
        function addLog(message) {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            logContainer.insertBefore(entry, logContainer.firstChild);
            
            // Keep only last 20 entries
            while (logContainer.children.length > 20) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
        
        ws.onopen = () => {
            statusEl.textContent = 'Connected';
            statusIndicator.className = 'status-indicator status-connected';
            addLog('Connected to monitoring server');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Update metrics
            document.getElementById('tasksCompleted').textContent = 
                data.tasks?.completed || 0;
            document.getElementById('tasksFailed').textContent = 
                data.tasks?.failed || 0;
            
            // Calculate total queue depth
            let totalDepth = 0;
            if (data.queues) {
                for (const queue in data.queues) {
                    totalDepth += data.queues[queue].depth || 0;
                }
            }
            document.getElementById('queueDepth').textContent = totalDepth;
            
            // Update CPU usage
            if (data.system?.cpu_percent) {
                document.getElementById('cpuUsage').textContent = 
                    data.system.cpu_percent.toFixed(1) + '%';
            }
            
            // Update agent grid
            const agentGrid = document.getElementById('agentGrid');
            agentGrid.innerHTML = '';
            
            if (data.agents) {
                for (const [agentId, health] of Object.entries(data.agents)) {
                    const card = document.createElement('div');
                    card.className = 'agent-card';
                    
                    const statusClass = health.status === 'ready' ? 'agent-ready' :
                                       health.status === 'busy' ? 'agent-busy' : 'agent-error';
                    
                    card.innerHTML = `
                        <div>${agentId}</div>
                        <span class="agent-status ${statusClass}"></span>
                        <div style="font-size: 0.8em; color: #a1a1aa; margin-top: 5px;">
                            ${health.success_count || 0} / ${health.error_count || 0}
                        </div>
                    `;
                    agentGrid.appendChild(card);
                }
            }
            
            addLog(`Metrics updated (source: ${data.source || 'unknown'})`);
        };
        
        ws.onclose = () => {
            statusEl.textContent = 'Disconnected';
            statusIndicator.className = 'status-indicator status-disconnected';
            addLog('Disconnected from monitoring server');
            
            // Attempt reconnection
            setTimeout(() => location.reload(), 5000);
        };
        
        ws.onerror = (error) => {
            addLog(`WebSocket error: ${error.message || 'Unknown error'}`);
        };
    </script>
</body>
</html>'''

async def main():
    """Run the monitoring server"""
    server = RealTimeMonitoringServer()
    
    # Save dashboard HTML
    dashboard_path = Path("monitoring_dashboard.html")
    with open(dashboard_path, "w") as f:
        f.write(HTML_DASHBOARD)
    
    print(f"📊 Dashboard saved to: {dashboard_path}")
    print(f"🚀 Starting monitoring server on ws://localhost:8765")
    print(f"📡 Open {dashboard_path} in your browser to view real-time metrics")
    
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())
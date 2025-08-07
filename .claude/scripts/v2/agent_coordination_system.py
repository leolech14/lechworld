#!/usr/bin/env python3
"""
Enhanced Agent Coordination System for Ultimate Monorepo
Combines log bus coordination with enhanced security and performance monitoring
"""

import json
import time
import threading
import hashlib
import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class CoordinationMessage:
    """Structured message for agent coordination"""
    topic: str
    agent: str
    task_id: str
    timestamp: str
    message_id: str
    correlation_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    priority: int = 5  # 1=highest, 10=lowest
    ttl: int = 3600   # Time to live in seconds

@dataclass
class AgentStatus:
    """Agent status information"""
    agent_id: str
    status: str  # idle, busy, error, offline
    current_task: Optional[str] = None
    last_heartbeat: Optional[str] = None
    resource_usage: Optional[Dict[str, float]] = None
    capabilities: Optional[List[str]] = None

class LogBusCore:
    """Enhanced log bus with sharding and performance optimization"""
    
    def __init__(self, log_dir: Path):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.locks = {}
        self.subscribers = {}
        self.message_cache = {}
        self.performance_metrics = {}
        self.max_cache_size = 10000
        
        # Create topic directories
        self.topics = [
            'task_assignments', 'task_completions', 'deliverable_ready',
            'blockers', 'dependencies', 'coordination', 'heartbeat',
            'errors', 'performance', 'security_events'
        ]
        
        for topic in self.topics:
            topic_dir = self.log_dir / topic
            topic_dir.mkdir(exist_ok=True)
            self.locks[topic] = threading.RLock()
    
    def publish(self, message: CoordinationMessage) -> bool:
        """Publish message to log bus with performance tracking"""
        start_time = time.time()
        
        try:
            # Validate message
            if not self._validate_message(message):
                logger.error(f"Invalid message: {message}")
                return False
            
            # Determine shard based on agent hash
            shard = self._get_shard(message.agent)
            topic_dir = self.log_dir / message.topic
            
            # Write to appropriate shard
            shard_file = topic_dir / f"{shard}.ndjson"
            
            with self.locks[message.topic]:
                with open(shard_file, 'a', encoding='utf-8') as f:
                    f.write(json.dumps(asdict(message)) + '\n')
            
            # Update cache
            self._update_cache(message)
            
            # Notify subscribers
            self._notify_subscribers(message)
            
            # Record performance metric
            duration = time.time() - start_time
            self._record_performance('publish', duration, message.topic)
            
            logger.debug(f"Published message {message.message_id} to {message.topic}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            return False
    
    def subscribe(self, topic: str, callback_func, agent_id: str = None):
        """Subscribe to topic with optional agent filtering"""
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        
        self.subscribers[topic].append({
            'callback': callback_func,
            'agent_id': agent_id,
            'subscribed_at': datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Agent {agent_id} subscribed to topic {topic}")
    
    def read_messages(self, topic: str, since: Optional[datetime] = None, 
                     agent_filter: Optional[str] = None, limit: int = 100) -> List[CoordinationMessage]:
        """Read messages from topic with filtering"""
        messages = []
        
        if topic not in self.topics:
            logger.warning(f"Unknown topic: {topic}")
            return messages
        
        topic_dir = self.log_dir / topic
        
        try:
            # Read from all shards
            for shard_file in topic_dir.glob("*.ndjson"):
                with open(shard_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            msg_data = json.loads(line.strip())
                            message = CoordinationMessage(**msg_data)
                            
                            # Apply filters
                            if since and datetime.fromisoformat(message.timestamp) < since:
                                continue
                                
                            if agent_filter and message.agent != agent_filter:
                                continue
                            
                            messages.append(message)
                            
                            if len(messages) >= limit:
                                break
                                
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            logger.warning(f"Error parsing message: {e}")
                            continue
                            
                if len(messages) >= limit:
                    break
            
            # Sort by timestamp
            messages.sort(key=lambda x: x.timestamp, reverse=True)
            return messages[:limit]
            
        except Exception as e:
            logger.error(f"Failed to read messages: {e}")
            return []
    
    def get_agent_status(self, agent_id: str) -> Optional[AgentStatus]:
        """Get current agent status from heartbeat messages"""
        heartbeat_messages = self.read_messages('heartbeat', agent_filter=agent_id, limit=1)
        
        if not heartbeat_messages:
            return AgentStatus(agent_id=agent_id, status='offline')
        
        latest = heartbeat_messages[0]
        return AgentStatus(
            agent_id=agent_id,
            status=latest.data.get('status', 'unknown'),
            current_task=latest.data.get('current_task'),
            last_heartbeat=latest.timestamp,
            resource_usage=latest.data.get('resource_usage'),
            capabilities=latest.data.get('capabilities')
        )
    
    def cleanup_expired_messages(self):
        """Remove expired messages based on TTL"""
        cutoff_time = time.time() - 86400  # 24 hours default
        
        for topic in self.topics:
            topic_dir = self.log_dir / topic
            
            for shard_file in topic_dir.glob("*.ndjson"):
                try:
                    # Read non-expired messages
                    valid_messages = []
                    
                    with open(shard_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            try:
                                msg_data = json.loads(line.strip())
                                msg_time = datetime.fromisoformat(msg_data['timestamp']).timestamp()
                                
                                if msg_time > cutoff_time:
                                    valid_messages.append(line.strip())
                                    
                            except (json.JSONDecodeError, KeyError, ValueError):
                                continue
                    
                    # Rewrite file with valid messages
                    with open(shard_file, 'w', encoding='utf-8') as f:
                        for msg in valid_messages:
                            f.write(msg + '\n')
                            
                except Exception as e:
                    logger.error(f"Failed to cleanup {shard_file}: {e}")
    
    def _validate_message(self, message: CoordinationMessage) -> bool:
        """Validate message structure and content"""
        required_fields = ['topic', 'agent', 'task_id', 'timestamp', 'message_id']
        
        for field in required_fields:
            if not getattr(message, field, None):
                return False
        
        # Validate topic
        if message.topic not in self.topics:
            return False
        
        # Validate timestamp format
        try:
            datetime.fromisoformat(message.timestamp)
        except ValueError:
            return False
        
        return True
    
    def _get_shard(self, agent: str) -> str:
        """Get shard identifier for agent"""
        hash_obj = hashlib.md5(agent.encode())
        return hash_obj.hexdigest()[:8]
    
    def _update_cache(self, message: CoordinationMessage):
        """Update message cache for fast lookups"""
        cache_key = f"{message.topic}:{message.agent}"
        
        if cache_key not in self.message_cache:
            self.message_cache[cache_key] = []
        
        self.message_cache[cache_key].append(message)
        
        # Limit cache size
        if len(self.message_cache[cache_key]) > 100:
            self.message_cache[cache_key] = self.message_cache[cache_key][-50:]
    
    def _notify_subscribers(self, message: CoordinationMessage):
        """Notify subscribers of new messages"""
        if message.topic in self.subscribers:
            for subscriber in self.subscribers[message.topic]:
                try:
                    # Check agent filter
                    if (subscriber['agent_id'] and 
                        subscriber['agent_id'] != message.agent):
                        continue
                    
                    # Call subscriber callback
                    subscriber['callback'](message)
                    
                except Exception as e:
                    logger.error(f"Subscriber callback failed: {e}")
    
    def _record_performance(self, operation: str, duration: float, topic: str):
        """Record performance metrics"""
        key = f"{operation}:{topic}"
        
        if key not in self.performance_metrics:
            self.performance_metrics[key] = {
                'count': 0,
                'total_duration': 0.0,
                'avg_duration': 0.0,
                'max_duration': 0.0
            }
        
        metrics = self.performance_metrics[key]
        metrics['count'] += 1
        metrics['total_duration'] += duration
        metrics['avg_duration'] = metrics['total_duration'] / metrics['count']
        metrics['max_duration'] = max(metrics['max_duration'], duration)

class CoordinationManager:
    """Manages agent coordination and dependency resolution"""
    
    def __init__(self, log_bus: LogBusCore):
        self.log_bus = log_bus
        self.dependency_graph = {}
        self.task_registry = {}
        self.coordination_rules = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        self._load_coordination_rules()
    
    def register_task(self, task_id: str, agent: str, dependencies: List[str] = None):
        """Register a new task with dependencies"""
        self.task_registry[task_id] = {
            'agent': agent,
            'status': 'pending',
            'dependencies': dependencies or [],
            'dependents': [],
            'created_at': datetime.now(timezone.utc).isoformat(),
            'started_at': None,
            'completed_at': None
        }
        
        # Update dependency graph
        self._update_dependency_graph(task_id, dependencies or [])
        
        logger.info(f"Registered task {task_id} for agent {agent}")
    
    def check_dependencies(self, task_id: str) -> bool:
        """Check if all dependencies for a task are satisfied"""
        if task_id not in self.task_registry:
            return False
        
        task = self.task_registry[task_id]
        
        for dep_task_id in task['dependencies']:
            if dep_task_id not in self.task_registry:
                logger.warning(f"Unknown dependency: {dep_task_id}")
                return False
            
            dep_task = self.task_registry[dep_task_id]
            if dep_task['status'] != 'completed':
                logger.debug(f"Task {task_id} waiting for dependency {dep_task_id}")
                return False
        
        return True
    
    def resolve_blockers(self, task_id: str) -> List[str]:
        """Identify what's blocking a task"""
        blockers = []
        
        if task_id not in self.task_registry:
            return ['task_not_found']
        
        task = self.task_registry[task_id]
        
        for dep_task_id in task['dependencies']:
            if dep_task_id not in self.task_registry:
                blockers.append(f"missing_dependency:{dep_task_id}")
                continue
            
            dep_task = self.task_registry[dep_task_id]
            if dep_task['status'] == 'failed':
                blockers.append(f"failed_dependency:{dep_task_id}")
            elif dep_task['status'] in ['pending', 'running']:
                blockers.append(f"waiting_for:{dep_task_id}")
        
        # Check resource availability
        agent_status = self.log_bus.get_agent_status(task['agent'])
        if agent_status and agent_status.status == 'busy':
            blockers.append(f"agent_busy:{task['agent']}")
        
        return blockers
    
    def coordinate_parallel_execution(self, task_group: List[str]) -> Dict[str, Any]:
        """Coordinate parallel execution of independent tasks"""
        results = {}
        futures = {}
        
        # Filter tasks that can run in parallel
        runnable_tasks = []
        for task_id in task_group:
            if self.check_dependencies(task_id):
                runnable_tasks.append(task_id)
        
        # Submit tasks to executor
        for task_id in runnable_tasks:
            future = self.executor.submit(self._execute_coordinated_task, task_id)
            futures[future] = task_id
        
        # Collect results
        for future in as_completed(futures, timeout=300):  # 5 minute timeout
            task_id = futures[future]
            try:
                result = future.result()
                results[task_id] = {'status': 'success', 'result': result}
            except Exception as e:
                results[task_id] = {'status': 'error', 'error': str(e)}
                logger.error(f"Task {task_id} failed: {e}")
        
        return results
    
    def optimize_task_assignment(self, available_agents: List[str], 
                                pending_tasks: List[str]) -> Dict[str, str]:
        """Optimize task assignment based on agent capabilities and load"""
        assignments = {}
        agent_loads = {agent: 0 for agent in available_agents}
        
        # Get agent capabilities and current load
        for agent in available_agents:
            status = self.log_bus.get_agent_status(agent)
            if status and status.resource_usage:
                agent_loads[agent] = status.resource_usage.get('cpu', 0)
        
        # Sort tasks by priority (if available in task registry)
        sorted_tasks = sorted(pending_tasks, key=lambda t: self._get_task_priority(t))
        
        # Assign tasks to least loaded compatible agents
        for task_id in sorted_tasks:
            if task_id not in self.task_registry:
                continue
            
            task = self.task_registry[task_id]
            compatible_agents = self._get_compatible_agents(task_id, available_agents)
            
            if compatible_agents:
                # Choose agent with lowest load
                best_agent = min(compatible_agents, key=lambda a: agent_loads[a])
                assignments[task_id] = best_agent
                agent_loads[best_agent] += 1  # Increment predicted load
        
        return assignments
    
    def _load_coordination_rules(self):
        """Load coordination rules from configuration"""
        rules_file = Path(__file__).parent.parent / "config" / "coordination_rules.json"
        
        default_rules = {
            "sequential_patterns": {
                "database_first": ["database-specialist", "backend-specialist", "ui-specialist"],
                "security_validation": ["guardian-enforcer", "*", "quality-lead"]
            },
            "parallel_patterns": {
                "frontend_backend": ["ui-specialist", "backend-specialist"],
                "testing_deployment": ["quality-lead", "devops-specialist"]
            },
            "escalation_rules": {
                "blocked_task_timeout": 300,
                "escalate_to": "orchestrator-prime",
                "max_retries": 3
            }
        }
        
        if rules_file.exists():
            try:
                with open(rules_file, 'r') as f:
                    self.coordination_rules = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load coordination rules: {e}")
                self.coordination_rules = default_rules
        else:
            self.coordination_rules = default_rules
            # Save default rules
            rules_file.parent.mkdir(parents=True, exist_ok=True)
            with open(rules_file, 'w') as f:
                json.dump(default_rules, f, indent=2)
    
    def _update_dependency_graph(self, task_id: str, dependencies: List[str]):
        """Update the task dependency graph"""
        if task_id not in self.dependency_graph:
            self.dependency_graph[task_id] = {'dependencies': set(), 'dependents': set()}
        
        self.dependency_graph[task_id]['dependencies'].update(dependencies)
        
        # Update dependents
        for dep_id in dependencies:
            if dep_id not in self.dependency_graph:
                self.dependency_graph[dep_id] = {'dependencies': set(), 'dependents': set()}
            self.dependency_graph[dep_id]['dependents'].add(task_id)
    
    def _execute_coordinated_task(self, task_id: str) -> Dict[str, Any]:
        """Execute a task with coordination"""
        if task_id not in self.task_registry:
            raise ValueError(f"Unknown task: {task_id}")
        
        task = self.task_registry[task_id]
        task['status'] = 'running'
        task['started_at'] = datetime.now(timezone.utc).isoformat()
        
        # Publish task start message
        start_message = CoordinationMessage(
            topic='coordination',
            agent=task['agent'],
            task_id=task_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            message_id=str(uuid.uuid4()),
            data={'event': 'task_started', 'task_id': task_id}
        )
        
        self.log_bus.publish(start_message)
        
        try:
            # Simulate task execution (in real implementation, this would delegate to actual agent)
            time.sleep(1)  # Simulate work
            
            # Mark as completed
            task['status'] = 'completed'
            task['completed_at'] = datetime.now(timezone.utc).isoformat()
            
            # Publish completion message
            completion_message = CoordinationMessage(
                topic='task_completions',
                agent=task['agent'],
                task_id=task_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                message_id=str(uuid.uuid4()),
                data={'event': 'task_completed', 'task_id': task_id}
            )
            
            self.log_bus.publish(completion_message)
            
            # Notify dependent tasks
            self._notify_dependents(task_id)
            
            return {'success': True, 'task_id': task_id}
            
        except Exception as e:
            task['status'] = 'failed'
            
            # Publish failure message
            failure_message = CoordinationMessage(
                topic='errors',
                agent=task['agent'],
                task_id=task_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                message_id=str(uuid.uuid4()),
                data={'event': 'task_failed', 'task_id': task_id, 'error': str(e)}
            )
            
            self.log_bus.publish(failure_message)
            raise
    
    def _notify_dependents(self, completed_task_id: str):
        """Notify dependent tasks that a dependency is complete"""
        if completed_task_id in self.dependency_graph:
            dependents = self.dependency_graph[completed_task_id]['dependents']
            
            for dependent_task_id in dependents:
                message = CoordinationMessage(
                    topic='dependencies',
                    agent='coordination-manager',
                    task_id=dependent_task_id,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    message_id=str(uuid.uuid4()),
                    data={
                        'event': 'dependency_satisfied',
                        'dependency': completed_task_id,
                        'dependent': dependent_task_id
                    }
                )
                
                self.log_bus.publish(message)
    
    def _get_task_priority(self, task_id: str) -> int:
        """Get task priority (lower number = higher priority)"""
        if task_id in self.task_registry:
            return self.task_registry[task_id].get('priority', 5)
        return 5
    
    def _get_compatible_agents(self, task_id: str, available_agents: List[str]) -> List[str]:
        """Get agents compatible with a task"""
        # Simplified implementation - in real system would check agent capabilities
        if task_id in self.task_registry:
            required_agent = self.task_registry[task_id]['agent']
            if required_agent in available_agents:
                return [required_agent]
        
        return available_agents

class AgentCoordinationService:
    """Main service that orchestrates agent coordination"""
    
    def __init__(self, log_dir: str = "/tmp/dream-team-logs"):
        self.log_bus = LogBusCore(Path(log_dir))
        self.coordination_manager = CoordinationManager(self.log_bus)
        self.running = False
        self.health_status = {'status': 'starting', 'last_check': None}
    
    def start(self):
        """Start the coordination service"""
        logger.info("Starting Agent Coordination Service")
        self.running = True
        
        # Start background tasks
        threading.Thread(target=self._heartbeat_monitor, daemon=True).start()
        threading.Thread(target=self._cleanup_task, daemon=True).start()
        threading.Thread(target=self._health_check, daemon=True).start()
        
        self.health_status['status'] = 'running'
        logger.info("Agent Coordination Service started successfully")
    
    def stop(self):
        """Stop the coordination service"""
        logger.info("Stopping Agent Coordination Service")
        self.running = False
        self.coordination_manager.executor.shutdown(wait=True)
        self.health_status['status'] = 'stopped'
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get service health status"""
        return {
            **self.health_status,
            'log_bus_metrics': self.log_bus.performance_metrics,
            'active_tasks': len([t for t in self.coordination_manager.task_registry.values() 
                               if t['status'] in ['pending', 'running']]),
            'total_tasks': len(self.coordination_manager.task_registry)
        }
    
    def _heartbeat_monitor(self):
        """Monitor agent heartbeats"""
        while self.running:
            try:
                # Check for stale agents
                heartbeat_messages = self.log_bus.read_messages('heartbeat', limit=100)
                
                current_time = time.time()
                stale_agents = []
                
                for message in heartbeat_messages:
                    msg_time = datetime.fromisoformat(message.timestamp).timestamp()
                    if current_time - msg_time > 300:  # 5 minutes
                        stale_agents.append(message.agent)
                
                if stale_agents:
                    logger.warning(f"Stale agents detected: {stale_agents}")
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Heartbeat monitor error: {e}")
                time.sleep(60)
    
    def _cleanup_task(self):
        """Periodic cleanup of old messages"""
        while self.running:
            try:
                self.log_bus.cleanup_expired_messages()
                time.sleep(3600)  # Cleanup every hour
                
            except Exception as e:
                logger.error(f"Cleanup task error: {e}")
                time.sleep(3600)
    
    def _health_check(self):
        """Periodic health check"""
        while self.running:
            try:
                self.health_status['last_check'] = datetime.now(timezone.utc).isoformat()
                
                # Check log bus health
                test_message = CoordinationMessage(
                    topic='heartbeat',
                    agent='coordination-service',
                    task_id='health-check',
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    message_id=str(uuid.uuid4()),
                    data={'status': 'healthy'}
                )
                
                if self.log_bus.publish(test_message):
                    self.health_status['status'] = 'healthy'
                else:
                    self.health_status['status'] = 'degraded'
                
                time.sleep(30)  # Health check every 30 seconds
                
            except Exception as e:
                logger.error(f"Health check error: {e}")
                self.health_status['status'] = 'error'
                time.sleep(30)

def main():
    """Main entry point for the coordination service"""
    service = AgentCoordinationService()
    
    try:
        service.start()
        
        # Keep service running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Shutdown requested")
    finally:
        service.stop()

if __name__ == "__main__":
    main()
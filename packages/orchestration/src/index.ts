/**
 * Orchestration package - Circuit breaker and task coordination utilities
 * 
 * This package provides TypeScript interfaces for task orchestration
 * while the core logic remains in Python for performance.
 */

import CircuitBreaker from 'opossum';
import { createClient } from 'redis';
import * as amqp from 'amqplib';

export interface TaskConfig {
  id: string;
  type: string;
  timeout?: number;
  retries?: number;
  priority?: number;
}

export interface OrchestrationConfig {
  redis: {
    url: string;
  };
  rabbitmq: {
    url: string;
  };
  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };
}

/**
 * Circuit breaker utility for protecting external service calls
 */
export class ServiceCircuitBreaker {
  private breaker: CircuitBreaker;

  constructor(serviceCall: (...args: unknown[]) => Promise<unknown>, options?: CircuitBreaker.Options) {
    const defaultOptions: CircuitBreaker.Options = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      ...options
    };

    this.breaker = new CircuitBreaker(serviceCall, defaultOptions);
    
    // Event listeners for monitoring
    this.breaker.on('open', () => console.log('Circuit breaker opened'));
    this.breaker.on('halfOpen', () => console.log('Circuit breaker half-opened'));
    this.breaker.on('close', () => console.log('Circuit breaker closed'));
  }

  async execute(...args: any[]): Promise<any> {
    return this.breaker.fire(...args);
  }

  get stats() {
    return this.breaker.stats;
  }

  get state() {
    return this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED';
  }
}

/**
 * Task orchestration client - interfaces with Python orchestrator
 */
export class OrchestrationClient {
  private redis: ReturnType<typeof createClient>;
  private config: OrchestrationConfig;

  constructor(config: OrchestrationConfig) {
    this.config = config;
    this.redis = createClient({ url: config.redis.url });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  async submitTask(task: TaskConfig): Promise<string> {
    const taskId = `task:${task.id}:${Date.now()}`;
    await this.redis.hSet(taskId, {
      ...task,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Notify Python orchestrator via Redis pub/sub
    await this.redis.publish('task:new', taskId);
    
    return taskId;
  }

  async getTaskStatus(taskId: string): Promise<Record<string, string> | null> {
    return this.redis.hGetAll(taskId);
  }

  async waitForTask(taskId: string, timeout = 30000): Promise<Record<string, string> | null> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const status = await this.getTaskStatus(taskId);
      if (status && status.status !== 'pending') {
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return null; // Timeout
  }
}

export default {
  ServiceCircuitBreaker,
  OrchestrationClient
};
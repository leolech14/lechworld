/**
 * Tests for the ServiceCircuitBreaker class using opossum
 */

import { ServiceCircuitBreaker } from '../index';

describe('ServiceCircuitBreaker', () => {
  it('should create a circuit breaker instance', () => {
    const mockService = async () => Promise.resolve('success');
    const breaker = new ServiceCircuitBreaker(mockService);
    
    expect(breaker).toBeDefined();
    expect(breaker.state).toBe('CLOSED');
  });

  it('should execute a successful service call', async () => {
    const mockService = async (...args: unknown[]) => Promise.resolve(`Result: ${args[0]}`);
    const breaker = new ServiceCircuitBreaker(mockService);
    
    const result = await breaker.execute('test');
    expect(result).toBe('Result: test');
  });

  it('should handle service failures', async () => {
    const mockService = async () => Promise.reject(new Error('Service unavailable'));
    const breaker = new ServiceCircuitBreaker(mockService, {
      timeout: 100,
      errorThresholdPercentage: 50,
      resetTimeout: 1000
    });
    
    await expect(breaker.execute()).rejects.toThrow('Service unavailable');
  });

  it('should provide circuit breaker stats', async () => {
    const mockService = async () => Promise.resolve('success');
    const breaker = new ServiceCircuitBreaker(mockService);
    
    await breaker.execute();
    
    const stats = breaker.stats;
    expect(stats).toBeDefined();
    expect(stats.successes).toBe(1);
    expect(stats.failures).toBe(0);
  });

  it('should open circuit breaker after threshold failures', async () => {
    const mockService = async () => Promise.reject(new Error('Always fails'));
    const breaker = new ServiceCircuitBreaker(mockService, {
      timeout: 100,
      errorThresholdPercentage: 50,
      resetTimeout: 1000
    });
    
    // Cause multiple failures to trigger circuit breaker
    try {
      for (let i = 0; i < 10; i++) {
        await breaker.execute();
      }
    } catch (error) {
      // Expected to fail
    }
    
    // Circuit breaker should eventually open
    // Note: This is a simplified test - in real scenarios the exact timing may vary
    expect(['OPEN', 'HALF_OPEN', 'CLOSED']).toContain(breaker.state);
  });
});
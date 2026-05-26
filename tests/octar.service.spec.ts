import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OCTAR_CLIENT } from '../src/constants.js';
import { OctarService } from '../src/octar.service.js';

function makeMockClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue({ msgId: 'msg-1', offset: 0n }),
    subscribe: vi.fn().mockResolvedValue({ stop: vi.fn() }),
    isConnected: false,
    on: vi.fn(),
  };
}

describe('OctarService', () => {
  let service: OctarService;
  let mockClient: ReturnType<typeof makeMockClient>;
  let module: TestingModule;

  beforeEach(async () => {
    mockClient = makeMockClient();

    module = await Test.createTestingModule({
      providers: [OctarService, { provide: OCTAR_CLIENT, useValue: mockClient }],
    }).compile();

    service = module.get(OctarService);
  });

  it('calls client.connect() on onModuleInit', async () => {
    await service.onModuleInit();
    expect(mockClient.connect).toHaveBeenCalledOnce();
  });

  it('does not call connect again if already connected', async () => {
    mockClient.isConnected = true;
    await service.onModuleInit();
    expect(mockClient.connect).not.toHaveBeenCalled();
  });

  it('calls client.close() on onModuleDestroy', async () => {
    await service.onModuleDestroy();
    expect(mockClient.close).toHaveBeenCalledOnce();
  });

  it('delegates publish to client', async () => {
    const result = await service.publish('orders', 'g1', { orderId: 1 });
    expect(mockClient.publish).toHaveBeenCalledWith('orders', 'g1', { orderId: 1 });
    expect(result).toEqual({ msgId: 'msg-1', offset: 0n });
  });

  it('delegates subscribe to client', async () => {
    const handler = vi.fn();
    await service.subscribe('orders', 'g1', handler);
    expect(mockClient.subscribe).toHaveBeenCalledWith('orders', 'g1', handler);
  });

  it('exposes the underlying client via getClient()', () => {
    expect(service.getClient()).toBe(mockClient);
  });
});

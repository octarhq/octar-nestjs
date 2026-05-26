import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { OctarClient } from '@octar/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OCTAR_CLIENT } from '../src/constants.js';
import { Subscribe } from '../src/decorators/subscribe.decorator.js';
import { OctarExplorer } from '../src/octar.explorer.js';

@Injectable()
class OrdersConsumer {
  @Subscribe('orders', 'g1')
  async handleOrder(msg: unknown): Promise<void> {
    void msg;
  }

  regularMethod(): void {}
}

describe('OctarExplorer', () => {
  let module: TestingModule;
  let mockClient: {
    subscribe: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    isConnected: boolean;
    on: ReturnType<typeof vi.fn>;
  };
  let ordersConsumer: OrdersConsumer;
  let mockDiscoveryService: { getProviders: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    ordersConsumer = new OrdersConsumer();

    mockClient = {
      subscribe: vi.fn().mockResolvedValue({ stop: vi.fn() }),
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isConnected: true,
      on: vi.fn(),
    };

    // Provide a mock DiscoveryService that returns our consumer instance.
    // We do NOT import DiscoveryModule so NestJS cannot re-register the real service.
    mockDiscoveryService = {
      getProviders: vi.fn().mockReturnValue([
        { instance: ordersConsumer, name: 'OrdersConsumer' },
        { instance: null, name: 'NullProvider' },
        { instance: 'string-instance', name: 'StringProvider' },
      ]),
    };

    module = await Test.createTestingModule({
      providers: [
        OrdersConsumer,
        OctarExplorer,
        MetadataScanner,
        { provide: DiscoveryService, useValue: mockDiscoveryService },
        { provide: OCTAR_CLIENT, useValue: mockClient },
        { provide: OctarClient, useValue: mockClient },
      ],
    }).compile();

    // init() triggers onApplicationBootstrap which calls explore()
    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  it('discovers @Subscribe methods and calls client.subscribe', async () => {
    await new Promise((r) => setTimeout(r, 100));
    expect(mockClient.subscribe).toHaveBeenCalledWith('orders', 'g1', expect.any(Function));
  });

  it('does not subscribe regular methods without the decorator', async () => {
    await new Promise((r) => setTimeout(r, 100));
    // Only handleOrder is decorated; regularMethod should not be subscribed
    expect(mockClient.subscribe).toHaveBeenCalledTimes(1);
  });
});

import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';
import { OctarClient } from '@octar/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OCTAR_CLIENT } from '../src/constants.js';
import { OctarModule } from '../src/octar.module.js';
import { OctarService } from '../src/octar.service.js';

// Mock @octar/client
vi.mock('@octar/client', () => {
  const MockOctarClient = vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue({ msgId: 'mock-id', offset: 0n }),
    subscribe: vi.fn().mockResolvedValue(undefined),
    isConnected: false,
    on: vi.fn(),
    emit: vi.fn(),
    poolStats: null,
  }));
  return { OctarClient: MockOctarClient };
});

const moduleOptions = {
  host: 'localhost',
  port: 7000,
  namespace: 'test',
  auth: { username: 'admin', password: 'admin' },
};

describe('OctarModule.forRoot', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [OctarModule.forRoot(moduleOptions)],
    }).compile();

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides OctarService', () => {
    const service = module.get(OctarService);
    expect(service).toBeDefined();
  });

  it('provides OCTAR_CLIENT token', () => {
    const client = module.get(OCTAR_CLIENT);
    expect(client).toBeDefined();
  });

  it('creates OctarClient with given options', () => {
    expect(OctarClient).toHaveBeenCalledWith(moduleOptions);
  });
});

describe('OctarModule.forRootAsync with useFactory', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        OctarModule.forRootAsync({
          useFactory: () => moduleOptions,
        }),
      ],
    }).compile();

    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  it('provides OctarService', () => {
    const service = module.get(OctarService);
    expect(service).toBeDefined();
  });

  it('provides OCTAR_CLIENT token', () => {
    const client = module.get(OCTAR_CLIENT);
    expect(client).toBeDefined();
  });
});

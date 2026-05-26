/**
 * OctarService wraps OctarClient and integrates with NestJS lifecycle hooks.
 */

import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { OctarClient, OctarMessage, PublishResult } from '@octar/client';
import { OCTAR_CLIENT } from './constants.js';

@Injectable()
export class OctarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OctarService.name);

  constructor(@Inject(OCTAR_CLIENT) private readonly client: OctarClient) {}

  async onModuleInit(): Promise<void> {
    if (!this.client.isConnected) {
      await this.client.connect();
      this.logger.log('Connected to OCTAR broker');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
    this.logger.log('Disconnected from OCTAR broker');
  }

  /**
   * Publish a message to a queue.
   *
   * @param queue   - Target queue name
   * @param group   - Consumer group name
   * @param payload - Message payload: Buffer, string, or JSON-serializable object
   */
  async publish(
    queue: string,
    group: string,
    payload: Buffer | string | object,
  ): Promise<PublishResult> {
    return this.client.publish(queue, group, payload);
  }

  /**
   * Subscribe to a queue. Prefer using the @Subscribe() decorator for
   * declarative consumers; use this for programmatic subscriptions.
   */
  async subscribe(
    queue: string,
    group: string,
    handler: (msg: OctarMessage) => Promise<void> | void,
  ): Promise<void> {
    await this.client.subscribe(queue, group, handler);
  }

  /** Expose the underlying OctarClient for advanced use. */
  getClient(): OctarClient {
    return this.client;
  }
}

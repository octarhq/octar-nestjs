/**
 * OctarExplorer scans all injectable providers for methods decorated with
 * @Subscribe() and registers them as OCTAR subscribers on application boot.
 */

import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
// biome-ignore lint/style/useImportType: DiscoveryService/MetadataScanner emitted as values by emitDecoratorMetadata
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
// biome-ignore lint/style/useImportType: OctarClient emitted as value by emitDecoratorMetadata (design:paramtypes)
import { OctarClient } from '@octar/client';
import { OCTAR_SUBSCRIBE_METADATA } from './constants.js';
import type { SubscribeMetadata } from './decorators/subscribe.decorator.js';

/**
 * OctarExplorer is registered in OctarModule and auto-discovers all methods
 * decorated with @Subscribe() across the application. It relies on NestJS
 * emitDecoratorMetadata to resolve DiscoveryService, MetadataScanner, and
 * OctarClient by their class types (registered as aliases in the module).
 */
@Injectable()
export class OctarExplorer implements OnApplicationBootstrap {
  private readonly logger = new Logger(OctarExplorer.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly client: OctarClient,
  ) {}

  onApplicationBootstrap(): void {
    this.explore();
  }

  private explore(): void {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const proto = Object.getPrototypeOf(instance) as object;
      const methodNames = this.metadataScanner.getAllMethodNames(proto);

      for (const methodName of methodNames) {
        const metadata: SubscribeMetadata | undefined = Reflect.getMetadata(
          OCTAR_SUBSCRIBE_METADATA,
          proto,
          methodName,
        );

        if (!metadata) continue;

        const { queue, group } = metadata;
        const handler = (instance as Record<string, unknown>)[methodName];

        if (typeof handler !== 'function') continue;

        const boundHandler = (handler as (...args: unknown[]) => unknown).bind(instance);

        this.client
          .subscribe(queue, group, boundHandler as (msg: unknown) => Promise<void>)
          .then(() => {
            this.logger.log(
              `Registered subscriber: ${wrapper.name ?? 'unknown'}.${methodName} → queue="${queue}" group="${group}"`,
            );
          })
          .catch((err: Error) => {
            this.logger.error(
              `Failed to register subscriber ${wrapper.name ?? 'unknown'}.${methodName}: ${err.message}`,
            );
          });
      }
    }
  }
}

/**
 * OctarModule - NestJS dynamic module for OCTAR integration.
 *
 * Usage:
 *   OctarModule.forRoot({ host, port, namespace, auth })
 *   OctarModule.forRootAsync({ useFactory: async (cfg) => ({ ... }), inject: [ConfigService] })
 */

import type { DynamicModule, Provider, Type } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { DiscoveryModule, MetadataScanner } from '@nestjs/core';
import { OctarClient } from '@octar/client';
import { OCTAR_CLIENT, OCTAR_MODULE_OPTIONS } from './constants.js';
import type {
  OctarModuleAsyncOptions,
  OctarModuleOptions,
  OctarOptionsFactory,
} from './interfaces/module-options.interface.js';
import { OctarExplorer } from './octar.explorer.js';
import { OctarService } from './octar.service.js';

@Module({})
export class OctarModule {
  /**
   * Synchronous configuration.
   */
  static forRoot(options: OctarModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: OCTAR_MODULE_OPTIONS,
      useValue: options,
    };

    const clientProvider: Provider = {
      provide: OCTAR_CLIENT,
      useFactory: (opts: OctarModuleOptions) => {
        return new OctarClient(opts);
      },
      inject: [OCTAR_MODULE_OPTIONS],
    };

    // Alias so OctarExplorer can resolve by class type (emitDecoratorMetadata)
    const clientClassAlias: Provider = {
      provide: OctarClient,
      useExisting: OCTAR_CLIENT,
    };

    return {
      module: OctarModule,
      imports: [DiscoveryModule],
      providers: [
        optionsProvider,
        clientProvider,
        clientClassAlias,
        OctarService,
        OctarExplorer,
        MetadataScanner,
      ],
      exports: [OCTAR_CLIENT, OctarClient, OctarService],
      global: true,
    };
  }

  /**
   * Async configuration — supports useFactory, useClass, useExisting.
   */
  static forRootAsync(options: OctarModuleAsyncOptions): DynamicModule {
    const clientProvider: Provider = {
      provide: OCTAR_CLIENT,
      useFactory: (opts: OctarModuleOptions) => new OctarClient(opts),
      inject: [OCTAR_MODULE_OPTIONS],
    };

    const asyncProviders = OctarModule.createAsyncProviders(options);

    const clientClassAlias: Provider = {
      provide: OctarClient,
      useExisting: OCTAR_CLIENT,
    };

    return {
      module: OctarModule,
      imports: [...(options.imports ?? []), DiscoveryModule],
      providers: [
        ...asyncProviders,
        clientProvider,
        clientClassAlias,
        OctarService,
        OctarExplorer,
        MetadataScanner,
      ],
      exports: [OCTAR_CLIENT, OctarClient, OctarService],
      global: true,
    };
  }

  private static createAsyncProviders(options: OctarModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: OCTAR_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: (options.inject ?? []) as (string | symbol | Type<unknown>)[],
        },
      ];
    }

    const useClass = options.useClass ?? options.useExisting;
    if (!useClass) {
      throw new Error('OctarModule.forRootAsync requires useFactory, useClass, or useExisting');
    }

    const providers: Provider[] = [
      {
        provide: OCTAR_MODULE_OPTIONS,
        useFactory: async (factory: OctarOptionsFactory) => factory.createOctarOptions(),
        inject: [useClass],
      },
    ];

    if (options.useClass) {
      providers.push({ provide: useClass, useClass });
    }

    return providers;
  }
}

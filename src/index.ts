// Module
export { OctarModule } from './octar.module.js';

// Service
export { OctarService } from './octar.service.js';

// Explorer
export { OctarExplorer } from './octar.explorer.js';

// Decorators
export { InjectOctarClient } from './decorators/inject-client.decorator.js';
export { Subscribe } from './decorators/subscribe.decorator.js';
export type { SubscribeMetadata } from './decorators/subscribe.decorator.js';

// Interfaces
export type {
  OctarModuleOptions,
  OctarModuleAsyncOptions,
  OctarOptionsFactory,
} from './interfaces/module-options.interface.js';

// Constants
export { OCTAR_CLIENT, OCTAR_MODULE_OPTIONS, OCTAR_SUBSCRIBE_METADATA } from './constants.js';

// Re-export useful types from @octar/client
export type { OctarMessage, PublishResult } from '@octar/client';
export { OctarClient } from '@octar/client';

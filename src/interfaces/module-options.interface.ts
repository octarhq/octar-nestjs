import type { ModuleMetadata, Type } from '@nestjs/common';
import type { OctarClientOptions } from '@octar/client';

export type OctarModuleOptions = OctarClientOptions;

export interface OctarOptionsFactory {
  createOctarOptions(): Promise<OctarModuleOptions> | OctarModuleOptions;
}

export interface OctarModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<OctarOptionsFactory>;
  useClass?: Type<OctarOptionsFactory>;
  useFactory?: (...args: unknown[]) => Promise<OctarModuleOptions> | OctarModuleOptions;
  inject?: (string | symbol | Type<unknown>)[];
}

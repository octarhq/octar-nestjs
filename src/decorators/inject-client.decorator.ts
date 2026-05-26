import { Inject } from '@nestjs/common';
import { OCTAR_CLIENT } from '../constants.js';

/**
 * Inject the raw OctarClient instance.
 *
 * @example
 * constructor(@InjectOctarClient() private readonly client: OctarClient) {}
 */
export const InjectOctarClient = (): ParameterDecorator => Inject(OCTAR_CLIENT);

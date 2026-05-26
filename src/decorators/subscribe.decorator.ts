import { OCTAR_SUBSCRIBE_METADATA } from '../constants.js';

export interface SubscribeMetadata {
  queue: string;
  group: string;
}

/**
 * Marks a method as an OCTAR message handler.
 * The method will be auto-registered by OctarExplorer during application boot.
 *
 * Return void/Promise<void> for ACK; throw an Error for NACK.
 *
 * @example
 * @Subscribe('orders', 'group-1')
 * async handleOrder(msg: OctarMessage) {
 *   await processOrder(msg.payload);
 * }
 */
export function Subscribe(queue: string, group: string) {
  return (target: object, propertyKey: string | symbol): void => {
    const metadata: SubscribeMetadata = { queue, group };
    Reflect.defineMetadata(OCTAR_SUBSCRIBE_METADATA, metadata, target, propertyKey);
  };
}

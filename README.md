# @octar/nestjs

NestJS integration module for the [OCTAR](https://github.com/octarhq/octar) message broker.

## Requirements

- Node.js >= 22.0.0
- NestJS >= 10
- pnpm >= 9

## Installation

```bash
pnpm add @octar/nestjs @octar/client
```

## Quick Start

### 1. Import OctarModule

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { OctarModule } from '@octar/nestjs';

@Module({
  imports: [
    OctarModule.forRoot({
      host: 'localhost',
      port: 7000,
      namespace: 'main',
      auth: { username: 'admin', password: 'admin' },
    }),
  ],
})
export class AppModule {}
```

### 2. Declare a Consumer

```typescript
// orders.consumer.ts
import { Injectable } from '@nestjs/common';
import { Subscribe } from '@octar/nestjs';
import type { OctarMessage } from '@octar/nestjs';

@Injectable()
export class OrdersConsumer {
  @Subscribe('orders', 'group-1')
  async handleOrder(msg: OctarMessage): Promise<void> {
    console.log('Received:', msg.payload);
    // returning void = automatic ACK
    // throwing Error = automatic NACK
  }
}
```

#### Wildcard consumers

Use glob patterns to consume multiple groups with a single handler:

```typescript
@Injectable()
export class TenantConsumer {
  // Receive messages from every group whose name starts with "tenant-"
  @Subscribe('orders', 'tenant-*')
  async handleTenantOrder(msg: OctarMessage): Promise<void> {
    // msg.group is the actual group, e.g. "tenant-42" — never the pattern
    const tenantId = msg.group.replace('tenant-', '');
    console.log(`Order for tenant ${tenantId}:`, msg.payload);
  }

  // Catch-all: handle any group not covered by a more specific subscriber
  @Subscribe('orders', '*')
  async handleAnyGroup(msg: OctarMessage): Promise<void> {
    console.log(`Group ${msg.group}:`, msg.payload);
  }
}
```

Supported patterns:

| Pattern | Matches |
|---|---|
| `*` | Every group in the queue |
| `tenant-*` | Any group starting with `tenant-` |
| `*-prod` | Any group ending with `-prod` |
| `region/*-east` | `region/us-east`, `region/eu-east`, … |
| `group-?` | `group-1`, `group-a` — exactly one extra character |

> **Priority** — exact subscribers always take precedence over wildcard ones.
> Declare `@Subscribe('orders', 'vip-tenant', ...)` alongside `@Subscribe('orders', 'tenant-*', ...)`
> and VIP messages will always go to the exact handler.

```typescript
// orders.module.ts
import { Module } from '@nestjs/common';
import { OrdersConsumer } from './orders.consumer.js';

@Module({ providers: [OrdersConsumer] })
export class OrdersModule {}
```

### 3. Publish Messages

```typescript
// orders.service.ts
import { Injectable } from '@nestjs/common';
import { OctarService } from '@octar/nestjs';

@Injectable()
export class OrdersService {
  constructor(private readonly octar: OctarService) {}

  async createOrder(data: object) {
    return this.octar.publish('orders', 'group-1', data);
  }
}
```

## Async Configuration (with ConfigService)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OctarModule } from '@octar/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OctarModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        host: config.get<string>('OCTAR_HOST', 'localhost'),
        port: config.get<number>('OCTAR_PORT', 7000),
        namespace: config.get<string>('OCTAR_NAMESPACE', 'main'),
        auth: {
          username: config.get<string>('OCTAR_USER', 'admin'),
          password: config.get<string>('OCTAR_PASS', ''),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Authentication Options

```typescript
// Username + password
OctarModule.forRoot({ ..., auth: { username: 'admin', password: 'secret' } });

// API Key
OctarModule.forRoot({ ..., auth: { apiKey: 'my-api-key' } });

// Bearer token
OctarModule.forRoot({ ..., auth: { token: 'jwt-token' } });
```

## Inject the Raw Client

For advanced use cases, inject the raw `OctarClient`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectOctarClient } from '@octar/nestjs';
import { OctarClient } from '@octar/client';

@Injectable()
export class AdvancedService {
  constructor(@InjectOctarClient() private readonly client: OctarClient) {}

  async doSomethingAdvanced() {
    console.log(this.client.poolStats);
  }
}
```

## Module Options

All options from `@octar/client` are supported:

| Option | Type | Default | Description |
|---|---|---|---|
| `host` | `string` | required | Broker hostname |
| `port` | `number` | `7000` | Broker TCP port |
| `namespace` | `string` | required | Namespace / virtual host |
| `auth` | `AuthOptions` | required | Authentication credentials |
| `minConnections` | `number` | `1` | Min publish connections in pool |
| `maxConnections` | `number` | `5` | Max publish connections in pool |
| `acquireTimeout` | `number` | `5000` | Pool acquire timeout (ms) |
| `connectTimeout` | `number` | `5000` | TCP connect timeout (ms) |
| `heartbeatInterval` | `number` | `30000` | Heartbeat interval (ms) |

## OctarMessage Shape

```typescript
interface OctarMessage {
  msgId: string;       // Unique message ID
  queue: string;       // Queue name
  group: string;       // Consumer group
  payload: unknown;    // Parsed JSON or raw string
  rawPayload: Buffer;  // Raw bytes
  attempts: number;    // Delivery attempt count (for retry logic)
}
```

## Error Handling in Consumers

```typescript
@Subscribe('orders', 'group-1')
async handleOrder(msg: OctarMessage): Promise<void> {
  if (msg.attempts > 5) {
    // Move to dead letter or ignore — but don't throw to stop redelivery
    this.logger.error('Max retries exceeded, dropping message', msg.msgId);
    return; // ACK — message will not be redelivered
  }

  try {
    await this.processOrder(msg.payload);
  } catch (err) {
    // Throwing causes NACK — broker will redeliver
    throw err;
  }
}
```

## License

MIT

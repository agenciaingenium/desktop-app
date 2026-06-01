import * as ReconnectingWebSocket from 'reconnecting-websocket';

export interface ReconnectOptions {
  [key: string]: any;
  maxReconnectionDelay?: number;
  minReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  debug?: boolean;
}

export default class WebSocketClient {
  static from(url: string, protocols?: string | string[], options: ReconnectOptions = {
    maxRetries: 10,
  }): ReconnectingWebSocket {
    // @ts-ignore - constructor typing mismatch
    return new ReconnectingWebSocket(url, protocols, options) as ReconnectingWebSocket;
  }
}

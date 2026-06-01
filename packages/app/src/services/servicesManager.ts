import { map } from 'ramda';
import { firstConnectionHandler } from '../utils/stream-ipc-proxy';
import { servicesDuplexWorkerMainNamespace } from './api/const';
import { LazyDuplex } from './api/lazyduplex';
import { observeNewClients } from './common';
import { ServiceBase, ServicePeerHandler } from './lib/class';
import { GlobalServices, ServicesInitializerImpl, ServicesInitializerNode } from './types';

function mapObject<T>(initializer: ServicesInitializerImpl<T>): T;
function mapObject<T>(initializer: ServicesInitializerNode<T>, handler: any): T;
function mapObject(...args: any[]): any {
  const services: GlobalServices = {} as GlobalServices;
  const [initializer, handler] = args;
  for (const key of Object.keys(initializer)) {
    // @ts-ignore
    services[key] = handler ? initializer[key](handler) : initializer[key]();
  }
  return services;
}

class ServicesManager {
  protected handlers: Set<ServicePeerHandler>;

  constructor() {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] ServicesManager: Constructor called');
    this.handlers = new Set();
  }

  getServices(): GlobalServices {
    if (process.type === 'renderer') {
      return process.worker ? this.initWorker() : this.initRenderer();
    }
    return this.initMain();
  }

  debug() {
    this.handlers.forEach(h => h.debug && h.debug.dump());
  }

  connect(s: ServiceBase, constructor?: any) {
    for (const handler of Array.from(this.handlers)) {
      handler.connect(s, constructor);
    }
  }

  protected initWorker(): GlobalServices {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] ServicesManager: initWorker called');
    const { getMainPeerHandler, mainServices, workerServices } = require('./worker');

    // connections to the main process
    const mainPeerHandler = getMainPeerHandler();
    this.handlers.add(mainPeerHandler);
    mainPeerHandler.on('close', () => this.handlers.delete(mainPeerHandler));
    const mainServicesConnected = mapObject(mainServices, mainPeerHandler);

    // impl
    const workerServicesConnected = mapObject(workerServices);
    observeNewClients().subscribe((client: any) => {
      this.handlers.add(client);
      client.on('close', () => this.handlers.delete(client));
      map(s => client.connect(s), workerServicesConnected as any);
    });

    return {
      ...mainServicesConnected as GlobalServices,
      ...workerServicesConnected as GlobalServices,
    } as GlobalServices;
  }

  protected initRenderer(): GlobalServices {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] ServicesManager: initRenderer called');
    const { workerServices, mainServices, getMainPeerHandler, getWorkerPeerHandler } = require('./renderer');
    const mainPeerHandler = getMainPeerHandler();
    const workerPeerHandler = getWorkerPeerHandler();

    this.handlers.add(mainPeerHandler);
    this.handlers.add(workerPeerHandler);

    const mainServicesConnected = mapObject(mainServices, mainPeerHandler);
    const workerServicesConnected = mapObject(workerServices, workerPeerHandler);

    return {
      ...mainServicesConnected as GlobalServices,
      ...workerServicesConnected as GlobalServices,
    } as GlobalServices;
  }

  protected initMain(): GlobalServices {
    const mainWorkerDuplex = new LazyDuplex();
    const { getWorkerPeerHandler, mainServices, workerServices } = require('./main');

    // connections to the worker process
    const handler = getWorkerPeerHandler(mainWorkerDuplex);
    this.handlers.add(handler);
    handler.on('close', () => this.handlers.delete(handler));
    const workerServicesConnected = mapObject(workerServices, handler);

    // Lazy connection between the worker and main process
    firstConnectionHandler(duplex => {
      mainWorkerDuplex.connect(duplex);
    }, servicesDuplexWorkerMainNamespace);

    // impl
    const mainServicesConnected = mapObject(mainServices);
    map(s => handler.connect(s), mainServicesConnected as any);
    observeNewClients().subscribe((client: any) => {
      this.handlers.add(client);
      client.on('close', () => this.handlers.delete(client));
      map(s => client.connect(s), mainServicesConnected as any);
    });

    return {
      ...workerServicesConnected as GlobalServices,
      ...mainServicesConnected as GlobalServices,
    } as GlobalServices;
  }
}

export const servicesManager = new ServicesManager();

export default servicesManager.getServices();

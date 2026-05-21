/**
 * IPC-based Redux synchronization between renderer and worker.
 *
 * Replaces shared-redux + stream-ipc-proxy Duplex stream transport.
 * Uses simple Electron IPC channels for action forwarding and state sync,
 * compatible with nodeIntegration: false and target: 'web'.
 */
import { Middleware } from 'redux';

const transit = require('transit-immutable-js');

// IPC channel names
export const IPC_REDUX_GET_INITIAL_STATE = 'station:redux-get-initial-state';
export const IPC_REDUX_FORWARD_ACTION = 'station:redux-forward-action';
export const IPC_REDUX_REPLAY_ACTION = 'station:redux-replay-action';

// Flag to mark replayed actions so they aren't forwarded again
const REPLAYED_FLAG = '__station_replayed';

// Get the station IPC bridge (available via contextBridge)
function getStationIpc() {
  if (typeof window !== 'undefined' && (window as any).station?.ipc) {
    return (window as any).station.ipc;
  }
  throw new Error('window.station.ipc not available — contextBridge not set up?');
}

/**
 * Middleware that forwards actions to the worker process via IPC.
 * Skips function actions, @@ internal actions, and local-scope actions.
 * Skips replayed actions to prevent forwarding loops.
 */
export function forwardToServer(): Middleware {
  return _store => next => action => {
    if (typeof action === 'function') return next(action);

    // Skip replayed actions (from worker) to prevent forwarding loops
    if (action.meta?.[REPLAYED_FLAG]) return next(action);

    // Skip @@ internal actions and redux-form
    const type = action.type || '';
    if (type.substr(0, 2) === '@@') {
      return next(action);
    }
    if (type.substr(0, 10) === 'redux-form') {
      return next(action);
    }

    // Skip local-scope actions
    if (action.meta?.scope === 'local') return next(action);

    // Forward to worker
    try {
      const ipc = getStationIpc();
      ipc.send(IPC_REDUX_FORWARD_ACTION, action);
    } catch (e) {
      console.warn('[ipc-redux-sync] Failed to forward action:', e);
    }

    return next(action);
  };
}

/**
 * Get initial Redux state from the worker process.
 * Uses transit-immutable-js for serialization (same as shared-redux).
 */
export async function getInitialState(): Promise<any> {
  const ipc = getStationIpc();
  const serialized = await ipc.invoke(IPC_REDUX_GET_INITIAL_STATE);
  return transit.fromJSON(serialized);
}

/**
 * Subscribe to actions broadcast by the worker process.
 * Marks replayed actions so forwardToServer middleware skips them.
 */
export function replayActionClient(store: any): () => void {
  const ipc = getStationIpc();
  const handler = (action: any) => {
    // Mark as replayed to prevent forwardToServer from re-sending it
    const replayedAction = {
      ...action,
      meta: { ...action.meta, [REPLAYED_FLAG]: true },
    };
    store.dispatch(replayedAction);
  };
  return ipc.on(IPC_REDUX_REPLAY_ACTION, handler);
}
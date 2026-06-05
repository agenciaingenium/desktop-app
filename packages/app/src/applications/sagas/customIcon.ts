import { SagaIterator } from 'redux-saga';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { getApplicationById } from '../selectors';
import { setCustomApplicationIcon } from '../duck';

// Channel names must match the IPC handlers in
// packages/app/src/main/ipc-handlers.ts and the constants in
// packages/app/src/static/preload/main-preload.js.
const IPC_PICK_CUSTOM_ICON = 'station:applications-pickCustomIcon';
const IPC_REMOVE_CUSTOM_ICON = 'station:applications-removeCustomIcon';

// The renderer dispatches these action types; the saga reacts.
export const PICK_CUSTOM_ICON = 'browserX/applications/PICK_CUSTOM_ICON';
export const RESET_CUSTOM_ICON = 'browserX/applications/RESET_CUSTOM_ICON';

export interface PickCustomIconAction {
  type: typeof PICK_CUSTOM_ICON;
  applicationId: string;
}
export interface ResetCustomIconAction {
  type: typeof RESET_CUSTOM_ICON;
  applicationId: string;
}

export const pickCustomApplicationIcon = (applicationId: string): PickCustomIconAction => ({
  type: PICK_CUSTOM_ICON,
  applicationId,
});

export const resetCustomApplicationIcon = (applicationId: string): ResetCustomIconAction => ({
  type: RESET_CUSTOM_ICON,
  applicationId,
});

// The IPC is invoked from the worker process via window.station.ipc.
// The worker-preload exposes this as a thin shim over ipcRenderer.invoke,
// so calling it from a saga returns a Promise of the handler's result.
declare const window: any;

function* pickCustomIcon(action: PickCustomIconAction): SagaIterator {
  const { applicationId } = action;
  const application = yield select(getApplicationById, applicationId);
  if (!application) return;

  // Open the file picker in the main process. It copies the chosen
  // image into <userData>/icons/<applicationId>.<ext> and returns
  // the absolute path. The renderer never sees the source file.
  const destPath: string | null = yield call(
    [window.station.ipc, window.station.ipc.invoke],
    IPC_PICK_CUSTOM_ICON,
    applicationId,
  );
  if (!destPath) return;

  yield put(setCustomApplicationIcon(applicationId, destPath));
}

function* resetCustomIcon(action: ResetCustomIconAction): SagaIterator {
  const { applicationId } = action;
  const application = yield select(getApplicationById, applicationId);
  if (!application) return;

  const customPath: string | undefined = application.get('customIconPath');
  if (!customPath) {
    // Nothing to remove; still clear the state in case the userdata
    // record was left with a stale path.
    yield put(setCustomApplicationIcon(applicationId, null));
    return;
  }

  yield call(
    [window.station.ipc, window.station.ipc.invoke],
    IPC_REMOVE_CUSTOM_ICON,
    customPath,
  );
  yield put(setCustomApplicationIcon(applicationId, null));
}

export function* watchCustomIconRequests(): SagaIterator {
  yield takeEvery(PICK_CUSTOM_ICON, pickCustomIcon);
  yield takeEvery(RESET_CUSTOM_ICON, resetCustomIcon);
}

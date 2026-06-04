import Immutable from 'immutable';
import { StationDockImmutable } from './types';

/**
 * -------------
 * - PERSISTED -
 * -------------
 */

// Actions
export const ADD_APP_ITEM = 'browserX/dock/ADD_APP_ITEM';
export type ADD_APP_ITEM = 'browserX/dock/ADD_APP_ITEM';
export const REMOVE_APP_ITEM = 'browserX/dock/REMOVE_APP_ITEM';
export type REMOVE_APP_ITEM = 'browserX/dock/REMOVE_APP_ITEM';
export const CHANGE_APP_ITEM_POSITION = 'browserX/dock/CHANGE_APP_ITEM_POSITION';
export type CHANGE_APP_ITEM_POSITION = 'browserX/dock/CHANGE_APP_ITEM_POSITION';
export const HYDRATE_DOCK = 'browserX/dock/HYDRATE_DOCK';
export type HYDRATE_DOCK = 'browserX/dock/HYDRATE_DOCK';

// Actions Types
export type AddAppItemAction = { type: ADD_APP_ITEM, applicationId: string };
export type RemoveAppItemAction = { type: REMOVE_APP_ITEM, applicationId: string };
export type ChangeAppItemPositionAction = { type: CHANGE_APP_ITEM_POSITION, applicationId: string, index: number };
export type HydrateDockAction = { type: HYDRATE_DOCK, applicationIds: string[] };
export type DockActions =
  AddAppItemAction
  | RemoveAppItemAction
  | ChangeAppItemPositionAction
  | HydrateDockAction;

// Action creators
export const addAppItem = (applicationId: string): AddAppItemAction => ({
  type: ADD_APP_ITEM,
  applicationId,
});
export const removeAppItem = (applicationId: string): RemoveAppItemAction => ({
  type: REMOVE_APP_ITEM,
  applicationId,
});
export const changeAppItemPosition = (applicationId: string, index: number): ChangeAppItemPositionAction => ({
  type: CHANGE_APP_ITEM_POSITION,
  applicationId,
  index,
});
export const hydrateDock = (applicationIds: string[]): HydrateDockAction => ({
  type: HYDRATE_DOCK,
  applicationIds,
});

// Thunk: if the dock state is empty (e.g. the redux state was not
// rehydrated from the dock table on startup), repopulate it with the
// visible application ids in their current order, then perform the
// move. This makes drag-to-reorder work even when the dock starts
// empty because of a stale or missing DB row.
export const moveIconAndMaybeHydrate = (applicationId: string, index: number) => (dispatch: any, getState: any) => {
  const state = getState();
  const dock = state.get('dock');
  if (!dock || (Immutable.List.isList(dock) && dock.size === 0)) {
    const applications = state.get('applications');
    if (applications && typeof applications.valueSeq === 'function') {
      const visibleIds = applications
        .valueSeq()
        .map((app: any) => app.get && app.get('applicationId'))
        .filter(Boolean)
        .toArray();
      if (visibleIds.length > 0) {
        dispatch(hydrateDock(visibleIds));
      }
    }
  }
  dispatch(changeAppItemPosition(applicationId, index));
};

// Reducer
export default function reducer(state: StationDockImmutable = Immutable.List() as any, action: DockActions): StationDockImmutable {
  if (!Immutable.List.isList(state)) {
    state = Immutable.List(state as any) as StationDockImmutable;
  }
  switch (action.type) {
    case HYDRATE_DOCK: {
      const ids = action.applicationIds.filter(Boolean);
      if (ids.length === 0) return state;
      const newState = Immutable.List(ids) as StationDockImmutable;
      return newState;
    }

    case ADD_APP_ITEM:
      return state.includes(action.applicationId) ?
        state :
        state.push(action.applicationId) as StationDockImmutable;

    case REMOVE_APP_ITEM: {
      const index = state.indexOf(action.applicationId);
      if (index !== -1) {
        return state.remove(index);
      }
      return state;
    }

    case CHANGE_APP_ITEM_POSITION: {
      let currentIndex = state.indexOf(action.applicationId);
      // Dock state is empty when the user reinstalls or the persist
      // rehydration did not load the dock table; in that case the
      // selector falls back to showing all installed applications.
      // Allow the move to proceed by appending the missing appId at
      // the end, so the dock becomes ordered on the next render.
      if (currentIndex === -1) {
        return state.push(action.applicationId) as StationDockImmutable;
      }
      const nextIndex = Math.max(0, Math.min(action.index, state.size - 1));
      if (currentIndex === nextIndex) {
        return state;
      }
      return state
        .remove(currentIndex)
        .insert(nextIndex, action.applicationId) as StationDockImmutable;
    }

    default:
      return state;
  }
}

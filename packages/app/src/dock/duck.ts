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

// Reducer
export default function reducer(state: StationDockImmutable = Immutable.List() as any, action: DockActions): StationDockImmutable {
  if (!Immutable.List.isList(state)) {
    state = Immutable.List(state as any) as StationDockImmutable;
  }
  switch (action.type) {
    case HYDRATE_DOCK: {
      const ids = action.applicationIds.filter(Boolean);
      // eslint-disable-next-line no-console
      console.log('[dock-reducer] HYDRATE_DOCK received with', ids.length, 'ids, current size:', state.size);
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
      const currentIndex = state.indexOf(action.applicationId);
      // eslint-disable-next-line no-console
      console.log('[dock-reducer] CHANGE_APP_ITEM_POSITION appId:', action.applicationId, 'index:', action.index, 'currentIndex:', currentIndex, 'state.size:', state.size);
      if (currentIndex === -1) {
        return state;
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

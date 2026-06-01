import { SearchResultSerialized } from '../bang/duck';
import { fromJS } from '../utils/ts';
import { StationHistoryImmutable } from './get';

export const SET_HISTORY = 'browserX/bang/SET_HISTORY';
export type SET_HISTORY = 'browserX/bang/SET_HISTORY';

export type SetHistoryItemsAction = {
  type: SET_HISTORY,
  items: SearchResultSerialized[],
};

export type HistoryAction = SetHistoryItemsAction;

export const setHistoryItems = (items: SearchResultSerialized[]): SetHistoryItemsAction => ({
  type: SET_HISTORY,
  items,
});

// @ts-ignore
const defaultStateStationHistory: StationHistoryImmutable = fromJS({
  items: [],
}) as StationHistoryImmutable;

export default function bang(state: StationHistoryImmutable = defaultStateStationHistory, action: HistoryAction) {
  switch (action.type) {
    case SET_HISTORY: {
      return state.set('items', fromJS(action.items));
    }

    default:
      return state;
  }
}

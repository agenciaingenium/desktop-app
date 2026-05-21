import * as Immutable from 'immutable';

// Action type — must match what redux-ui used, since sagas listen for it
export const UPDATE_UI_STATE = 'UPDATE_UI_STATE';

// Action creator — drop-in replacement for redux-ui's updateUI
// Signature: updateUI(key, name, value) or updateUI(key, value) for nested keys
export function updateUI(key: string, nameOrValue: any, value?: any) {
  // Support both: updateUI('settings', 'isVisible', true) and updateUI('settings', 'isVisible', true)
  // The redux-ui signature is updateUI(key, name, value) where key can be spread from an array
  if (arguments.length === 3) {
    return {
      type: UPDATE_UI_STATE,
      payload: { key, name: nameOrValue, value },
    };
  }
  // 2-arg form: updateUI('settings', { isVisible: true, activeTabTitle: 'Quick-Switch' })
  return {
    type: UPDATE_UI_STATE,
    payload: { key, name: undefined, value: nameOrValue },
  };
}

// Reducer — drop-in replacement for redux-ui's reducer
// Handles Immutable.js Map state
export function reducer(state: Immutable.Map<string, any> = Immutable.Map(), action: any): Immutable.Map<string, any> {
  if (action.type !== UPDATE_UI_STATE) return state;

  const { key, name, value } = action.payload;

  if (name === undefined) {
    // 2-arg form: value is an object to merge
    if (typeof value === 'object' && value !== null) {
      const current = state.get(key, Immutable.Map());
      return state.set(key, current.merge(value));
    }
    return state;
  }

  // 3-arg form: set a single nested key
  const current = state.get(key, Immutable.Map());
  return state.set(key, current.set(name, value));
}

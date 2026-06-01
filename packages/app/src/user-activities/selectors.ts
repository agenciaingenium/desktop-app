import * as Immutable from 'immutable';

export const getUserActivities = (state: Immutable.List<number>) : any =>
  // @ts-ignore
  state.get('userActivities');

export const isUserSAU = (state: Immutable.List<number>) : any => {
  // @ts-ignore
  return state.get('userActivities').size >= 3;
};

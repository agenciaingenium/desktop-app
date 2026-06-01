import Immutable from 'immutable';
import { createSelector } from 'reselect';
import { GDRIVE_MANIFEST_URL } from '../applications/manifest-provider/const';
import { StationState } from '../types';

export const getPersistedSlackTeam = (state: StationState, manifestURL: string): string | undefined =>
  state.getIn(['servicesData', manifestURL, 'selectedTeam']);

export const getPersistedSlackTokens = (state: StationState, manifestURL: string): string | undefined =>
  state.getIn(['servicesData', manifestURL, 'tokens']);

export const getPersistedSlackTeamMetadata = (state: StationState, manifestURL: string, key: string): Immutable.Map<string, any> =>
  state.getIn(['servicesData', manifestURL, '__metadata', 'selectedTeam', key] as any);

export const getGDriveTokens = (state: StationState, manifestURL: string): Immutable.Map<string, any> | undefined =>
  state.getIn(['servicesData', manifestURL, 'tokens']);

export const hasGDriveTokens = createSelector(
  (state: StationState) => getGDriveTokens(state, GDRIVE_MANIFEST_URL),
  tokens => tokens ? tokens.size > 0 : false
);

export const hasServiceTokens = (manifestURL: string) => createSelector(
  (state: StationState) => state.getIn(['servicesData', manifestURL, 'tokens']) as any,
  (tokens: any) => tokens ? tokens.size > 0 : false
);

export const getPlugins = (state: StationState): any => state.get('plugins');

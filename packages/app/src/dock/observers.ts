import { Dispatch } from 'redux';
// @ts-ignore: no declaration file
import { observer } from 'redux-observers';
import { logger } from '../api/logger';
import { StationState } from '../types';

// @ts-ignore
const observeDockDuplicates = observer(
  // @ts-ignore
  (state: StationState) => state.get('dock') as any,
  (_dispatch: Dispatch, state: StationState, previousState: StationState | undefined) => {
    if (state === previousState) return;
    if (state.toSet().size === state.size) return;
    logger.notify(new Error('Duplicate entries in dock'), {
      metaData: {
        dock: state.toJS(),
        previousDock: previousState ? previousState.toJS() : undefined,
      },
    });
  },
  { skipInitialCall: false }
);

export default [
  observeDockDuplicates,
];

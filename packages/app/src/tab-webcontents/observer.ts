import { Dispatch } from 'redux';
import { observer } from 'redux-observers';
// @ts-ignore no declaration file
import { getFrontActiveTabId } from '../applications/utils';
import { frontActiveTabChange, FrontActiveTabChangeAction } from './duck';

// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const observeActiveTabChange = observer(getFrontActiveTabId,
  // @ts-ignore
  (dispatch: Dispatch<FrontActiveTabChangeAction>, activeTabId: string | null, previousActiveTabId: string | null) => {
    if (!activeTabId) return;
    dispatch(frontActiveTabChange(activeTabId, previousActiveTabId));
  });

export default [
  observeActiveTabChange,
];

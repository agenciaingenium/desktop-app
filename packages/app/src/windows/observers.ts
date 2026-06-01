import { Map } from 'immutable';
import { Dispatch } from 'redux';
// @ts-ignore: no declaration file
import { observer } from 'redux-observers';
import { getFocus } from '../app/selectors';
// @ts-ignore no declaration file
import { getFrontActiveTabId } from '../applications/utils';
// @ts-ignore no declaration file
import { updateTabId } from './duck';
// @ts-ignore no declaration file
import { getWindowCurrentTabId, getWindowIsMain } from './get';
// @ts-ignore no declaration file
import { getWindow } from './selectors';

// @ts-ignore
const observeFrontActiveTab = observer(
  // @ts-ignore
  null,
  // @ts-ignore
  (dispatch: Dispatch<any>, state: Map<string, any>) => {
    // @ts-ignore
    const activeWebviewId = getFocus(state);
    if (!activeWebviewId) return;

    // @ts-ignore
    const activeTabId = getFrontActiveTabId(state);
    // @ts-ignore
    const webview = getWindow(state, activeWebviewId);

    if (!webview) return;
    const isMain = getWindowIsMain(webview);

    if (!isMain) return;
    const activeTabIdInWebviews = getWindowCurrentTabId(webview);
    if (activeTabId === activeTabIdInWebviews) return;
    // @ts-ignore
    dispatch(updateTabId(getFocus(state), activeTabId));
  }
);

export default [
  observeFrontActiveTab,
];

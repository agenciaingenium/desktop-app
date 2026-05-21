import * as Immutable from 'immutable';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
// @ts-ignore: no declaration file
import { updateUI } from '../ui/redux-ui-compat';
import { useGetActivityQuery } from '../activity/queries@local.gql.generated';
import { getFocus } from '../app/selectors';
import { SHORTCUTS } from '../keyboard-shortcuts';
import { hasGDriveTokens } from '../plugins/selectors';
import { StationState } from '../types';
import { getUIQSHighlightedItemId } from '../ui/selectors';
import BangInput from './components/BangInput';
import BangPresenter from './components/BangPresenter';
import {
  cyclingStep,
  SearchPaneItemSelectedVia,
  SearchPaneItemsListCycleDirection,
  SearchPaneItemsListCycleVia,
  SearchResultSerialized,
  SearchSectionSerialized,
  selectItem,
  setSearchValue,
  setVisibility,
} from './duck';
import { findItemById, getId } from './helpers/utils';
import { canShowInsert, getResultsJS, getSearchSessionId, getSearchValue, isVisible } from './selectors';

const kbShortcut = SHORTCUTS.bang.kbd.replace(' ', '+');

export interface OwnProps {
  onQuit?: () => void,
}

function* getFlatItemsIterator(items: SearchSectionSerialized[]) {
  for (const item of items) {
    if (!item.results) continue;
    for (const result of item.results) {
      if (result) yield result;
    }
  }
}

const BangSubdock: React.FC<OwnProps> = ({ onQuit = () => {} }) => {
  const inputRef = React.useRef<BangInput | null>(null);
  const flatItemsRef = React.useRef<SearchResultSerialized[]>([]);
  const prevVisibleAndFocusRef = React.useRef<boolean>(false);

  const { data } = useGetActivityQuery();
  const historyItems = (data?.activity ?? []).filter((item): item is NonNullable<typeof item> => item != null) as unknown as SearchResultSerialized[];

  const searchSessionId = useSelector((state: StationState) => getSearchSessionId(state));
  const searchValue = useSelector((state: StationState) => getSearchValue(state));
  const highlightedItemId = useSelector((state: StationState) => getUIQSHighlightedItemId(state));
  const items = useSelector((state: StationState) => getResultsJS(state));
  const isVis = useSelector((state: StationState) => isVisible(state));
  const shouldShowInsert = useSelector((state: StationState) => canShowInsert(state));
  const focus = useSelector((state: StationState) => getFocus(state));
  const isGDriveConnected = useSelector((state: StationState) => hasGDriveTokens(state));

  const dispatch = useDispatch();
  const actions = React.useMemo(() => bindActionCreators({
    cyclingStep,
    onSearchValueChange: setSearchValue,
    onSelectItem: selectItem,
    setHighlightedItemId: (id?: string) => updateUI('qs', 'highlightedItemId', id),
  }, dispatch), [dispatch]);

  const onShowSettings = React.useCallback(() => {
    dispatch(updateUI('settings', 'activeTabTitle', 'Quick-Switch'));
    dispatch(updateUI('settings', 'isVisible', true));
    dispatch(setVisibility('center-modal', false, 'topbar_menu_or_keyboard_shortcut'));
  }, [dispatch]);

  const getFlatItems = React.useCallback((props?: { searchValue: string; historyItems: SearchResultSerialized[]; items: SearchSectionSerialized[] }): SearchResultSerialized[] => {
    const sv = props?.searchValue ?? searchValue;
    const hi = props?.historyItems ?? historyItems;
    const it = props?.items ?? items;
    if (sv === '') return hi;
    return Array.from(getFlatItemsIterator(it)) as SearchResultSerialized[];
  }, [searchValue, historyItems, items]);

  const setFlatItems = React.useCallback((newItems: SearchResultSerialized[]) => {
    flatItemsRef.current = newItems;
    if (newItems.length >= 1) {
      actions.setHighlightedItemId(getId(newItems[0]));
    } else {
      actions.setHighlightedItemId(undefined);
    }
  }, [actions]);

  const getHighlightedItemIndex = React.useCallback(() => {
    const flatItems = flatItemsRef.current;
    if (highlightedItemId === null) return null;
    const index = flatItems.findIndex(item => getId(item) === highlightedItemId);
    if (index === -1) return null;
    return index;
  }, [highlightedItemId]);

  const getNextHighlightedItemIndex = React.useCallback((direction: SearchPaneItemsListCycleDirection, cycling: boolean = false): number | null => {
    const flatItems = flatItemsRef.current;
    const start = 0;
    const end = flatItems.length - 1;
    if (end < 0) return null;

    const currentIndex = getHighlightedItemIndex() || 0;
    const nextIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1;

    if (!cycling) {
      if (nextIndex < start) return null;
      if (nextIndex > end) return null;
    }
    if (nextIndex < start) return end;
    if (nextIndex > end) return start;

    return nextIndex;
  }, [getHighlightedItemIndex]);

  const selectItem_ = React.useCallback((itemId: string, position: number, via: SearchPaneItemSelectedVia) => {
    const item = findItemById(itemId, flatItemsRef.current);
    if (!item) return;
    actions.onSelectItem(item, position, via, 'center-modal', searchValue);
  }, [actions, searchValue]);

  const selectNextItem = React.useCallback((via: SearchPaneItemsListCycleVia, direction: SearchPaneItemsListCycleDirection) => {
    const flatItems = flatItemsRef.current;
    const cycling = via !== 'keyboard-arrow';
    const nextIndex = getNextHighlightedItemIndex(direction, cycling);
    if (nextIndex === null || !flatItems[nextIndex]) return;
    actions.cyclingStep(flatItems[nextIndex], nextIndex, direction, 'center-modal', via, searchValue);
  }, [getNextHighlightedItemIndex, actions, searchValue]);

  const selectNextItemArrowDown = React.useCallback(() => selectNextItem('keyboard-arrow', 'down'), [selectNextItem]);
  const selectNextItemArrowUp = React.useCallback(() => selectNextItem('keyboard-arrow', 'up'), [selectNextItem]);
  const selectNextItemTabDown = React.useCallback(() => selectNextItem('keyboard-tab', 'down'), [selectNextItem]);
  const selectNextItemTabUp = React.useCallback(() => selectNextItem('keyboard-tab', 'up'), [selectNextItem]);

  const setRef = React.useCallback((ref: BangInput | null) => {
    inputRef.current = ref;
  }, []);

  const handleClick = React.useCallback((itemId: string, position: number) => {
    const item = findItemById(itemId, flatItemsRef.current);
    if (!item) return;
    selectItem_(itemId, position, 'click');
  }, [selectItem_]);

  const focusInput = React.useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleEnter = React.useCallback(async () => {
    if (!highlightedItemId) return;
    const item = findItemById(highlightedItemId, flatItemsRef.current);
    if (!item) return;
    const position = flatItemsRef.current.indexOf(item);
    selectItem_(highlightedItemId, position, 'keyboard-enter');
  }, [highlightedItemId, selectItem_]);

  const resetHighlightedItem = React.useCallback(() => {
    const flatItems = flatItemsRef.current;
    actions.setHighlightedItemId(getId(flatItems[0]));
  }, [actions]);

  // componentDidMount equivalent
  React.useEffect(() => {
    const nextItems = getFlatItems();
    setFlatItems(nextItems);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectAll();
    }
    return () => {
      actions.setHighlightedItemId(undefined);
    };
  }, []);

  // componentDidUpdate equivalent for flatItems sync
  React.useEffect(() => {
    const currentIds = Immutable.Set(flatItemsRef.current.map(getId));
    const nextItems = getFlatItems();
    const nextIds = Immutable.Set(nextItems.map(getId));
    if (!nextIds.equals(currentIds)) {
      setFlatItems(nextItems);
    }
  }, [searchValue, historyItems, items, getFlatItems, setFlatItems]);

  // componentDidUpdate equivalent for focus/blur
  React.useEffect(() => {
    const visibleAndFocus = isVis && focus;
    const prevVisibleAndFocus = prevVisibleAndFocusRef.current;
    prevVisibleAndFocusRef.current = !!visibleAndFocus;

    // on get visible, focus
    if (!prevVisibleAndFocus && !visibleAndFocus) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectAll();
      }
    }
    // on get hidden, blur
    if (prevVisibleAndFocus && !visibleAndFocus) {
      if (inputRef.current) inputRef.current.blur();
    }
  }, [isVis, focus]);

  return (
    <BangPresenter
      highlightedItemId={highlightedItemId}
      searchSessionId={searchSessionId}
      searchValue={searchValue}
      items={items}
      historyItems={historyItems}
      isVisible={isVis}
      shouldShowInsert={shouldShowInsert}
      focus={focus}
      isGDriveConnected={isGDriveConnected}
      onSearchValueChange={actions.onSearchValueChange}
      onSelectItem={actions.onSelectItem}
      onShowSettings={onShowSettings}
      setHighlightedItemId={actions.setHighlightedItemId}
      cyclingStep={actions.cyclingStep}
      onQuit={onQuit}
      kbShortcut={kbShortcut}
      setRef={setRef}
      handleArrowDown={selectNextItemArrowDown}
      handleArrowUp={selectNextItemArrowUp}
      handleTab={selectNextItemTabDown}
      handleShiftTab={selectNextItemTabUp}
      handleEnter={handleEnter}
      handleClick={handleClick}
      resetHighlightedItem={resetHighlightedItem}
      onCollapseSection={focusInput}
    />
  );
};

export default BangSubdock;

import { history } from '@getstation/sdk';
// @ts-ignore no declaration file
import { SearchSection } from 'app/sdk/search/types';
// @ts-ignore no declaration file
import { Transformer } from 'app/utils/fp';
import memoizee from 'memoizee';

export const historyItemsAsLastUsedSection: Transformer<history.HistoryEntry[], SearchSection> = memoizee(
  (items: history.HistoryEntry[]) => ({ sectionName: 'Last Used', results: items })
);

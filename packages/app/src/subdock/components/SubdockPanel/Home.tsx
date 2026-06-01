import React from 'react';

import SubdockItem, { MinimalSubdockApplication } from '../SubdockItem';
import { ActiveTab } from '../../Container';

import { HomeTab, SubdockActionsProps } from './types';
import { extractTabActions } from './Tabs';
import { useActionsWrapper } from './TabItem';

const containerStyle: React.CSSProperties = {
  position: 'relative',
  flex: '1 1 auto',
  padding: '0 0 0 20px',
  width: '100%',
  marginBottom: 10,
};

export type OwnProps = SubdockActionsProps & {
  className?: string,
  application: MinimalSubdockApplication,
  item: HomeTab,
  activeTab: ActiveTab,
};

const Home = ({
  application,
  item,
  activeTab,
  ...props
}: OwnProps) => {
  const tabActions = extractTabActions(props);

  const surchargedItem = useSanitization(item, activeTab);
  const wrappedActions = useActionsWrapper(tabActions, item);

  return (
    <div style={containerStyle}>
      <ul>
        <SubdockItem
          application={application}
          item={surchargedItem}
          actions={wrappedActions}
        />
      </ul>
    </div>
  );
};

// HOOKS

/**
 * Transform received Tab (+ various options) into an item shapped for SubdockItem.
 */
const useSanitization = (item: HomeTab, activeTab: ActiveTab) => {
  return React.useMemo(
    () => ({
      title: 'Home',
      isActive: item.tabId === activeTab.id,
      isTabApplicationHome: true,
      isDetached: Boolean(item.isDetached),
      favorite: false,
      noClose: true,
      canDetach: true,
    }),
    [item, activeTab],
  );
};

export default Home as React.ComponentType<OwnProps>;
import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import mergeRefs from 'react-merge-refs';
import classNames from 'classnames';
import { IconSymbol } from '@getstation/theme';

import { MinimalSubdockApplication } from '../SubdockItem';
import { ActiveTab } from '../../Container';
import SubdockButton from '../SubdockButton';

import { Tab, SubdockActionsProps } from './types';
import {
  useScrollToActiveTabOnMount,
  useScrollData,
  IdentifierType,
} from './customHooks';
import TabItem from './TabItem';

// STYLE

const containerStyle: React.CSSProperties = {
  position: 'relative',
  flex: '1 1 auto',
  padding: '0 0 0 20px',
  width: '100%',
  marginBottom: 10,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  padding: 10,
  fontSize: 10,
  opacity: 0.3,
  fontStyle: 'bold',
  color: 'white',
};

const contentStyle: React.CSSProperties = {
  maxHeight: 200,
  overflowY: 'scroll',
};

const newPageButtonStyle: React.CSSProperties = {
  marginRight: 20,
  opacity: 0.4,
};

// PROPS

export interface RawTabActions {
  onSelect: SubdockActionsProps['onSelectTab'],
  onClose: SubdockActionsProps['onCloseTab'],
  onClickFavorite: SubdockActionsProps['onAddTabAsFavorite'],
  onClickAttach: SubdockActionsProps['onAttachTab']
  onClickDetach: SubdockActionsProps['onDetachTab'],
}

export type OwnProps = SubdockActionsProps & {
  ref?: React.Ref<HTMLDivElement>,
  className?: string,
  application: MinimalSubdockApplication,
  tabs: Tab[],
  activeTab: ActiveTab,
  handleOpenNewTab: () => void,
};

// COMPONENT

const Tabs = React.forwardRef((
  {
    className,
    application,
    tabs,
    activeTab,
    handleOpenNewTab,
    ...props
  }: OwnProps,
  ref: React.Ref<HTMLDivElement>
) => {
  // Scroll Stuff
  const internalRef = useScrollToActiveTabOnMount(tabs, activeTab.id, IdentifierType.Tab);
  const { onScroll, scrolled, visibleItems } = useScrollData();

  // Vars & other init
  const actions = extractTabActions(props);

  const nbTabs = tabs.length;
  if (nbTabs === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>
        <p style={titleStyle}>
          Opened pages
          {nbTabs > 5 && <span> : {nbTabs}</span>}
        </p>
        <SubdockButton
          tooltip={'Open a new page'}
          style={newPageButtonStyle}
          size={24}
          symbolId={IconSymbol.PLUS}
          onClick={handleOpenNewTab}
        />
      </div>
      <div
        ref={mergeRefs([ref, internalRef])}
        onScroll={onScroll}
        style={contentStyle}
        className={classNames(
          className,
          'subdock-scroll-content',
          {
            'subdock-scroll-overlay-top': !scrolled.top && nbTabs > 5,
            'subdock-scroll-overlay-bottom': !scrolled.bottom && nbTabs > 5,
          }
        )}
      >
        <ul>
          <TransitionGroup>
            {tabs.map((item, index) =>
            <CSSTransition
              key={item.tabId!}
              classNames="all-read-animation"
              timeout={{ enter: 700, exit: 500 }}
            >
              <TabItem
                actions={actions}
                application={application}
                item={item}
                index={index}
                visibleItems={visibleItems}
                isActive={item.tabId === activeTab.id}
              />
            </CSSTransition>
            )}
          </TransitionGroup>
        </ul>
      </div>
    </div>
  );
});

// UTILS

/**
 * Get only the necessary actions from props to be used by Tabs.
 */
export const extractTabActions = (props: SubdockActionsProps): RawTabActions => {
  return {
    onSelect: props.onSelectTab,
    onClose: props.onCloseTab,
    onClickFavorite: props.onAddTabAsFavorite,
    onClickAttach: props.onAttachTab,
    onClickDetach: props.onDetachTab,
  };
};

// EXPORT

export default Tabs as React.ComponentType<OwnProps>;
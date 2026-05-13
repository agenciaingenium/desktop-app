import * as React from 'react';
import * as ReactApolloHooks from 'react-apollo-hooks';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import * as classNames from 'classnames';

import { MinimalSubdockApplication } from '../SubdockItem';
import { ActiveTab } from '../../Container';
import {
  useSelectFavoriteMutation, useCloseFavoriteMutation,
  useUnpinFavoriteMutation, useDetachFavoriteMutation,
  CloseFavoriteMutation, CloseFavoriteMutationVariables,
  SelectFavoriteMutation, SelectFavoriteMutationVariables,
  UnpinFavoriteMutation, UnpinFavoriteMutationVariables,
  DetachFavoriteMutation, DetachFavoriteMutationVariables,
} from '../../queries@local.gql.generated';

import { Favorite, SubdockActionsProps } from './types';
import {
  useScrollToActiveTabOnMount,
  useScrollData,
  IdentifierType,
} from './customHooks';
import FavoriteItem from './FavoriteItem';

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

// PROPS

export interface RawFavoriteActions {
  onSelect: ReactApolloHooks.MutationFn<SelectFavoriteMutation, SelectFavoriteMutationVariables>,
  onClose: ReactApolloHooks.MutationFn<CloseFavoriteMutation, CloseFavoriteMutationVariables>,
  onClickFavorite: ReactApolloHooks.MutationFn<UnpinFavoriteMutation, UnpinFavoriteMutationVariables>,
  onClickAttach: SubdockActionsProps['onAttachTab'],
  onClickDetach: ReactApolloHooks.MutationFn<DetachFavoriteMutation, DetachFavoriteMutationVariables>,
}

export type OwnProps = SubdockActionsProps & {
  className?: string,
  application: MinimalSubdockApplication,
  items: Favorite[],
  activeTab: ActiveTab,
};

// COMPONENT

const Favorites = ({
  className,
  application,
  items,
  activeTab,
  ...props
}: OwnProps) => {
  // Stuff for scrolling
  const internalRef = useScrollToActiveTabOnMount(items, activeTab.url, IdentifierType.Favorite);
  const { onScroll, scrolled } = useScrollData();

  // Vars and other init
  const actions = useFavoritesMutators(props);

  const nbTabs = items.length;
  if (nbTabs === 0) return null;

  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>
        <p style={titleStyle}>
          Pinned pages
          {nbTabs > 5 && <span> : {nbTabs}</span>}
        </p>
      </div>
      <div
        ref={internalRef}
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
            {items.map((item, index) =>
              <CSSTransition
                key={item.favoriteId!}
                classNames="all-read-animation"
                timeout={{ enter: 700, exit: 500 }}
              >
                <FavoriteItem
                  actions={actions}
                  application={application}
                  item={item}
                  index={index}
                  isActive={item.url === activeTab.url}
                />
              </CSSTransition>
            )}
          </TransitionGroup>
        </ul>
      </div>
    </div>
  );
};

// UTILS

/**
 * Get only the necessary actions from props to be used by Favorites.
 */
export const useFavoritesMutators = (props: SubdockActionsProps) => {
  return {
    onSelect: useSelectFavoriteMutation(),
    onClose: useCloseFavoriteMutation(),
    onClickFavorite: useUnpinFavoriteMutation(),
    onClickAttach: props.onAttachTab,
    onClickDetach: useDetachFavoriteMutation(),
  };
};

// EXPORT

export default Favorites as React.ComponentType<OwnProps>;
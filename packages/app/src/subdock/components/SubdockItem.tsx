import * as React from 'react';
import Maybe from 'graphql/tsutils/Maybe';
import { getHighlightGradient, Icon, IconSymbol, theme } from '@getstation/theme';
import * as classNames from 'classnames';
// @ts-ignore: no declaration file
import * as isBlank from 'is-blank';

import AppIcon from '../../dock/components/AppIcon';

import SubdockButton from './SubdockButton';

// STYLE

export const SUBDOCK_ITEM_HEIGHT = 40;

const itemBaseStyle: React.CSSProperties = {
  padding: '0 20px 0 15px',
  borderBottom: '2px solid rgba(255,255,255,0.1)',
  listStyleType: 'none',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'default',
  height: SUBDOCK_ITEM_HEIGHT,
  position: 'relative',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
};

const favoriteImgStyle: React.CSSProperties = {
  flex: '0 0 auto',
  marginRight: '9px',
  opacity: 1,
  borderRadius: '8px',
  filter: 'grayscale(100%)',
};

const txtStyle: React.CSSProperties = {
  color: 'white',
  flex: '1 1 auto',
  marginRight: '5px',
  position: 'relative',
  opacity: 0.8,
  ...theme.elipsisMixin(1),
  ...theme.fontMixin(13),
};

const iconWrapperStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  opacity: 0.8,
  display: 'inline-flex',
  marginLeft: '-8px',
};

const unPinnedStyle: React.CSSProperties = {
  transform: 'rotate(45deg)',
};

// PROPS

export interface MinimalSubdockApplication {
  id: string,
  iconUrl: Maybe<string>,
  themeColor: Maybe<string>,
}

export interface WrappedActions {
  onSelect: () => any,
  onClose: () => any,
  onClickFavorite: () => any,
  onClickAttach?: () => any,
  onClickDetach: () => any,
}

export interface ItemDetails {
  title: string,
  isActive: boolean,
  isTabApplicationHome: boolean,
  isDetached: boolean,
  icon?: string | null,
  noClose?: boolean,
  canPin?: boolean,
  canDetach?: boolean,
  isPinned?: boolean,
}

interface OwnProps {
  application: MinimalSubdockApplication,
  actions: WrappedActions,
  item: ItemDetails,
}

// EMPTY SUBDOCK ELEMENT

const emptySubdockItemStyle = { height: SUBDOCK_ITEM_HEIGHT };
export const EmptySubdockItem = () => (
  <div style={emptySubdockItemStyle} />
);

// FULL SUBDOCK ELEMENT

const SubdockItem = (props: OwnProps) => {
  const { application, actions, item } = props;

  const {
    title, icon,
    isActive, isTabApplicationHome, isPinned, isDetached,
    canPin, canDetach, noClose,
  } = item;

  const {
    onSelect, onClose, onClickPin,
    onClickDetach, onClickAttach,
  } = useEventWrapper(actions);

  const { iconUrl, themeColor } = application;

  const itemStyle: React.CSSProperties = {
    ...itemBaseStyle,
    ...(isActive ? { backgroundImage: getHighlightGradient(undefined, .50) } : {}),
  };

  const itemFavoriteImgStyle: React.CSSProperties = {
    ...favoriteImgStyle,
    ...(isActive ? { filter: 'grayscale(0)' } : {}),
  };

  const itemTxtStyle: React.CSSProperties = {
    ...txtStyle,
    ...(isActive ? { opacity: 1, ...theme.fontMixin(13, 700) } : {}),
  };

  const itemIconWrapperStyle: React.CSSProperties = {
    ...iconWrapperStyle,
    ...(isActive ? { opacity: 1 } : {}),
  };

  return (
    <li
      className={classNames('subdock-item', { isActive })}
      style={itemStyle}
    >
      <a style={linkStyle} onClick={onSelect}>
        {isTabApplicationHome && iconUrl &&
          <div style={itemFavoriteImgStyle}>
            <AppIcon
              imgUrl={iconUrl}
              themeColor={themeColor || undefined}
              size={16}
            />
          </div>
        }

        {icon &&
          <span style={itemIconWrapperStyle}>
            <Icon size={24} color="white" symbolId={icon as IconSymbol} />
          </span>
        }

        <span style={itemTxtStyle}>
          {isBlank(title) ? <i>Untitled</i> : title}
        </span>

        <span className="subdock-item-buttons">
          {canPin &&
            <SubdockButton
              className={isPinned ? '' : undefined}
              style={isPinned ? undefined : unPinnedStyle}
              tooltip={isPinned ? 'Unpin this page' : 'Pin this page'}
              size={24}
              symbolId={IconSymbol.PIN}
              onClick={onClickPin}
            />
          }

          { canDetach &&
            <SubdockButton
              tooltip={isDetached ? 'Reattach the window' : 'Open in detached window'}
              size={24}
              symbolId={isDetached ? IconSymbol.REATTACH : IconSymbol.DETACH}
              onClick={isDetached ? onClickAttach : onClickDetach}
            />
          }

          {!noClose && <SubdockButton
            tooltip="Close this page"
            size={24}
            symbolId={IconSymbol.CROSS}
            onClick={onClose}
          />}
        </span>
      </a>
    </li>
  );
};

// HOOKS

const useEventWrapper = (actions: WrappedActions) => {
  return React.useMemo(
    () => {
      const onSelect = (_: React.MouseEvent<Element>) => {
        actions.onSelect();
      };

      // close being inside the whole item, need to stop propagation
      // so that onSelect is not called
      const onClose = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        actions.onClose();
      };

      const onClickPin = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        actions.onClickFavorite();
      };

      const onClickDetach = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        actions.onClickDetach();
      };

      const onClickAttach = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        if (actions.onClickAttach) actions.onClickAttach();
      };

      return {
        onSelect,
        onClose,
        onClickPin,
        onClickDetach,
        onClickAttach,
      };
    },
    [actions],
  );
};

// EXPORT

export default SubdockItem as React.ComponentType<OwnProps>;
import * as React from 'react';
import { Application } from '../types';
import { ITabSelectedInfo, ActiveTab } from '../Container';
import SubdockHead from './SubdockHead';
import SubdockPanel from './SubdockPanel';

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 280,
  zIndex: 4,
  borderRadius: 4,
  maxHeight: '98vh',
  backgroundColor: '#254969',
  backgroundAttachment: 'fixed',
};

const panelsStyle: React.CSSProperties = {
  flex: '1 1 auto',
  position: 'relative',
  overflowY: 'auto',
  scrollbarWidth: 'none' as any,
  msOverflowStyle: 'none',
};

interface Props {
  application: Application,
  applicationId: string,
  onOverStateChange: (change: boolean) => any,
  notificationsEnabled: boolean,
  themeGradient: string,
  activeTab: ActiveTab,
  onSelectTab: (tabId: string, info: ITabSelectedInfo) => any,
  onDetachTab: () => any,
  onAttachTab: () => any,
  onSelectFavorite: (tabId: string) => any,
  onAddTabAsFavorite: () => any,
  onRemoveFavorite: (favoriteId: string, tabId: string) => any,
  onDetachFavorite: () => any,
  onCloseTab: (tabId: string) => any,
  onOpenNewTab: () => void,
  onClickAddNewInstance: (application: Application, identityNeeded?: boolean) => void,
  openApplicationPreferences: (application: Application) => void,
  toggleNotifications: () => void,
  handleHideSubdock: () => void,
}

export default class Subdock extends React.PureComponent<Props, {}> {

  render() {
    const {
      application, onOverStateChange, notificationsEnabled,
      handleHideSubdock, activeTab, onSelectTab, onDetachTab, onAttachTab, onSelectFavorite, onAddTabAsFavorite,
      onRemoveFavorite, onDetachFavorite, onCloseTab, onClickAddNewInstance, onOpenNewTab, openApplicationPreferences,
      toggleNotifications,
    } = this.props;

    const onMouseEnter = () => onOverStateChange(true);
    const onMouseLeave = () => onOverStateChange(false);

    return (
      <div className="subdock-container" style={containerStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <SubdockHead
          application={application}
          notificationsEnabled={notificationsEnabled}
          // @ts-ignore
          openApplicationPreferences={openApplicationPreferences}
          toggleNotifications={toggleNotifications}
        />

        <div className="subdock-panels" style={panelsStyle}>
          {application &&
            // @ts-ignore
            <SubdockPanel
              application={application}
              activeTab={activeTab}
              onSelectTab={onSelectTab}
              onDetachTab={onDetachTab}
              onAttachTab={onAttachTab}
              onSelectFavorite={onSelectFavorite}
              onAddTabAsFavorite={onAddTabAsFavorite}
              onRemoveFavorite={onRemoveFavorite}
              onDetachFavorite={onDetachFavorite}
              onCloseTab={onCloseTab}
              onOpenNewTab={onOpenNewTab}
              onClickAddNewInstance={onClickAddNewInstance}
              handleHideSubdock={handleHideSubdock}
            />
          }
        </div>
      </div>
    );
  }
}

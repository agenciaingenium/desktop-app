import { GradientType, withGradient } from '@getstation/theme';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { oc } from 'ts-optchain';
import { Maybe } from 'graphql/jsutils/Maybe';

import { createNewEmptyTab, installApplication, navigateToApplicationTabAutomatically, toggleNotifications } from '../applications/duck';
import { getApplicationActiveTab } from '../applications/get';
import { getTabById } from '../tabs/selectors';
import { getTabURL } from '../tabs/get';
import { getApplicationById as getApplicationByIdSelector, getNotificationsEnabled } from '../applications/selectors';
import { addTabAsFavorite, openFavorite, removeFavorite } from '../favorites/duck';
import { openApplicationPreferences, OpenApplicationPreferencesVia } from '../settings/applications/duck';
import { attach, detach } from '../subwindows/duck';
import { closeTab } from '../tabs/duck';
import { StationState } from '../types';
import { requestSignInThenAddApplication } from '../user-identities/duck';

import Subdock from './components/Subdock';
import { Application } from './types';
import { useGetApplicationForSubdockQuery } from './queries@local.gql.generated';

export interface ITabSelectedInfo {
  isHome: boolean,
  isFavorite: boolean,
}

export interface ActiveTab {
  id: Maybe<string>,
  url: Maybe<string>,
}

export interface OuterProps {
  applicationId: string,
  onOverStateChange: (change: boolean) => void,
  handleHideSubdock: () => void,
  onLoaded?: () => void,
}

interface StateProps {
  activeTab: ActiveTab,
  notificationCount: number,
  notificationsEnabled: boolean | undefined,
}

interface DispatchProps {
  onSelectTab: (tabId: string) => any,
  onDetachTab: () => any,
  onAttachTab: () => any,
  onSelectFavorite: (favoriteId: string) => void,
  onAddTabAsFavorite: () => any,
  onRemoveFavorite: (favoriteId: string, tabId: string) => any,
  onDetachFavorite: () => any,
  onCloseTab: (tabId: string) => void,
  onClickAddNewInstance: (application: Application, identityNeeded?: boolean) => void,
  toggleNotifications: () => void,
  openApplicationPreferences: (application: Application) => void,
  onOpenNewTab: () => void,
}

type ConnectedProps = OuterProps & StateProps & DispatchProps;

const SubdockContainerInner: React.FC<ConnectedProps> = (props) => {
  const { applicationId, onLoaded } = props;

  const { data, loading } = useGetApplicationForSubdockQuery({
    variables: { applicationId },
  });

  const application = oc(data).application();
  const prevLoadingRef = React.useRef(loading);

  React.useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      onLoaded && onLoaded();
    }
    prevLoadingRef.current = loading;
  }, [loading, onLoaded]);

  const onSelectFavorite = React.useCallback((favoriteId: string) => {
    props.onSelectFavorite(favoriteId);
  }, [props.onSelectFavorite]);

  const onSelectTab = React.useCallback((tabId: string) => {
    props.onSelectTab(tabId);
    props.handleHideSubdock();
  }, [props.onSelectTab, props.handleHideSubdock]);

  const onCloseTab = React.useCallback((tabId: string) => {
    props.onCloseTab(tabId);
  }, [props.onCloseTab]);

  if (loading) return null;

  return (
    <Subdock
      {...props}
      loading={loading}
      application={application}
      onSelectFavorite={onSelectFavorite}
      onSelectTab={onSelectTab}
      onCloseTab={onCloseTab}
    />
  );
};

const SubdockContainer = compose(
  connect(
    (state: StationState, ownProps: ConnectedProps) => {
      const { applicationId } = ownProps;
      const application = getApplicationByIdSelector(state, applicationId);

      let activeTab: ActiveTab = { id: null, url: null };
      if (application) {
        const activeTabId = getApplicationActiveTab(application);
        const tab = getTabById(state, activeTabId);
        if (tab) activeTab = { id: activeTabId, url: getTabURL(tab) };
      }

      return {
        activeTab: activeTab,
        notificationCount: 0,
        notificationsEnabled: getNotificationsEnabled(state, applicationId),
      };
    },
    (dispatch, ownProps) => {
      return bindActionCreators({
        onSelectTab: tabId => navigateToApplicationTabAutomatically(tabId, 'mouse_click'),
        onCloseTab: tabId => closeTab(tabId),
        onDetachTab: tabId => detach(tabId),
        onAttachTab: tabId => attach(tabId),
        onSelectFavorite: favoriteId => openFavorite(favoriteId),
        onRemoveFavorite: (favoriteId, tabId) => removeFavorite(favoriteId, tabId),
        onAddTabAsFavorite: tabId => addTabAsFavorite(tabId),
        onDetachFavorite: favoriteId => openFavorite(favoriteId, true),
        toggleNotifications: () => toggleNotifications(ownProps.applicationId),
        openApplicationPreferences: (application: Application) =>
          openApplicationPreferences(application.manifestURL, OpenApplicationPreferencesVia.APP_SUBDOCK),
        onOpenNewTab: () => createNewEmptyTab(ownProps.applicationId, false),
        onClickAddNewInstance: (application: Application, identityNeeded?: boolean) => {
          if (identityNeeded) {
            return requestSignInThenAddApplication('google', undefined, application.manifestURL, 'subdock');
          }
          return installApplication(application.manifestURL, { navigate: true });
        },
      }, dispatch);
    }
  ),
  withGradient(GradientType.withDarkOverlay),
)(SubdockContainerInner);

export default SubdockContainer as React.ComponentType<OuterProps>;

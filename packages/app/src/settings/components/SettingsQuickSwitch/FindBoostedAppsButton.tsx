import { Button, Size, Style } from '@getstation/theme';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getAppStoreTab } from '../../../app-store/selectors';
import { dispatchUrl, navigateToApplicationTab } from '../../../applications/duck';

type StateProps = {
  appStoreTab: any,
};

type DispatchProps = {
  dispatchUrl: (url: string, origin: { tabId: string }) => void,
  navigateToApplicationTab: (appliactionId: string, tabId: string) => void,
};

type MergeProps = {
  navigateToBoostedApps: () => void,
};

export type OwnProps = {
  closeSettings: (via: 'navigate-to-appstore') => void,
};
type Props = OwnProps & MergeProps;

const FindBoostedAppsButton = ({ navigateToBoostedApps, closeSettings }: Props) => {
  const onClick = React.useCallback(() => {
    closeSettings('navigate-to-appstore');
    navigateToBoostedApps();
  }, [navigateToBoostedApps, closeSettings]);

  return (
    <Button btnSize={Size.XSMALL} btnStyle={Style.SECONDARY} onClick={onClick}>
      Find boosted apps
    </Button>
  );
};

const connector = compose(
  // @ts-ignore
  connect<StateProps, DispatchProps, MergeProps>(
    (state: any) => ({
      appStoreTab: getAppStoreTab(state),
    }),
    (dispatch: any) => bindActionCreators({
      dispatchUrl,
      navigateToApplicationTab,
    }, dispatch),
    (stateProps: any, dispatchProps: any, ownProps: any) => ({
      ...ownProps,
      navigateToBoostedApps: () => {
        if (stateProps.appStoreTab) {
          const tab = stateProps.appStoreTab;

          const tabId = tab.get('tabId');

          const url = new URL(tab.get('url'));
          url.hash = '#boosted-apps';

          dispatchProps.dispatchUrl(url.toString(), { tabId });
        }
      },
    })
  ),
);
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
const ConnectedFindBoostedAppsButton = connector(FindBoostedAppsButton) as any;

export default ConnectedFindBoostedAppsButton;
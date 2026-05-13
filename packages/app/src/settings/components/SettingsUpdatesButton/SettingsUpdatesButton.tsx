import { Button, Size } from '@getstation/theme';
import ms = require('ms');
import * as React from 'react';
import {
  withGetAutoUpdateStatus, withCheckForUpdatesMutation, withQuitAndInstallMutation,
} from './queries@local.gql.generated';
import { compose } from 'redux';

export interface Props {
  isDownloadingUpdate: boolean,
  isCheckingUpdate: boolean,
  isUpdateAvailable: boolean,
  releaseName: string,
  checkForUpdates: () => any,
  quitAndInstall: () => any,
}

export interface State {
  justCheckedForUpdate: boolean,
}

const updateButtonStyle: React.CSSProperties = {
  minWidth: 200,
  marginTop: 2,
};

const checkingStyle: React.CSSProperties = {
  display: 'inline-block',
  position: 'relative' as const,
  top: 2,
  width: 10,
  height: 10,
  marginRight: 5,
  borderRadius: '100%',
  backgroundColor: 'transparent',
  border: '2px solid white',
  animation: '3s ease-in-out 0s infinite checking',
};

const infoStyle: React.CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  color: 'rgba(255, 255, 255, .5)',
  textAlign: 'center' as const,
};

class SettingsUpdatesButton extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      justCheckedForUpdate: false,
    };
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.isCheckingUpdate && !this.props.isCheckingUpdate) {
      this.setState({ justCheckedForUpdate: true });

      setTimeout(
        () => this.setState({ justCheckedForUpdate: false }),
        ms('1min')
      );
    }
  }

  render() {
    if (this.props.isCheckingUpdate) {
      return (
        <Button style={updateButtonStyle} btnSize={Size.SMALL} disabled={this.props.isCheckingUpdate}>
          <span style={checkingStyle} />
          {this.props.isDownloadingUpdate ? 'Downloading...' : 'Checking...'}
        </Button>
      );
    }

    if (this.props.isUpdateAvailable) {
      return (
        <div>
          <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={this.props.quitAndInstall} download={true}>
            Quit to install the latest version
          </Button>

          <p style={infoStyle}>New version available ({this.props.releaseName})</p>
        </div>
      );
    }

    if (!this.props.isUpdateAvailable && this.state.justCheckedForUpdate) {
      return (
        <div>
          <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={this.props.checkForUpdates}>
            No new updates
          </Button>

          <p style={infoStyle}>You have the most recent version</p>
        </div>

      );
    }

    return (
      <Button style={updateButtonStyle} btnSize={Size.SMALL} onClick={this.props.checkForUpdates}>
        Check for updates
      </Button>
    );
  }
}

const connect = compose(
  withGetAutoUpdateStatus({
    props: ({ data }) => ({
      isDownloadingUpdate: data && data.autoUpdateStatus && data.autoUpdateStatus.isDownloadingUpdate ?
        data.autoUpdateStatus.isDownloadingUpdate : false,
      isCheckingUpdate: data && data.autoUpdateStatus && data.autoUpdateStatus.isCheckingUpdate ?
        data.autoUpdateStatus.isCheckingUpdate : false,
      isUpdateAvailable: data && data.autoUpdateStatus && data.autoUpdateStatus.isUpdateAvailable ?
        data.autoUpdateStatus.isUpdateAvailable : false,
      releaseName: data && data.autoUpdateStatus && data.autoUpdateStatus.releaseName ?
        data.autoUpdateStatus.releaseName : null,
    }),
  }),
  withCheckForUpdatesMutation({
    props: ({ mutate }) => ({
      checkForUpdates: () => mutate && mutate({ variables: { } }),
    }),
  }),
  withQuitAndInstallMutation({
    props: ({ mutate }) => ({
      quitAndInstall: () => mutate && mutate({ variables: { } }),
    }),
  }),
);

export default connect(SettingsUpdatesButton);
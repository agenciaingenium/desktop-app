import { theme } from '@getstation/theme';
import React from 'react';

export interface Props {
  isDownloadingUpdate: boolean,
  appName: string,
  appVersion: string,
  isCheckingUpdate: boolean,
  isUpdateAvailable: boolean,
  checkForUpdates: () => any,
  quitAndInstall: () => any,
  releaseName: string,
}

const thinStyle: React.CSSProperties = {
  marginLeft: 3,
  fontWeight: 400,
  opacity: 0.5,
};

const versionStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 'bold',
};

export default class AboutWindowVersions extends React.PureComponent<Props, {}> {
  render() {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25 }}>
        <div>
          <div style={theme.titles.h2}>
            {this.props.appName}
            <span style={thinStyle}>version {this.props.appVersion}</span>
          </div>
          <p style={{ marginTop: 8, marginBottom: 10, fontSize: 11, opacity: 0.7 }}>
            Community-maintained fork
          </p>

          <p style={versionStyle}>
            Electron
            <span style={thinStyle}>{process.versions.electron}</span>
          </p>
          <p style={versionStyle}>
            Chrome
            <span style={thinStyle}>{process.versions.chrome}</span>
          </p>
          <p style={versionStyle}>
            Node
            <span style={thinStyle}>{process.versions.node}</span>
          </p>
          <p style={versionStyle}>
            v8
            <span style={thinStyle}>{process.versions.v8}</span>
          </p>
        </div>
      </div>
    );
  }
}

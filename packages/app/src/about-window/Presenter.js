import { theme } from '@getstation/theme';
import PropTypes from 'prop-types';
import React from 'react';
import SVGInline from 'react-svg-inline';

import OSBar from '../os-bar/OSBar';
import AboutWindowFooter from './components/AboutWindowFooter';
import AboutWindowVersions from './components/AboutWindowVersions';
import { getSVG } from '../theme/api';
import { isDarwin } from '../utils/process';

class AboutWindowPresenter extends React.PureComponent {
  static propTypes = {
    isDownloadingUpdate: PropTypes.bool.isRequired,
    isCheckingUpdate: PropTypes.bool.isRequired,
    isUpdateAvailable: PropTypes.bool.isRequired,
    checkForUpdates: PropTypes.func.isRequired,
    releaseName: PropTypes.string,
    quitAndInstall: PropTypes.func.isRequired,
    themeColors: PropTypes.array.isRequired,
    themeGradient: PropTypes.string,
    appName: PropTypes.string,
    appVersion: PropTypes.string,
  };

  static defaultProps = {
    releaseName: undefined,
  }

  render() {
    const { themeColors, themeGradient } = this.props;

    const inlineSVG = getSVG(themeColors, 80, false);

    return (
      <div style={{ height: '100%', backgroundColor: theme.colors.gray.light }}>
        { isDarwin && <OSBar /> }

        <div style={{ display: 'flex', flex: 1, position: 'relative', height: '100%', padding: '40px 60px 60px 40px', color: theme.colors.gray.dark }}>
          <SVGInline svg={inlineSVG} />

          <div style={{ flex: 1, position: 'relative', margin: '4px 100px 0 30px' }}>
            <AboutWindowVersions
              isDownloadingUpdate={this.props.isDownloadingUpdate}
              isCheckingUpdate={this.props.isCheckingUpdate}
              isUpdateAvailable={this.props.isUpdateAvailable}
              checkForUpdates={this.props.checkForUpdates}
              quitAndInstall={this.props.quitAndInstall}
              releaseName={this.props.releaseName}
              appName={this.props.appName}
              appVersion={this.props.appVersion}
            />

            <AboutWindowFooter />
          </div>
        </div>

        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 100,
          height: '100%',
          backgroundImage: themeGradient,
        }} />
      </div>
    );
  }
}

export default AboutWindowPresenter;

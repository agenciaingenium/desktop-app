import { Icon, IconSymbol, theme } from '@getstation/theme';
import React from 'react';
import * as log from 'electron-log';
import { logger } from '../../api/logger';

import ApplicationBasicAuth from './ApplicationBasicAuth';
import ApplicationError from './ApplicationError';
import ApplicationLoading from './ApplicationLoading';
import ApplicationAboutBlank from './ApplicationAboutBlank';
import { Maybe } from 'graphql/jsutils/Maybe';

export interface OwnProps {
  ready: boolean,
  applicationId: string,
  applicationName: Maybe<string>,
  applicationIcon: Maybe<string>,
  manifestURL: Maybe<string>,

  crashed: boolean,
  errorCode: any,
  errorDescription: any,

  themeGradient: string,
  tabUrl: string,

  email: Maybe<string>,
  promptBasicAuth?: boolean,
  performBasicAuth: (username: string, password: string) => any,
  authInfoHost: any,
  authInfoRealm: any,

  canGoBack: boolean,
  webView: any,

  goBack: () => void,
  onChooseAccount: any,
  onApplicationRemoved: () => any,
  askResetApplication: () => void,
}

export interface StateProps {

}

export type Props = OwnProps & StateProps;

class ApplicationContainer extends React.PureComponent<Props, {}> {

  handleNavigateAboutBlank = () => {
    const { manifestURL, applicationName } = this.props;

    log.debug(`'${applicationName}' navigate on about:blank page`);
    logger.notify(
      new Error('about:blank page'),
      { metaData: { manifestURL } },
    );
  }

  render() {
    const {
      ready, crashed, errorCode, errorDescription, webView, promptBasicAuth,
      applicationName, applicationIcon, email, performBasicAuth, authInfoHost, authInfoRealm,
      tabUrl, canGoBack, goBack,
      askResetApplication, manifestURL, themeGradient,
    } = this.props;

    const hasError = crashed || typeof errorCode === 'number';
    const isAboutBlank = tabUrl === 'about:blank';

    if (ready && !hasError && !promptBasicAuth && !isAboutBlank) return null;

    const smallIcon = promptBasicAuth;
    const stopAnimation = crashed || promptBasicAuth;

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: theme.dock.size,
      right: 0,
      backgroundImage: themeGradient,
      zIndex: 100,
      padding: '10px',
    };

    const iconStyle: React.CSSProperties = {
      width: smallIcon ? 60 : 120,
      height: smallIcon ? 60 : 120,
      animation: stopAnimation ? 'none' : '3s ease-in-out 0s infinite pulsation',
    };

    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255, 0.1)',
          borderRadius: '3px',
          height: '100%',
          color: 'white',
          fontSize: '14px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: smallIcon ? 80 : 160,
            height: smallIcon ? 80 : 160,
            marginBottom: 30,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, .3)',
            position: 'relative',
          }}>
            { this.props.applicationIcon &&
            <img style={iconStyle} src={this.props.applicationIcon} alt="Icon"/>
            }
            {
              crashed &&
              <Icon
                size={96}
                symbolId={IconSymbol.UNHAPPY}
                style={{ opacity: 0.8, position: 'absolute', bottom: '-16px', right: '-16px' }}
              />
            }
          </div>

          { !ready &&
            <ApplicationLoading
              manifestURL={manifestURL}
              applicationName={applicationName}
              applicationIcon={applicationIcon}
              email={email}
            />
          }

          {tabUrl === 'about:blank' &&
            <ApplicationAboutBlank
              onDidMount={this.handleNavigateAboutBlank}
              applicationName={applicationName}
              canGoBack={canGoBack}
              onGoBack={goBack}
              onClickResetApplication={askResetApplication}
            />
          }

          {
            <ApplicationError
              tabUrl={tabUrl}
              crashed={crashed}
              errorCode={errorCode}
              errorDescription={errorDescription}
              webView={webView}
              applicationName={applicationName}
            />
          }

          { promptBasicAuth &&
            <ApplicationBasicAuth
              applicationIcon={applicationIcon}
              performBasicAuth={performBasicAuth}
              authInfoHost={authInfoHost}
              authInfoRealm={authInfoRealm}
            />
          }
        </div>
      </div>
    );
  }
}

export default ApplicationContainer;
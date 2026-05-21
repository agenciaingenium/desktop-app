import { Button, Style } from '@getstation/theme';
// @ts-ignore: no declaration file
import * as networkErrors from 'chromium-net-errors';
import { Maybe } from 'graphql/jsutils/Maybe';
import * as React from 'react';

export interface Props {
  crashed: boolean,
  errorCode: any,
  errorDescription: any,
  webView: any,
  applicationName: Maybe<string>,
  tabUrl: string,
}

export default class ApplicationLoadingContainer extends React.PureComponent<Props, {}> {
  hasError = () => {
    if (this.props.crashed) return true;
    return typeof this.props.errorCode === 'number';
  }

  handleReloadClick() {
    if (this.props.webView && this.props.webView.isReady()) this.props.webView.reload();
  }

  renderErrorMessage = () => {
    const { crashed, errorCode, errorDescription, tabUrl } = this.props;
    const errorObject = this.hasError() ? networkErrors.createByCode(errorCode) : null;

    if (!crashed && errorObject) {
      return (
        <>
          <div>{errorObject.message} ({errorCode}:{errorDescription})</div>
          <div>URL: {tabUrl}</div>
        </>
      );
    }
    return null;
  }

  render() {
    const { applicationName } = this.props;

    return (
      <div style={{ color: 'white', textAlign: 'center' }}>
        { this.hasError() &&
          <div>
            <div>We can't load {applicationName}...</div>
            {this.renderErrorMessage()}
            <Button
              btnStyle={Style.SECONDARY}
              className={{ width: '100%', marginTop: 20 }}
              onClick={() => this.handleReloadClick()}
            >
              Try reloading
            </Button>
          </div>
        }
      </div>
    );
  }
}
import { Button, Style } from '@getstation/theme';
import { Maybe } from 'graphql/jsutils/Maybe';
import * as React from 'react';

export interface Props {
  applicationName: Maybe<string>,
  canGoBack: boolean,
  onGoBack: () => void,
  onClickResetApplication: () => void,
  onDidMount: () => void,
}

export default class ApplicationAboutBlank extends React.PureComponent<Props, {}> {
  static defaultProps = {
    onDidMount: () => {},
  };

  componentDidMount() {
    this.props.onDidMount();
  }

  handleClickResetApplication = () => {
    this.props.onClickResetApplication();
  }

  handleClickGoBack = () => {
    this.props.onGoBack();
  }

  render() {
    const { applicationName, canGoBack } = this.props;

    return (
      <div style={{ color: 'white', textAlign: 'center' }}>
        <div>
          <div>Something went wrong with {applicationName}, you navigated on a blank page</div>
          <Button
            btnStyle={Style.SECONDARY}
            className={{ width: '100%', marginTop: 20 }}
            onClick={canGoBack ? this.handleClickGoBack : this.handleClickResetApplication}
          >
            {canGoBack ? 'Go Back' : 'Reset application'}
          </Button>
        </div>
      </div>
    );
  }
}
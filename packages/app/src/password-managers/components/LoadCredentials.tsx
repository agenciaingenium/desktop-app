import { Modal } from '@getstation/theme';
import React from 'react';

export interface Props {
  applicationName: string,
  applicationIcon: string,
  themeColor: string,
  providerName: string,
}

export default class LoadCredentials extends React.PureComponent<Props, {}> {

  render() {
    const { themeColor, applicationName, applicationIcon, providerName } = this.props;
    const description: any = (<div>We are loading your credentials<br />from {providerName} to {applicationName}</div>);

    return (
      <Modal
        title={`Please wait...`}
        description={description}
        applicationIcon={applicationIcon}
        themeColor={themeColor}
        isLoading={true}
      >
        <div style={{ marginTop: 50, height: 180 }} />
      </Modal>
    );
  }
}
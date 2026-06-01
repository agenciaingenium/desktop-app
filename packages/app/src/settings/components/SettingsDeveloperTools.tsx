import { Button, Size } from '@getstation/theme';
import React from 'react';

export interface Props {
  onClickOpenProcessManager: () => void,
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  paddingTop: '10px',
  paddingBottom: '10px',
};

const settingNameStyle: React.CSSProperties = {
  marginBottom: 8,
  textTransform: 'uppercase',
  fontSize: 14,
  fontWeight: 'bold',
};

const buttonStyle: React.CSSProperties = {
  marginTop: 10,
};

export default class SettingsDeveloperTools extends React.PureComponent<Props, {}> {
  render() {
    const { onClickOpenProcessManager } = this.props;

    return (
      <div style={containerStyle}>
        <div>
          <p style={settingNameStyle}>developer tools</p>
          <Button
            onClick={() => onClickOpenProcessManager()}
            style={buttonStyle}
            btnSize={Size.XXSMALL}
          >
            Open Process Manager
          </Button>
        </div>
      </div>
    );
  }
}
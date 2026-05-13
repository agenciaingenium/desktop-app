import { Button, Size, Style } from '@getstation/theme';
import * as React from 'react';
import gDriveIcon from '../../static/bang/googledrive.svg';

export interface Props {
  isGDriveConnected: boolean,
  onGDriveConnect: () => any,
}

const containerStyle: React.CSSProperties = {
  left: '5%',
  top: 'calc(50% - 26px)',
  display: 'flex',
  width: '90%',
  flexDirection: 'column',
  margin: 'auto',
  color: 'white',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  margin: '15px 0',
  padding: 10,
  backgroundColor: 'rgba(0, 0, 0, .1)',
  fontSize: 11,
  borderRadius: 100,
  border: '1px solid rgba(255, 255, 255, .1)',
};

const gdriveIconStyle: React.CSSProperties = {
  width: 30,
};

const gdriveDescStyle: React.CSSProperties = {
  margin: '0 10px',
};

export default class BangInsert extends React.PureComponent<Props> {

  constructor(props: Props) {
    super(props);
  }

  renderGDriveTooltip() {
    const { onGDriveConnect } = this.props;

    return (
      <div style={itemStyle}>

        <img style={gdriveIconStyle} src={gDriveIcon} />

        <p style={gdriveDescStyle}>Access Google Docs and Sheets with the Quick Switch</p>

        <Button
          style={{ flexShrink: 0 }}
          onClick={onGDriveConnect}
          btnSize={Size.SMALL}
          btnStyle={Style.SECONDARY}
        >
          Connect Google Drive
        </Button>
      </div>
    );
  }

  render() {
    const { isGDriveConnected } = this.props;

    return (
      <div style={containerStyle}>
        {!isGDriveConnected &&
          this.renderGDriveTooltip()
        }
      </div>
    );
  }
}
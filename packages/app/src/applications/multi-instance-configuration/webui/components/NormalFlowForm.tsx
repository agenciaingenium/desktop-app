import React from 'react';

export type OwnProps = {
  appHostname: string,
  onClickUseSelfInstance: () => void,
  onClickGoToApp: () => void,
  selfInstanceHint?: string,
};

const accountContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const accountStyle: React.CSSProperties = {
  width: 220,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 40,
  marginBottom: 2,
  padding: '12px 8px',
  fontSize: 11,
  fontWeight: 'bold',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  transition: 'background-color 100ms ease-out',
  cursor: 'pointer',
};

const accountDetailStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  width: 0,
  marginRight: 2,
  justifyContent: 'center',
};

class NormalFlowForm extends React.PureComponent<OwnProps> {

  render() {
    const { appHostname, onClickUseSelfInstance, onClickGoToApp } = this.props;

    return (
      <ul style={accountContainerStyle}>
        <li
          style={{ ...accountStyle, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
          onClick={onClickGoToApp}
        >
          <div style={accountDetailStyle}>
           {`Go to ${appHostname}`}
          </div>
        </li>
        <li
          style={{ ...accountStyle, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}
          onClick={onClickUseSelfInstance}
          title={this.props.selfInstanceHint}
        >
          <div style={accountDetailStyle}>
            I use a self-hosted instance
          </div>
        </li>
      </ul>
    );
  }
}

export default NormalFlowForm as React.ComponentType<OwnProps>;
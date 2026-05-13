import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { compose } from 'redux';
import { withGetMinimizeToTrayStatus, withEnableMinimizeToTray } from './queries@local.gql.generated';

export interface Props {
  isMinimizeToTray: boolean,
  onMinimizeToTray: (enabled: boolean) => any
  loading: boolean,
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

class SettingsMinimizeToTray extends React.Component<Props, {}> {
  render() {
    const { loading, isMinimizeToTray } = this.props;

    const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      this.props.onMinimizeToTray(e.target.checked);
    return (
      <div style={containerStyle}>
        <div>
          <p style={settingNameStyle}>TRAY ICON</p>
          <Switcher
            disabled={loading}
            checked={isMinimizeToTray}
            onChange={handleSwitcherChange}
          />
          <div>
            Minimize application to tray
          </div>
        </div>
      </div>
    );
  }
}

const connect = compose(
  withGetMinimizeToTrayStatus({
    props: ({ data }) => ({
      loading: !data || data.loading,
      isMinimizeToTray: !!data && Boolean(data.minimizeToTray),
    }),
  }),
  withEnableMinimizeToTray({
    props: ({ mutate }) => ({
      onMinimizeToTray: (enabled: boolean) => mutate && mutate({ variables: { enabled } }),
    }),
  }),
);

export default connect(SettingsMinimizeToTray);
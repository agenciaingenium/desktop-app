import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { compose } from 'redux';
import { withGetAutolaunchStatus, withEnableAutoLaunch } from './queries@local.gql.generated';

export interface Props {
  isAutoLaunchEnabled: boolean,
  onEnableAutoLaunch: (enabled: boolean) => any
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

class SettingsAutoLaunch extends React.Component<Props, {}> {
  render() {
    const { loading, isAutoLaunchEnabled } = this.props;

    const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      this.props.onEnableAutoLaunch(e.target.checked);
    return (
      <div style={containerStyle}>
        <div>
          <p style={settingNameStyle}>auto launch</p>
          <Switcher
            disabled={loading}
            checked={isAutoLaunchEnabled}
            onChange={handleSwitcherChange}
          />
          <div>
            Launch Station on login
          </div>
        </div>
      </div>
    );
  }
}

const connect = compose(
  withGetAutolaunchStatus({
    props: ({ data }) => ({
      loading: !data || data.loading,
      isAutoLaunchEnabled: !!data && Boolean(data.autoLaunchEnabled),
    }),
  }),
  withEnableAutoLaunch({
    props: ({ mutate }) => ({
      onEnableAutoLaunch: (enabled: boolean) => mutate && mutate({ variables: { enabled } }),
    }),
  }),
);

export default connect(SettingsAutoLaunch);
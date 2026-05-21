import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { useGetAutolaunchStatusQuery, useEnableAutoLaunchMutation } from './queries@local.gql.generated';

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

const SettingsAutoLaunch: React.FC = () => {
  const { data, loading } = useGetAutolaunchStatusQuery();
  const [enableAutoLaunch] = useEnableAutoLaunchMutation();

  const isAutoLaunchEnabled = !!data && Boolean(data.autoLaunchEnabled);

  const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    enableAutoLaunch({ variables: { enabled: e.target.checked } });

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
};

export default SettingsAutoLaunch;

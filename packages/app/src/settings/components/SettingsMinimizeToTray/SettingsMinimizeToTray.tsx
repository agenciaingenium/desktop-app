import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { useGetMinimizeToTrayStatusQuery, useEnableMinimizeToTrayMutation } from './queries@local.gql.generated';

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

const SettingsMinimizeToTray: React.FC = () => {
  const { data, loading } = useGetMinimizeToTrayStatusQuery();
  const [enableMinimizeToTray] = useEnableMinimizeToTrayMutation();

  const isMinimizeToTray = !!data && Boolean(data.minimizeToTray);

  const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    enableMinimizeToTray({ variables: { enabled: e.target.checked } });

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
};

export default SettingsMinimizeToTray;

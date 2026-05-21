import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { useGetHideMainMenuStatusQuery, useEnableHideMainMenuMutation } from './queries@local.gql.generated';

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

const SettingsHideMainMenu: React.FC = () => {
  const { data, loading } = useGetHideMainMenuStatusQuery();
  const [enableHideMainMenu] = useEnableHideMainMenuMutation();

  const isHideMainMenu = !!data && Boolean(data.hideMainMenu);

  const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    enableHideMainMenu({ variables: { hide: e.target.checked } });

  return (
    <div style={containerStyle}>
      <div>
        <p style={settingNameStyle}>main menu</p>
        <Switcher
          disabled={loading}
          checked={isHideMainMenu}
          onChange={handleSwitcherChange}
        />
        <div>
          Hide main menu
        </div>
      </div>
    </div>
  );
};

export default SettingsHideMainMenu;

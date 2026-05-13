import { Switcher } from '@getstation/theme';
import * as React from 'react';
import { compose } from 'redux';
import { withGetHideMainMenuStatus, withEnableHideMainMenu } from './queries@local.gql.generated';

export interface Props {
  isHideMainMenu: boolean,
  onHideMainMenu: (hide: boolean) => any
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

class SettingsHideMainMenu extends React.Component<Props, {}> {
  render() {
    const { loading, isHideMainMenu } = this.props;

    const handleSwitcherChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      this.props.onHideMainMenu(e.target.checked);
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
  }
}

const connect = compose(
  withGetHideMainMenuStatus({
    props: ({ data }) => ({
      loading: !data || data.loading,
      isHideMainMenu: !!data && Boolean(data.hideMainMenu),
    }),
  }),
  withEnableHideMainMenu({
    props: ({ mutate }) => ({
      onHideMainMenu: (hide: boolean) => mutate && mutate({ variables: { hide } }),
    }),
  }),
);

export default connect(SettingsHideMainMenu);
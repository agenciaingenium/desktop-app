import Immutable from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import { theme } from '@getstation/theme';
import AddPasswordManager from './components/AddPasswordManager';
import ConfigurePasswordManager from './components/ConfigurePasswordManager';
import ListPasswordManagers from './components/ListPasswordManagers';
import { addPasswordManager, AddPasswordManagerAction, ConfigurationStep, removePasswordManager } from './duck';
import Providers from './providers/';
import { getConfigurationProcess, getPasswordManager, getProviderJS } from './selectors';
import { PasswordManager, Provider } from './types';

const containerStyle: React.CSSProperties = {
  padding: 20,
  borderTop: '1px solid rgba(255, 255, 255, .1)',
};

const titleStyle: React.CSSProperties = {
  ...theme.fontMixin(12, 'bold'),
  marginBottom: 15,
};

export interface Props {
  configurationProcess: AddPasswordManagerAction,
  canConfigure: boolean,
  canAddPasswordManager: boolean,
  passwordManagers: any,
  provider: Provider,
  onConnect: (provider: Provider, payload: object) => void,
  onCancel: (provider: Provider) => void,
  onLogout: (passwordManager: object) => void,
  onAdd: (provider: Provider) => void,
}

export interface OverridableProps {
}

class PasswordManagerSubdockImpl extends React.PureComponent<Props & OverridableProps, {}> {
  render() {
    const {
      canConfigure,
      configurationProcess,
      canAddPasswordManager,
      passwordManagers,
      provider,
      onConnect,
      onCancel,
      onLogout,
      onAdd,
    } = this.props;

    const providers = Object.values(Providers);

    return (
      <div style={containerStyle}>
        <div style={titleStyle}>Password Managers</div>

        { canConfigure &&
        <ConfigurePasswordManager
          provider={provider}
          configurationProcess={configurationProcess}
          onConnect={onConnect}
          onCancel={onCancel}
        />
        }

        <ListPasswordManagers passwordManagers={passwordManagers} onLogout={onLogout} />

        { canAddPasswordManager &&
          <AddPasswordManager providers={providers} onAdd={onAdd} />
        }
      </div>
    );
  }
}

const PasswordManagerSubdock = connect<any, any, OverridableProps>(
  // @ts-ignore
  (state: Immutable.Map<string, any>) => ({
    configurationProcess: getConfigurationProcess(state),
    canConfigure: getConfigurationProcess(state).step !== ConfigurationStep.NotStarted,
    canAddPasswordManager: getConfigurationProcess(state).step === ConfigurationStep.NotStarted && !getPasswordManager(state),
    passwordManagers: getPasswordManager(state) ? [getPasswordManager(state)] : [],
    provider: getProviderJS(state),
  }),
  (dispatch: Dispatch<any>) => bindActionCreators({
    onLogout: (passwordManager: PasswordManager) => removePasswordManager({ passwordManager }),
    onAdd: (provider: Provider) => addPasswordManager({
      step: ConfigurationStep.Credentials,
      provider,
    }),
    onConnect: (provider: Provider, credentials: any) => addPasswordManager({ step: ConfigurationStep.Test, provider, payload: credentials }),
    onCancel: (provider: Provider) => addPasswordManager({
      step: ConfigurationStep.Cancel,
      provider,
    }),
  }, dispatch)
)(PasswordManagerSubdockImpl);

export default PasswordManagerSubdock;

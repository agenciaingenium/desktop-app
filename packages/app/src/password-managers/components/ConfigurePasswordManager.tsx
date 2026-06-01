import React from 'react';
import { Provider } from '../types';
import { ProvidersForm } from '../providers';
import { AddPasswordManagerAction, ConfigurationStep } from '../duck';

export interface Props {
  provider: Provider,
  configurationProcess: AddPasswordManagerAction,
  onConnect: (provider: Provider, payload: object) => any,
  onCancel?: (provider: Provider) => any,
}

export interface OverridableProps {
}

export default class ConfigurePasswordManager extends React.PureComponent<Props & OverridableProps, {}> {
  render() {
    const {
      provider,
      configurationProcess,
      onConnect,
      onCancel,
    } = this.props;

    const ProviderForm = (ProvidersForm as any)[provider.id];
    const error = configurationProcess.step === ConfigurationStep.Error ? configurationProcess.payload : null;

    return (
      <ProviderForm
        configurationProcess={configurationProcess}
        onConnect={onConnect}
        onCancel={onCancel}
        error={error}
      />
    );
  }
}
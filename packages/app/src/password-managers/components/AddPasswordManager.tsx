import { Button, Style } from '@getstation/theme';
import * as React from 'react';
import { Provider } from '../types';

export interface Props {
  providers: Provider[],
  onAdd: (provider: Provider) => void,
}

export interface OverridableProps {
}

export default class AddPasswordManager extends React.PureComponent<Props & OverridableProps, {}> {

  render() {
    const { providers, onAdd } = this.props;

    const passwordManagers = providers.map((provider) => {
      const { id, name } = provider;

      return (
        <Button
          key={id}
          onClick={() => onAdd(provider)}
          btnStyle={Style.SECONDARY}
          style={{ width: '100%' }}
        >
          Connect {name}
        </Button>
      );
    });

    return (
      <div>
        {passwordManagers}
      </div>
    );
  }
}
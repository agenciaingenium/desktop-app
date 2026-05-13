import { Input, InputType, Modal } from '@getstation/theme';
import * as React from 'react';
import { UnlockStep } from '../duck';
import { PasswordManager } from '../types';

export interface Props {
  process: any,
  passwordManager: PasswordManager,
  onUnlock: (passwordManager: PasswordManager, payload: any) => void,
  onCancel: () => void,
  providerName: string,
  applicationName: string,
}

export interface State {
  masterPassword: string,
}

export default class Unlock extends React.PureComponent<Props, State> {
  constructor(args: Props) {
    super(args);
    this.state = {
      masterPassword: '',
    };

    this.onUnlock = this.onUnlock.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { process: { step } } = prevProps;

    if (step === UnlockStep.Test && this.props.process.step === UnlockStep.Error) {
      this.setState({ masterPassword: '' });
    }
  }

  handleKeyUp(e: React.KeyboardEvent<HTMLElement>) {
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        this.onUnlock();
        break;
      }
      default:
        return;
    }
  }

  onUnlock() {
    const { passwordManager, onUnlock } = this.props;
    onUnlock(passwordManager, this.state);
  }

  render() {
    const { process, providerName, applicationName, onCancel } = this.props;

    return (
      <Modal
        title={`Confirm your ${providerName} password`}
        description={`Do you want to auto fill your ${applicationName} credentials?`}
        onCancel={onCancel}
        onContinue={this.onUnlock}
        continueContent={'Submit'}
        classNameModalBody="unlock-body"
        isLoading={[UnlockStep.Test, UnlockStep.Finish].includes(process.step)}
      >
        <Input
          type={InputType.PASSWORD}
          label={'Your password'}
          autoFocus={true}
          value={this.state.masterPassword}
          error={process.step === UnlockStep.Error ? process.payload : null}
          placeholder={'**********'}
          onChange={(event: any) => this.setState({ masterPassword: event.target.value })}
          onKeyUp={this.handleKeyUp}
        />
      </Modal>
    );
  }
}
import { Button, Input, InputType, Style, theme } from '@getstation/theme';
// @ts-ignore: no declaration file
import * as isBlank from 'is-blank';
import * as React from 'react';
import { AddPasswordManagerAction, ConfigurationStep } from '../../duck';
import Providers from '../../providers';
import { Provider } from '../../types';

export interface Props {
  configurationProcess: AddPasswordManagerAction,
  onConnect: (provider: Provider, payload: object) => any,
  onCancel: (provider: Provider) => any,
  error: string,
}

export interface OverridableProps {
}

export interface State {
  id: string,
  domain: string,
  email: string,
  secretKey: string,
  masterPassword: string,
  errors: any,
}

const onboardStyle: React.CSSProperties = {
  marginBottom: 8,
  fontSize: '12px',
  color: 'rgba(255,255,255,1)',
  textAlign: 'left',
  fontStyle: 'italic',
  fontWeight: 600,
};

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 30,
};

const marginBottomStyle: React.CSSProperties = {
  marginBottom: 15,
};

const errorStyle: React.CSSProperties = {
  marginBottom: 15,
  ...theme.fontMixin(12, 'bold'),
  color: theme.colors.error,
};

export default class OnePasswordForm extends React.PureComponent<Props & OverridableProps, State> {
  static onePasswordDomains = ['.1password.com', '.1password.ca', '1password.eu'];

  constructor(args: any) {
    super(args);
    this.state = {
      id: '',
      domain: '',
      email: '',
      secretKey: '',
      masterPassword: '',
      errors: {},
    };

    this.onSubmitCredentials = this.onSubmitCredentials.bind(this);
  }

  static trimCredentials(credentials: any) {
    const domainOnly = credentials.domain.replace(/^https?:\/\//, '').toLowerCase().split('/')[0];
    const credentialsWithDomainOnly = Object.assign({}, credentials, { domain: domainOnly, id: domainOnly });
    return Object
      .entries(credentialsWithDomainOnly)
      .map(([k, v]: any[]) => [k, v.trim()])
      // @ts-ignore
      .reduce((result, [k, v]: [string, any]) => {
        result[k] = v;
        return result;
      }, {} as any);
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { configurationProcess: { step } } = prevProps;

    if (step === ConfigurationStep.Test && this.props.configurationProcess.step === ConfigurationStep.Error) {
      this.setState({ masterPassword: '' });
    }
  }

  onSubmitCredentials() {
    const { ...credentials } = this.state;
    const cleanCredentials = OnePasswordForm.trimCredentials(credentials);

    if (this.isValidFormatCredentials(cleanCredentials)) {
      this.props.onConnect(Providers.onePassword, cleanCredentials);
    }
  }

  isValidFormatCredentials(credentials: any) {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const { domain, email, secretKey, masterPassword } = credentials;

    const validDomain = !isBlank(domain) && OnePasswordForm.onePasswordDomains.some(opDomain => domain.endsWith(opDomain));
    const validEmail = !isBlank(email) && emailRegex.test(email.toLowerCase());
    const validSecretKey = !isBlank(secretKey) && secretKey.length >= 34 && secretKey.split('-')[0].length === 2;
    const validMasterPassword = !isBlank(masterPassword);

    const isValidCredentialsFormat = validDomain && validEmail && validSecretKey && validMasterPassword;

    const errors: any = {};

    if (!validDomain) errors.domain = 'Invalid 1Password domain format';
    if (!validEmail) errors.email = 'Invalid email format';
    if (!validSecretKey) errors.secretKey = 'Invalid Secret Key format';
    if (!validMasterPassword) errors.masterPassword = 'Master Password required';

    if (!isValidCredentialsFormat) this.setState({ errors });

    return isValidCredentialsFormat;
  }

  render() {
    const { error, onCancel } = this.props;

    return (
      <div>
        <div className="onepassword-onboard" style={onboardStyle}>
          👉
          <a
            href="http://faq.getstation.com/login-and-passwords/how-to-use-1password-integration"
            target="_blank"
          >
            Detailed instructions on 1Password
          </a>
        </div>
        { error &&
          <div style={errorStyle}>{error}</div>
        }
        <Input
          type={InputType.TEXT}
          label={'Domain'}
          style={marginBottomStyle}
          autoFocus={true}
          error={this.state.errors.domain}
          placeholder={'domain.1password.com'}
          value={this.state.domain}
          onChange={(event: any) => this.setState({ id: event.target.value, domain: event.target.value })}
        />

        <Input
          type={InputType.TEXT}
          label={'Email'}
          style={marginBottomStyle}
          error={this.state.errors.email}
          placeholder={'your@email.com'}
          value={this.state.email}
          onChange={(event: any) => this.setState({ email: event.target.value })}
        />

        <Input
          type={InputType.TEXT}
          label={'Secret Key'}
          style={marginBottomStyle}
          error={this.state.errors.secretKey}
          placeholder={'XX-XXXXXX-XXXXXX-XXXXXX'}
          value={this.state.secretKey}
          onChange={(event: any) => this.setState({ secretKey: event.target.value.toUpperCase() })}
        />

        <Input
          type={InputType.PASSWORD}
          label={'Master Password'}
          style={marginBottomStyle}
          error={this.state.errors.masterPassword}
          placeholder={'******'}
          value={this.state.masterPassword}
          onChange={(event: any) => this.setState({ masterPassword: event.target.value })}
        />

        <div className="onepassword-buttons-container" style={buttonsContainerStyle}>
          <Button
            btnStyle={Style.SECONDARY}
            onClick={() => {
              onCancel(Providers.onePassword);
            }}
          >
            Cancel
          </Button>
          <Button
            btnStyle={Style.PRIMARY}
            onClick={this.onSubmitCredentials}
          >
            Log in
          </Button>
        </div>
      </div>
    );
  }
}
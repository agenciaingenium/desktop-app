import { Button, Style } from '@getstation/theme';
import { Maybe } from 'graphql/jsutils/Maybe';
import React from 'react';

export interface Props {
  applicationIcon: Maybe<string>,
  performBasicAuth: (username: string, password: string) => any,
  authInfoHost: string,
  authInfoRealm: string,
}

export interface State {
  username: string,
  password: string,
}

const containerStyle: React.CSSProperties = {
  width: 240,
  color: 'white',
  textAlign: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 0,
  padding: 10,
  color: 'white',
  backgroundColor: 'rgba(255, 255, 255, .3)',
  fontSize: 15,
  borderRadius: 3,
};

export default class BasicAuth extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      username: '',
      password: '',
    };
  }

  handleBasicAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { username, password } = this.state;
    this.props.performBasicAuth(username, password);
    this.setState({ username: '', password: '' });
  }

  handleUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ username: event.target.value });
  }

  handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ password: event.target.value });
  }

  render() {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: 30, fontWeight: 300, marginBottom: 5 }}>Authentication</div>

        <div style={{ fontStyle: 'italic' }}>
          {this.props.authInfoHost}
        </div>

        <div style={{ margin: '40px 0 20px', fontSize: 17 }}>
          {this.props.authInfoRealm}
        </div>

        <form style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }} onSubmit={e => this.handleBasicAuth(e)}>
          <input
            className="basic-auth-input"
            style={inputStyle}
            type="text"
            name="login"
            placeholder="Login"
            value={this.state.username}
            onChange={e => this.handleUsernameChange(e)}
            autoFocus={true}
          />

          <input
            className="basic-auth-input"
            style={inputStyle}
            type="password"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={e => this.handlePasswordChange(e)}
          />

          <Button
            btnStyle={Style.SECONDARY}
            type="submit"
            style={{ width: '100%', marginTop: 20 }}
          >
            Connect
          </Button>
        </form>
      </div>
    );
  }
}
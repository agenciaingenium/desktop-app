import Maybe from 'graphql/tsutils/Maybe';
import * as React from 'react';

export interface Props {
  applicationName: Maybe<string>,
  manifestURL: Maybe<string>,
  email: Maybe<string>,
  applicationIcon: Maybe<string>,
}

const containerStyle: React.CSSProperties = {
  maxWidth: 500,
  textAlign: 'center',
};

const contentStyle: React.CSSProperties = {
  color: 'white',
  fontSize: 13,
};

export default class Loading extends React.PureComponent<Props, {}> {
  render() {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <p><strong>Wait while we load {this.props.applicationName}...</strong></p>

          { this.props.email &&
          <span>You are logged in as {this.props.email}</span>
          }
        </div>
      </div>
    );
  }
}
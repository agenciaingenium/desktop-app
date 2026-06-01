import * as React from 'react';

export interface Props {
  children?: React.ReactNode,
}

export default class StationApplication extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

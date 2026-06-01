import React from 'react';

export default class ConsoleErrorBoundary extends React.PureComponent<{children?: React.ReactNode}> {
  componentDidCatch(error: Error) {
    console.error(error);
    throw error;
  }

  render() {
    return this.props.children;
  }
}

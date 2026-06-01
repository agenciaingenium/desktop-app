import React from 'react';
import { GradientType, withGradient } from '@getstation/theme';

interface Props {
  themeGradient: string,
  onClickDock: () => void,
  children?: React.ReactNode,
}
class DockWrapper extends React.PureComponent<Props, {}> {
  render() {
    const { onClickDock, children, themeGradient } = this.props;

    return (
      <div
        onClick={onClickDock}
        style={{
          display: 'flex',
          flex: '0 0 50px',
          flexDirection: 'column',
          position: 'relative',
          width: 50,
          zIndex: 4,
          backgroundImage: themeGradient,
        }}
      >
        {children}
      </div>
    );
  }
}

export default withGradient(GradientType.withOverlay)(DockWrapper);

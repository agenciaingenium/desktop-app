import { GradientType, withGradient } from '@getstation/theme';
import classNames from 'classnames';
import * as React from 'react';

export interface OwnProps {
  className?: string,
  onMouseEnter?: React.MouseEventHandler<any>,
  onMouseLeave?: React.MouseEventHandler<any>,
  children?: React.ReactNode,
}

export interface StateToProps {
  themeGradient: string,
}

class Popover extends React.PureComponent<StateToProps & OwnProps, {}> {
  render() {
    const { children, className, onMouseEnter, onMouseLeave, themeGradient } = this.props;
    const rest = { onMouseEnter, onMouseLeave };

    const containerStyle: React.CSSProperties = {
      width: 250,
      borderRadius: 5,
      boxShadow: '0px 0px 60px -5px rgba(0,0,0,0.75)',
      backgroundImage: themeGradient,
      backgroundAttachment: 'fixed',
    };

    return (
      <div className={(classNames as any)('popover-container', className)} style={containerStyle} {...rest}>
        {children}
      </div>
    );
  }
}

// @ts-ignore
export default (withGradient(GradientType.withDarkOverlay) as any)(Popover);
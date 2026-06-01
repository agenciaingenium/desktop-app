import { GradientType, withGradient } from '@getstation/theme';
import React from 'react';

export interface Props {
  children?: React.ReactNode,
  themeGradient?: string,
  applicationIcon: string,
}

export class ApplicationContainerImpl extends React.PureComponent<Props, {}> {
  render() {
    const { children, themeGradient, applicationIcon } = this.props;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: themeGradient,
        padding: 10,
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255, 0.1)',
          borderRadius: 3,
          height: '100%',
          color: 'white',
          fontSize: 14,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: 80,
            marginBottom: 30,
            borderRadius: 100,
            backgroundColor: 'rgba(255, 255, 255, .3)',
            position: 'relative' as const,
          }}>
            <img src={applicationIcon} width={60} height={60} alt="Icon" />
          </div>

          {children}
        </div>
      </div>
    );
  }
}

// @ts-ignore: withGradient HOC typing mismatch
export default withGradient(GradientType.normal)(ApplicationContainerImpl);
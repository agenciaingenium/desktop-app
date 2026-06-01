import { GradientType, withGradient } from '@getstation/theme';
import classNames from 'classnames';
import * as React from 'react';
import DockApplication from './DockApplication';

interface OwnProps {
  themeGradient: string,
  className?: string,
  children: JSX.Element[],
  open: boolean,
  onRequestClose: (e?: React.SyntheticEvent<HTMLElement>) => void,
}

interface StateFromProps {
  themeGradient: string
}

type Props = StateFromProps & OwnProps;

class DockApplicationSubdockImpl extends React.PureComponent<Props, {}> {
  subdockContainer!: HTMLDivElement | null;

  constructor(props: Props) {
    super(props);

    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.setSubdockContainerRef = this.setSubdockContainerRef.bind(this);
  }

  /**
    using Portal kinda disturbs ClickOutside.
    let's do some logic here to check that the click outside
    is definitely outside DockApplicationSubdock before calling onRequestClose
  **/
  handleClickOutside(e: React.SyntheticEvent<HTMLElement>) {
    if (!this.subdockContainer) return;
    const target = e.target as HTMLElement;
    if (!this.subdockContainer.contains(target)) this.props.onRequestClose(e);
  }

  setSubdockContainerRef(subdockContainer: HTMLDivElement | null) {
    this.subdockContainer = subdockContainer;
  }

  render() {
    const { open, className, onRequestClose, themeGradient } = this.props;

    const childrenArray = React.Children.toArray(this.props.children);
    const [iconComponent, contentComponent] = childrenArray;

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 50,
      width: 280,
      height: '100%',
      color: 'white',
      zIndex: 2,
      borderLeft: '2px solid rgba(255,255,255,0.4)',
      backgroundImage: themeGradient,
    };

    return (
      <DockApplication open={open} onRequestClose={onRequestClose} onClickOutside={this.handleClickOutside}>
        {iconComponent}
        <div ref={this.setSubdockContainerRef} className={(classNames as any)('subdock-container', className)} style={containerStyle}>
          {contentComponent}
        </div>
      </DockApplication>
    );
  }
}

// @ts-ignore
export default (withGradient(GradientType.withDarkOverlay) as any)(DockApplicationSubdockImpl);
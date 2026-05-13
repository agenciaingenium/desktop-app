import { Icon, IconSymbol, theme } from '@getstation/theme';
import * as React from 'react';
import * as classNames from 'classnames';
import AppIcon from './AppIcon';
import { ActivityEntry } from '../../activity/queries@local.gql.generated';

interface Props {
  onMouseEnter: () => any,
  onMouseLeave: () => any,
  onClickIcon: () => any,
  recentApplication: ActivityEntry,
  innerRef?: (ref: HTMLElement | null) => void;
}

const containerBaseStyle: React.CSSProperties = {
  ...theme.mixins.size(25),
  position: 'relative',
  margin: '12px auto 8px',
  borderRadius: 100,
  opacity: 0.6,
  filter: 'grayscale(60%)',
  transition: '300ms',
};

const recentApplicationArrowStyle: React.CSSProperties = {
  ...theme.mixins.size(33),
  borderRadius: 100,
  position: 'absolute',
  top: -6,
  left: -7,
  opacity: 0.6,
};

const hoverIconStyle: React.CSSProperties = {
  ...theme.mixins.size('100%'),
  ...theme.mixins.flexbox.containerCenter,
  position: 'absolute',
  top: 0,
  borderRadius: 100,
  backgroundColor: 'rgba(0, 0, 0, .3)',
  transition: 'opacity 300ms cubic-bezier(0.37, 1.21, 0.89, 0.87)',
  cursor: 'pointer',
};

export default class RecentDockIcon extends React.PureComponent<Props, { hovered: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hovered: false };
  }

  render() {
    const { recentApplication, onMouseEnter, onMouseLeave, onClickIcon, innerRef } = this.props;
    const { hovered } = this.state;

    const containerStyle: React.CSSProperties = {
      ...containerBaseStyle,
      ...(hovered ? { opacity: 1, filter: 'grayscale(20%)' } : {}),
    };

    const arrowVisibleStyle: React.CSSProperties = {
      ...recentApplicationArrowStyle,
      ...(hovered ? { opacity: 1 } : {}),
    };

    return (
      <div
        ref={innerRef}
        className={classNames('appcues-subdock-recent')}
        style={containerStyle}
        onMouseEnter={() => { this.setState({ hovered: true }); onMouseEnter(); }}
        onMouseLeave={() => { this.setState({ hovered: false }); onMouseLeave(); }}
        onClick={onClickIcon}
      >
        {recentApplication &&
          <>
            <AppIcon
              size={25}
              imgUrl={recentApplication.imgUrl!}
              themeColor={recentApplication.themeColor!}
            />
          </>
        }

        <Icon style={arrowVisibleStyle} symbolId={IconSymbol.RECENT_ARROW} size={33} color={'#FFF'} />

        {hovered &&
          <span style={{ ...hoverIconStyle, opacity: 1 }}>
            <Icon symbolId={IconSymbol.CROSS} size={12} color={'#FFF'} />
          </span>
        }
      </div>
    );
  }
}
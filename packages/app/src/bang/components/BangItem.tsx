import {
  getHighlightGradient,
  Icon,
  IconSymbol,
  theme,
} from '@getstation/theme';
import * as React from 'react';

import AppIcon from '../../dock/components/AppIcon';
import { SearchPaneItemSelectedItem } from '../duck';
import KeyHold from './KeyHold';

export interface OwnProps {
  label: string,
  imgUrl: string,
  themeColor: string,
  type: SearchPaneItemSelectedItem,
  current?: boolean,
  context?: string,
  selected: boolean,
  onClick: () => void,
  ctrlTabCycling?: boolean,
  smallSize?: boolean,
}

interface State {
  isHover: boolean
}

class BangItem extends React.PureComponent<OwnProps, State> {
  static defaultProps = {
    onHover: () => { },
    current: false,
    context: '',
  };

  state = {
    isHover: false,
  };

  handleCtrlClick = (e: React.MouseEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      this.props.onClick();
    }
  }

  renderImage() {
    const { imgUrl, label, type, themeColor, smallSize } = this.props;

    const imageStyle: React.CSSProperties = {
      ...theme.avatarMixin(smallSize ? '24px' : '30px'),
      flexShrink: 0,
    };

    if (!imgUrl) {
      return <span style={imageStyle} className="placeholder" />;
    }

    if (type === 'station-app') {
      const iconSize = smallSize ? 24 : 30;

      return (
        <div style={imageStyle}>
          <AppIcon size={iconSize} imgUrl={imgUrl} themeColor={themeColor} />
        </div>
      );
    }

    return (
      <img style={imageStyle} src={imgUrl} alt={label} />
    );
  }

  setIsHover = () => this.setState({ isHover: true });
  unsetIsHover = () => this.setState({ isHover: false });

  renderButton() {
    const { selected } = this.props;

    if (!selected) return;

    return (
      <KeyHold keyValue={'Alt'} >
        {() => (
          <Icon
            symbolId={IconSymbol.RETURN}
            size={35}
            color="rgba(255, 255, 255, .6)"
          />
        )}
      </KeyHold>
    );
  }

  render() {
    const { selected, onClick, label, context, smallSize } = this.props;

    const labelSize = smallSize ? 13 : 16;
    const contextSize = smallSize ? 10 : 12;

    const itemStyle: React.CSSProperties = {
      display: 'flex',
      height: smallSize ? 50 : 60,
      alignItems: 'center',
      padding: 20,
      ...(selected ? { backgroundImage: getHighlightGradient(undefined, .50) } : {}),
      ...(!selected && this.state.isHover ? { backgroundImage: getHighlightGradient(undefined, .30) } : {}),
    };

    const contentStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      width: '92%',
      marginLeft: 10,
      color: 'white',
    };

    const labelStyle = {
      ...theme.fontMixin(labelSize, 600),
      ...theme.mixins.ellipsis(1),
    } as React.CSSProperties;

    const contextStyle = {
      ...theme.fontMixin(contextSize),
      marginLeft: 2,
      opacity: 0.5,
      ...theme.mixins.ellipsis(1),
    } as React.CSSProperties;

    return (
      <li
        onMouseEnter={this.setIsHover}
        onMouseLeave={this.unsetIsHover}
        onClick={onClick}
        onContextMenu={this.handleCtrlClick}
        style={itemStyle}
      >
        {this.renderImage()}
        <div style={contentStyle}>
          <div style={{ width: '91%' }}>
            <p style={labelStyle}>{label || ''}</p>
            <p style={contextStyle}>{context}</p>
          </div>
          {this.renderButton()}
        </div>
      </li>
    );
  }
}

export default BangItem as React.ComponentType<OwnProps>;
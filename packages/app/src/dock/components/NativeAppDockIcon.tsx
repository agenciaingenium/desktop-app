import { Icon, IconSymbol, Tooltip } from '@getstation/theme';
import * as classNames from 'classnames';
import * as React from 'react';
import { nanoid } from 'nanoid';
export import IconSymbol = IconSymbol;

export enum Size {
  HALF, NORMAL, BIG,
}

interface Props {
  className?: string,
  iconSymbolId: IconSymbol,
  imageURL?: string,
  fallbackImageURL?: string,
  onClick?: () => any,
  onMouseEnter?: () => any,
  onMouseLeave?: () => any,
  active?: boolean,
  badge?: boolean
  color?: string,
  disabled?: boolean,
  tooltip?: string,
  size?: Size,
  style?: React.CSSProperties,
}

interface State {
  canRenderImage: boolean,
  hovered: boolean,
}

export default class NativeAppDockIcon extends React.PureComponent<Props, State> {

  static defaultProps = {
    size: Size.NORMAL,
    active: false,
    badge: false,
    onClick: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };

  maskId: string;
  imageId: string;
  img: SVGImageElement | null;

  constructor(props: Props) {
    super(props);
    this.state = {
      canRenderImage: true,
      hovered: false,
    };

    this.maskId = `icon-mask-${nanoid()}`;
    this.imageId = `icon-img-${nanoid()}`;
  }

  componentDidMount() {
    if (this.img) {
      (this.img as any).onerror = () => {
        if (this.state.canRenderImage) {
          this.setState({ canRenderImage: false });
        }
      };
    }
  }

  renderImg() {
    const { active } = this.props;
    const { hovered } = this.state;

    return (
      <g>
        { active &&
          <rect width="42" height="24" x="4" y="0" rx="2" fill="#fff" fillOpacity={hovered ? 0.9 : 1} />
        }
        <circle cx="25" cy="12" r="9" fill="#fff" fillOpacity={hovered ? 1 : 0.6} />
        <circle cx="25" cy="12" r="8" fill={`url(#${this.imageId})`} />
      </g>
    );
  }

  renderIcon() {
    const { active, iconSymbolId, color, size } = this.props;
    const { hovered } = this.state;

    const sizeProps = {
      [Size.HALF]: {
        width: 25, height: 24, x: 0, y: 0, rx: 2,
      },
      [Size.NORMAL]: {
        width: 42, height: 24, x: 4, y: 0, rx: 2,
      },
      [Size.BIG]: {
        width: 36, height: 32, x: 0, y: 0, rx: 2,
      },
    };

    if (active) {
      return (
        <g fill="none" fillRule="evenodd" mask={`url(#${this.maskId})`}>
          <rect {...sizeProps[size!]} fill="#fff" fillOpacity={hovered ? 0.9 : 1} />
        </g>
      );
    }

    return (
      <g style={{ fill: '#fff', fillOpacity: hovered ? 1 : 0.6, transition: 'all 250ms ease-out' }}>
        <Icon symbolId={iconSymbolId} color={color} />
      </g>
    );
  }

  renderBadge() {
    const { badge, iconSymbolId } = this.props;

    if (!badge) return null;

    let coords = { x: 34, y: 5 };

    if (iconSymbolId === IconSymbol.NOTIFICATION) {
      coords = { ...coords, x: 28 };
    }

    return (
      <rect width="4" height="4" {...coords} fill="#EF5757" rx="2" />
    );
  }

  renderSvg() {
    const {
      onMouseEnter, onMouseLeave, iconSymbolId, active, disabled, onClick, imageURL,
      fallbackImageURL, size,
    } = this.props;
    const { canRenderImage, hovered } = this.state;

    const SizesProps = {
      [Size.HALF]: {
        width: 25, height: 24, viewBox: '0 0 25 24', x: 0, y: 0, rx: 2, rectWidth: 25,
      },
      [Size.NORMAL]: {
        width: 50, height: 24, viewBox: '0 0 50 24', x: 4, y: 0, rx: 2, rectWidth: 42,
      },
      [Size.BIG]: {
        width: 50, height: 32, viewBox: '0 0 50 32', x: 4, y: 0, rx: 2, rectWidth: 42,
      },
    };

    const props = SizesProps[size!];

    return (
      <svg
        width={props.width}
        height={props.height}
        viewBox={props.viewBox}
        className={classNames(this.props.className)}
        onClick={onClick}
        onMouseEnter={() => {
          this.setState({ hovered: true });
          onMouseEnter && onMouseEnter();
        }}
        onMouseLeave={() => {
          this.setState({ hovered: false });
          onMouseLeave && onMouseLeave();
        }}
        style={{
          display: 'block',
          margin: size === Size.HALF ? '0' : size === Size.BIG ? '4px 0' : '2px 0',
          opacity: disabled ? 0.2 : 1,
          cursor: disabled ? 'default' : 'pointer',
          ...this.props.style,
        }}
      >
        <defs>
          <mask id={this.maskId}>
            <rect width="100%" height="100%" fill="#ffffff" />
            <g>
              <Icon symbolId={iconSymbolId} size={24} color="#000" />
            </g>
          </mask>

          { imageURL &&
            <pattern id={this.imageId} width="100%" height="100%" x="0">
              <image ref={img => this.img = img} xlinkHref={canRenderImage ? imageURL : fallbackImageURL} width="16" height="16" />
            </pattern>
          }
        </defs>

        <g>
          { !active &&
            <rect
              width={props.rectWidth}
              height={props.height}
              x={props.x}
              y={props.y}
              rx={props.rx}
              fill="#fff"
              fillOpacity={!disabled && hovered ? 0.2 : 0}
              style={{ transition: 'all 250ms ease-out' }}
            />
          }
          {imageURL ? this.renderImg() : this.renderIcon()}
          {this.renderBadge()}
        </g>
      </svg>
    );
  }

  render() {
    const { tooltip } = this.props;

    return (
      <Tooltip className={this.props.className} placement="right" tooltip={tooltip}>
        {this.renderSvg()}
      </Tooltip>
    );
  }
}

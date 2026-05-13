import * as React from 'react';
import * as classNames from 'classnames';
import { nanoid } from 'nanoid';

export interface OwnProps {
  applicationId: string,
  active?: boolean,
  badge?: string | number | null,
  isInstanceLogoInDockIcon?: boolean,
  logoURL?: string,
  dramaticEnter?: boolean,
  onOverStateChange?: (newState: boolean) => void,
  onClick?: () => void,
  onRightClick?: () => void,
  iconRef: (el: HTMLDivElement) => void,
}

interface GraphQLProps {
  loading: boolean,
  iconURL?: string,
  themeColor?: string,
  snoozed?: boolean | null,
}

type Props = OwnProps & GraphQLProps;

const anchorStyle: React.CSSProperties = {
  display: 'block',
  marginLeft: '2px',
  cursor: 'default',
};

export class AppDockIcon extends React.PureComponent<Props> {
  static defaultProps = {
    active: false,
    onClick: () => { },
    onOverStateChange: () => { },
  };

  private readonly primaryLogo: string;
  private readonly secondaryLogo: string;
  constructor(props: Props) {
    super(props);
    this.primaryLogo = `logo-primary-${nanoid()}`;
    this.secondaryLogo = `logo-secondary-${nanoid()}`;
  }

  handleMouseEnter = () => this.props.onOverStateChange!(true);

  handleMouseLeave = () => this.props.onOverStateChange!(false);

  renderSurroundingLink(element: JSX.Element): JSX.Element {
    const { onClick, onRightClick, iconRef } = this.props;
    return (
      <div ref={iconRef}>
        <a
          style={anchorStyle}
          onClick={onClick}
          onContextMenu={onRightClick}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        >
          {element}
        </a>
      </div>
    );
  }

  renderDefs() {
    const { active, logoURL, isInstanceLogoInDockIcon, iconURL } = this.props;
    return (
      <defs>
        <filter id="grayscale">
          <feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0" />
        </filter>
        {
          iconURL &&
          <pattern id={this.primaryLogo} width="100%" height="100%" x="0%">
            <image
              className={(active || isInstanceLogoInDockIcon) ? '' : 'image-low-opacity'}
              filter={(active || isInstanceLogoInDockIcon) ? '' : 'url(#grayscale)'}
              href={iconURL}
              width={isInstanceLogoInDockIcon ? '12' : '30'}
              height={isInstanceLogoInDockIcon ? '12' : '30'}
            />
          </pattern>
        }
        {
          logoURL &&
          <pattern id={this.secondaryLogo} width="100%" height="100%" x="0%">
            <image
              className={(active || !isInstanceLogoInDockIcon) ? '' : 'image-low-opacity'}
              filter={(active || !isInstanceLogoInDockIcon) ? '' : 'url(#grayscale)'}
              href={logoURL}
              width={isInstanceLogoInDockIcon ? '30' : '12'}
              height={isInstanceLogoInDockIcon ? '30' : '12'}
            />
          </pattern>
        }
      </defs>
    );
  }

  renderIconsBackground() {
    const { isInstanceLogoInDockIcon, logoURL } = this.props;
    const position = {
      x: isInstanceLogoInDockIcon ? 2 : 27,
      y: isInstanceLogoInDockIcon ? -2 : 21,
    };
    return (
      <g className="icon-bg">
        <rect width="34" height="34" x="6" y="0" rx="17" />
        {logoURL && <rect width="16" height="16" {...position} rx="8" fill="#fff" />}
      </g>
    );
  }

  renderPrimaryIcon() {
    const { loading, active, isInstanceLogoInDockIcon, themeColor, iconURL } = this.props;

    if (loading) return;

    if (isInstanceLogoInDockIcon) {
      return (
        <g>
          <rect width="30" height="30" x="8" y="2" rx="15" fill={active ? themeColor : '#00000000'} />
          <circle cx="23" cy="17" r="15" fill={`url(#${this.secondaryLogo})`} />
        </g>
      );
    }

    if (iconURL) {
      return (
        <g>
          <rect width="30" height="30" x="8" y="2" rx="15" fill={active ? themeColor : '#00000000'} />
          <circle cx="23" cy="17" r="15" fill={`url(#${this.primaryLogo})`} />
        </g>
      );
    }
    return null;
  }

  renderSecondaryIcon() {
    const { active, themeColor, isInstanceLogoInDockIcon, logoURL } = this.props;

    if (!themeColor) return;

    if (isInstanceLogoInDockIcon) {
      return (
        <>
          {active &&
            <g>
            <rect width="13" height="13" x={3.5} y={-0.5} rx="15" fill={themeColor} />
            </g>
          }

          <circle width="20" height="20" cx="10" cy="6" r="6" fill={`url(#${this.primaryLogo})`} />
        </>
      );
    }

    if (logoURL) {
      const position = {
        cx: isInstanceLogoInDockIcon ? 10 : 35,
        cy: isInstanceLogoInDockIcon ? 6 : 29,
      };
      return (
        <circle {...position} r="6" fill={`url(#${this.secondaryLogo})`} />
      );
    }

    return null;
  }

  renderBadge() {
    const { badge, snoozed, active } = this.props;

    if (badge && !snoozed) {
      return (
        <g>
          {active && <circle r="3" cx="36" cy="6" fill="#fff" />}
          <circle r="2" cx="36" cy="6" fill="#EF5757" />
        </g>
      );
    }
    return null;
  }

  render() {
    const { loading, active, dramaticEnter } = this.props;
    const svgClassName = classNames('app-dock-icon', {
      active,
      'scale-up-animation': dramaticEnter,
    });

    if (loading) return null;

    const svgElement = (
      <svg className={svgClassName} xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 38">
        <g fill="none" fillRule="evenodd">
          {this.renderDefs()}
          {this.renderIconsBackground()}
          {this.renderPrimaryIcon()}
          {this.renderSecondaryIcon()}
          {this.renderBadge()}
        </g>
      </svg>
    );
    return this.renderSurroundingLink(svgElement);
  }
}

export const AppearingAppDockIcon = (props: Props) => {
  // when `dramaticEnter` is true we need to temporarely
  // set the icon as active so that the animation is complete
  const [active, setActive] = React.useState(false);
  const appearingActiveTimer = React.useRef<NodeJS.Timer | null>(null);

  const temporarySetActive = () => {
    setActive(true);
    appearingActiveTimer.current = setTimeout(() => {
      setActive(false);
      appearingActiveTimer.current = null;
    }, 1000);
  };

  React.useEffect(() => {
    if (props.dramaticEnter && !appearingActiveTimer.current) {
      temporarySetActive();
    }
  }, [props.dramaticEnter]);

  return (
    <AppDockIcon
      {...props}
      active={active || props.active}
    />
  );
};
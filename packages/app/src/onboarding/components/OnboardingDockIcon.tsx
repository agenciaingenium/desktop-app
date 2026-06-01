import { Icon, IconSymbol, theme } from '@getstation/theme';
import * as React from 'react';
import { MinimalApplication } from '../../applications/graphql/withApplications';
import AppIcon from '../../dock/components/AppIcon';

export interface IProps {
  application: MinimalApplication & { position?: DOMRect },
  indexPosition: number,
  onRemove?: (
    application: MinimalApplication,
    iconRef: React.RefObject<HTMLDivElement>,
  ) => any
}

export interface IState {
  translated: boolean,
  removeAnimation: boolean,
  hovered: boolean,
}

const containerBaseStyle: React.CSSProperties = {
  position: 'relative',
  marginBottom: 10,
  ...theme.mixins.size(30),
  borderRadius: 100,
  transition: 'all 400ms, transform 800ms cubic-bezier(0.4, 0.09, 0.3, 1.14)',
  opacity: 1,
};

const iconStyle: React.CSSProperties = {
  ...theme.mixins.size(30),
  borderRadius: 100,
};

const closeOverlayBaseStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  ...theme.mixins.size(30),
  borderRadius: 100,
  backgroundColor: 'rgba(0, 0, 0, .5)',
  transition: '300ms',
};

export class OnboardingDockIcon extends React.PureComponent<IProps, IState> {
  iconRef: React.RefObject<HTMLDivElement>;

  constructor(props: IProps) {
    super(props);

    this.state = {
      translated: true,
      removeAnimation: false,
      hovered: false,
    };

    this.iconRef = React.createRef();

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      return this.setState({ translated: false });
    }, 100);
  }

  handleClick() {
    const { application, onRemove } = this.props;

    this.setState({ removeAnimation: true }, () =>
      setTimeout(
        () =>
          onRemove && onRemove(application, this.iconRef)
        , 1000,
      )
    );
  }

  render() {
    const { application, onRemove, indexPosition } = this.props;
    const { translated, removeAnimation, hovered } = this.state;

    const containerStyle: React.CSSProperties = {
      ...containerBaseStyle,
      cursor: onRemove ? 'pointer' : 'inherit',
      ...(translated && application.position
        ? { visibility: 'hidden', transform: `translate(-${500 - application.position.x}px, ${application.position.y - (40 * indexPosition) - 60}px)` }
        : {}),
      ...(removeAnimation ? { opacity: 0, transform: 'scale(0)', height: 0, margin: 0 } : {}),
    };

    const closeOverlayStyle: React.CSSProperties = {
      ...closeOverlayBaseStyle,
      opacity: hovered ? 1 : 0,
    };

    return (
      <div
        ref={this.iconRef}
        style={containerStyle}
        onClick={onRemove ? this.handleClick : undefined}
        onMouseEnter={() => this.setState({ hovered: true })}
        onMouseLeave={() => this.setState({ hovered: false })}
      >
        <div style={iconStyle}>
          <AppIcon imgUrl={application.iconURL} themeColor={application.themeColor} />
        </div>

        {onRemove && <div style={closeOverlayStyle}>
          <Icon symbolId={IconSymbol.CROSS} size={30} />
        </div>}
      </div>
    );
  }
}
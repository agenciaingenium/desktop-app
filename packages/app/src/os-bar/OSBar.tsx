import * as classNames from 'classnames';
import * as React from 'react';
import DockNavigationButtons from '../dock-navigation/components/DockNavigationButtons';
import TrafficLightsContainer from '../dock/components/TrafficLightsContainer';

export interface Props {
  themeGradient: string,
  title: string,
  onDoubleClick: () => any,
  onClose: () => any,
  canGoBack?: boolean,
  canGoForward?: boolean,
  onGoBack?: () => any,
  onGoForward?: () => any,
}

const CONTAINER_STYLE: React.CSSProperties = {
  backgroundColor: 'transparent',
};

const NAVIGATION_STYLE: React.CSSProperties = {
  margin: '-2px 0 0 10px',
};

export default class OSBar extends React.PureComponent<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.handleGoBack = this.handleGoBack.bind(this);
    this.handleGoForward = this.handleGoForward.bind(this);
  }

  handleGoBack() {
    // @ts-ignore
    this.props.onGoBack();
  }

  handleGoForward() {
    // @ts-ignore
    this.props.onGoForward();
  }

  render() {
    const { title, onClose, onDoubleClick, canGoBack, canGoForward } = this.props;

    return (
      // @ts-ignore
      <div className={classNames('l-osbar')} style={CONTAINER_STYLE} onDoubleClick={onDoubleClick}>
        <TrafficLightsContainer onClose={onClose} />

        <div style={NAVIGATION_STYLE}>
          {/* @ts-ignore */}
          <DockNavigationButtons
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={this.handleGoBack}
            onGoForward={this.handleGoForward}
          />
        </div>

        {title &&
        <span
          className="l-osbar--title"
        >
          {title}
        </span>
        }
      </div>
    );
  }
}
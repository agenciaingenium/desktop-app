import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
// @ts-ignore
import { toggleFullScreen } from '../../app/duck';
import TrafficLights from './TrafficLights';

interface DispatchProps {
  onToggleFullScreen: () => void;
}

interface OwnProps {
  onClose: () => any,
}

interface State {
  focused: boolean
}

class TrafficLightsContainer extends React.PureComponent<any, State> {

  private unsubscribeFocus: (() => void) | null = null;
  private unsubscribeBlur: (() => void) | null = null;

  constructor(props: any) {
    super(props);

    this.state = {
      focused: false,
    };

    // Check initial focus state
    window.station.window.isFocused().then((focused) => {
      this.setState({ focused });
    });

    this.handleClose = this.handleClose.bind(this);
    this.handleMinimize = this.handleMinimize.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
  }

  componentDidMount() {
    this.unsubscribeFocus = window.station.window.onFocus(() => {
      this.setState({ focused: true });
    });

    this.unsubscribeBlur = window.station.window.onBlur(() => {
      this.setState({ focused: false });
    });

    // Re-check focus state after listeners are registered
    window.station.window.isFocused().then((focused) => {
      this.setState({ focused });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeFocus) this.unsubscribeFocus();
    if (this.unsubscribeBlur) this.unsubscribeBlur();
  }

  handleClose() {
    return this.props.onClose();
  }

  handleMinimize() {
    window.station.window.minimize();
  }

  handleExpand() {
    window.station.window.focus();
    window.station.window.isFullScreen().then((isFullScreen) => {
      window.station.window.setFullScreen(!isFullScreen);
    });
  }

  render() {
    return (
      <TrafficLights
        focused={this.state.focused}
        handleClose={this.handleClose}
        handleMinimize={this.handleMinimize}
        handleExpand={this.handleExpand}
      />
    );
  }
}

export default connect<{}, DispatchProps, OwnProps>(
  null,
  (dispatch: Dispatch) => bindActionCreators({
    onToggleFullScreen: toggleFullScreen,
  }, dispatch)
)(TrafficLightsContainer);
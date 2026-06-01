import { Switcher, ButtonIcon, IconSymbol, Size, Style } from '@getstation/theme';
import React from 'react';
// @ts-ignore: no declaration file
import ClickOutside from 'react-click-outside';
import { Manager, Popper, Reference } from 'react-popper';
import { INFINITE, SYNC_WITH_OS } from '../constants';
import NotificationCenterSnoozePanel from './NotiticationCenterSnoozePanel';

export interface Props {
  currentSnoozeDurationInMs?: number | string,
  currentSnoozeStartedOn?: number,
  handleSnooze: (snoozeDuration: string) => void,
  handleResetSnooze: () => void,
}

export interface State {
  snoozePanelOpened: boolean,
  switcherHover: boolean,
}

class NotificationCenterSnoozeButton extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      snoozePanelOpened: false,
      switcherHover: false,
    };

    this.closeSnoozePanel = this.closeSnoozePanel.bind(this);
    this.toggleSnoozePanel = this.toggleSnoozePanel.bind(this);
    this.handleSwitcherChange = this.handleSwitcherChange.bind(this);
    this.handleSnooze = this.handleSnooze.bind(this);
  }

  closeSnoozePanel() {
    this.setState({ snoozePanelOpened: false });
  }

  toggleSnoozePanel() {
    this.setState({ snoozePanelOpened: !this.state.snoozePanelOpened });
  }

  handleSwitcherChange() {
    if (this.isSnoozed()) {
      this.props.handleResetSnooze();
    } else {
      this.props.handleSnooze(INFINITE);
    }
  }

  isSnoozed() {
    const { currentSnoozeDurationInMs } = this.props;
    if (!currentSnoozeDurationInMs) return false;
    // @ts-ignore
    return currentSnoozeDurationInMs > 0 || currentSnoozeDurationInMs === SYNC_WITH_OS || currentSnoozeDurationInMs === INFINITE;
  }

  handleSnooze(duration: string) {
    this.props.handleSnooze(duration);
    this.closeSnoozePanel();
  }

  render() {
    const { switcherHover } = this.state;

    return (
      <ClickOutside onClickOutside={this.closeSnoozePanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            marginRight: 2,
            transition: 'all 250ms ease-out',
            padding: 2,
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
            backgroundColor: switcherHover ? 'rgba(255,255,255, 0.2)' : 'rgba(255,255,255, 0.1)',
          }}
            onMouseEnter={() => this.setState({ switcherHover: true })}
            onMouseLeave={() => this.setState({ switcherHover: false })}
          >
            <Switcher
              checked={this.isSnoozed()}
              onChange={this.handleSwitcherChange}
            />
          </span>
          <div style={{ display: 'inherit' }}>
            <Manager>
              <Reference>
                {({ ref }) => (
                  <div style={{ display: 'inherit' }} ref={ref}>
                    <ButtonIcon
                      style={{
                        height: 25,
                        borderRadius: 0,
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                      }}
                      symbolId={IconSymbol.TIME}
                      btnStyle={Style.SECONDARY}
                      onClick={this.toggleSnoozePanel}
                      btnSize={Size.XSMALL}
                    />
                  </div>
                )}
              </Reference>
              {this.state.snoozePanelOpened &&
                <div style={{ zIndex: 1 }}>
                  <Popper>
                    {({ ref, style, placement }) => (
                      <div ref={ref} style={style} data-placement={placement}>
                        <NotificationCenterSnoozePanel handleSnooze={this.handleSnooze} />
                        <div style={{
                          position: 'absolute',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderBottom: '5px solid white',
                        }} />
                      </div>
                    )}
                  </Popper>
                </div>
              }
            </Manager>
          </div>
        </div>
      </ClickOutside>
    );
  }
}

export default NotificationCenterSnoozeButton;
import { theme } from '@getstation/theme';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { bindActionCreators, Dispatch } from 'redux';
import { osName } from '../utils/process';
import NotificationCenterHeader from './components/NotificationCenterHeader';
import { SYNC_WITH_OS } from './constants';
import {
  markAllAsRead,
  MarkAllAsReadAction,
  resetSnoozeDuration,
  ResetSnoozeDurationAction,
  setSnoozeDuration,
  SetSnoozeDurationAction,
} from './duck';
import NotificationCenterBody from './NotificationCenterBody';
import { getSnoozeDuration, getSnoozeStartedOn } from './selectors';

const infoBoxStyle: React.CSSProperties = {
  margin: '10px 10px 0 10px',
  padding: 10,
  ...theme.fontMixin(10),
  backgroundColor: 'rgba(255, 255, 255, .2)',
  borderRadius: 3,
  color: 'rgba(255, 255, 255, .6)',
};

export interface Props {
  markAllAsRead: () => MarkAllAsReadAction,
  snooze: (duration: string) => SetSnoozeDurationAction,
  resetSnooze: () => ResetSnoozeDurationAction,
  currentSnoozeDuration?: string,
  currentSnoozeStartedOn?: number,
}

class NotificationCenterSubdockContentImpl extends React.PureComponent<Props, {}> {
  render() {
    const {
      snooze, resetSnooze, currentSnoozeDuration, currentSnoozeStartedOn,
    } = this.props;
    const syncWithOS = currentSnoozeDuration === SYNC_WITH_OS;

    return (
      <div>
        <NotificationCenterHeader
          handleSnooze={snooze}
          handleResetSnooze={resetSnooze}
          currentSnoozeDuration={currentSnoozeDuration}
          currentSnoozeStartedOn={currentSnoozeStartedOn}
          markAllRead={this.props.markAllAsRead}
        />

        {syncWithOS &&
        <div style={infoBoxStyle}>
          To receive notifications, Switch off Do Not Disturb mode in {osName}.
        </div>
        }

        <CSSTransition
          classNames="all-read-animation"
          timeout={{ enter: 700, exit: 500 }}
        >
          <NotificationCenterBody />
        </CSSTransition>
      </div>
    );
  }
}

// @ts-ignore
const NotificationCenterSubdockContent = connect(
  (state: any) => ({
    currentSnoozeDuration: getSnoozeDuration(state),
    currentSnoozeStartedOn: getSnoozeStartedOn(state),
  }),
  (dispatch: Dispatch<any>) => bindActionCreators(
    {
      markAllAsRead,
      snooze: (duration: string) => setSnoozeDuration('notification-center', duration),
      resetSnooze: () => resetSnoozeDuration('notification-center'),
    },
    dispatch
  )
)(NotificationCenterSubdockContentImpl);

export default NotificationCenterSubdockContent;

import { theme } from '@getstation/theme';
import React from 'react';
import NotificationCenterSnoozePanelItem from './NotiticationCenterSnoozePanelItem';
import { minutesBeforeHeightAm } from '../utils';

export interface Props {
  handleSnooze: (duration: string) => any,
}

class NotificationCenterSnoozePanel extends React.PureComponent<Props, {}> {
  render() {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: 4,
        boxShadow: '1px 1px 5px 0px rgba(50, 50, 50, 0.75)',
        padding: '6px 10px',
        minWidth: 100,
        marginTop: 5,
      }}>
        <span style={{ color: theme.colors.gray.dark, fontWeight: 700 }}>Do Not Disturb for</span>
        <ul style={{ marginTop: 6 }}>
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze('21min')}
            duration="20 minutes"
          />
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze('61min')}
            duration="1 hour"
          />
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze('121min')}
            duration="2 hours"
          />
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze('241min')}
            duration="4 hours"
          />
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze(`${minutesBeforeHeightAm()}min`)}
            duration="Until tomorrow"
          />
          <NotificationCenterSnoozePanelItem
            handleClick={() => this.props.handleSnooze('INFINITE')}
            duration="Always"
          />
        </ul>
      </div>
    );
  }
}

export default NotificationCenterSnoozePanel;

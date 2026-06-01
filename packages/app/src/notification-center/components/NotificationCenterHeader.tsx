import { ButtonIcon, IconSymbol, Size, Style } from '@getstation/theme';
import moment from 'moment';
import React from 'react';
import { osName } from '../../utils/process';
import { INFINITE, SYNC_WITH_OS } from '../constants';
import NotificationCenterSnoozeButton from './NotificationCenterSnoozeButton';
import SnoozeDuration from './SnoozeDuration';
import ms = require('ms');

export interface Props {
  handleSnooze: (snoozeDuration: string) => any,
  handleResetSnooze: () => any,
  currentSnoozeDuration?: string,
  currentSnoozeStartedOn?: number,
  markAllRead: () => any,
}

const containerStyle: React.CSSProperties = {
  padding: '10px 20px 13px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderBottom: '1px solid rgba(255, 255, 255, .1)',
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.8)',
  lineHeight: '14px',
  minHeight: '52px',
  display: 'flex',
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'space-between',
  alignItems: 'center',
};

const buttonsContainerStyle: React.CSSProperties = {
  display: 'flex',
};

const markAllAsReadButtonStyle: React.CSSProperties = {
  height: 25,
  marginLeft: 10,
};

const durationStyle: React.CSSProperties = {
  marginBottom: -4,
};

class NotificationCenterHeader extends React.PureComponent<Props, {}> {
  constructor(props: Props) {
    super(props);

    this.getSnoozeDurationInMs = this.getSnoozeDurationInMs.bind(this);
  }

  getSnoozeDurationInMs() {
    const { currentSnoozeDuration } = this.props;

    if (currentSnoozeDuration === SYNC_WITH_OS) return SYNC_WITH_OS;
    if (currentSnoozeDuration === INFINITE) return INFINITE;

    return currentSnoozeDuration ? ms(currentSnoozeDuration) : undefined;
  }

  render() {
    const {
      currentSnoozeStartedOn, handleSnooze,
      handleResetSnooze, markAllRead,
    } = this.props;

    const snoozeDurationInMs = this.getSnoozeDurationInMs();
    const syncWithOS = snoozeDurationInMs === SYNC_WITH_OS;
    const snoozeInfinite = snoozeDurationInMs === INFINITE;

    // @ts-ignore
    const endDate = currentSnoozeStartedOn && !syncWithOS && !snoozeInfinite ?
      // @ts-ignore
      moment(currentSnoozeStartedOn).add(snoozeDurationInMs, 'ms') : null;

    return (
      <div style={containerStyle}>
        <div style={wrapperStyle}>
          <div>
            { syncWithOS ?
              <div>{osName} is in <em>Do Not Disturb</em> mode</div>
            :
              <div>Do Not Disturb</div>
            }

            { endDate && !syncWithOS && !snoozeInfinite &&
              <div style={durationStyle}>
                <b><SnoozeDuration snoozeEndDate={endDate} /></b>
              </div>
            }
          </div>

          <div style={buttonsContainerStyle}>
            { !syncWithOS &&
              <NotificationCenterSnoozeButton
                currentSnoozeDurationInMs={snoozeDurationInMs}
                currentSnoozeStartedOn={currentSnoozeStartedOn}
                handleSnooze={handleSnooze}
                handleResetSnooze={handleResetSnooze}
              />
            }

            { !syncWithOS &&
              <ButtonIcon
                style={markAllAsReadButtonStyle}
                symbolId={IconSymbol.MARK_READ}
                btnStyle={Style.SECONDARY}
                btnSize={Size.XSMALL}
                disabled={Boolean(endDate)}
                onClick={markAllRead}
              />
            }
          </div>
        </div>
      </div>
    );
  }
}

export default NotificationCenterHeader;
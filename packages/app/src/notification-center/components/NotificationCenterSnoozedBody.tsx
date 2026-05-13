import * as React from 'react';
import { osName } from '../../utils/process';

const illuSVG = require('./resources/illustration--focus.svg');

interface Props {
  syncWithOS: boolean,
}

export default class NotificationCenterSnoozedBody extends React.PureComponent<Props, {}> {
  render() {
    const { syncWithOS } = this.props;

    return (
    <div className="l-notification-center__body">
        <div className="l-empty">
          <div className="l-empty__content">
            <div style={{ marginBottom: 10 }}>
              <img src={illuSVG} alt="focus" />
            </div>

            { syncWithOS ?
              <div>
                <p>
                  To view notifications, switch Do Not Disturb mode off in the {osName} Notification Center.
                  Otherwise, just relax!
                </p>
              </div>
              :
              <div>
                <strong>You are currently on Do Not Disturb mode</strong>
                <p>To view notifications, switch Do Not Disturb off. Otherwise, just relax!</p>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}
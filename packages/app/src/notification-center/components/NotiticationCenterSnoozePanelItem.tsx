import { theme } from '@getstation/theme';
import * as React from 'react';

export interface Props {
  handleClick: () => any,
  duration: string,
}

class NotificationCenterSnoozePanelItem extends React.PureComponent<Props, {}> {
  render() {
    return (
      <li style={{
        color: theme.colors.gray.middle,
        fontSize: 12,
        transition: 'all 250ms ease-in-out',
        cursor: 'pointer',
        margin: '4px 0',
      }}>
        <a onClick={this.props.handleClick}>
          {this.props.duration}
        </a>
      </li>
    );
  }
}

export default NotificationCenterSnoozePanelItem;
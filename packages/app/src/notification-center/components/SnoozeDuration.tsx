import * as React from 'react';
import moment from 'moment';
// @ts-ignore no declaration file
import millisec from 'millisec';
import ms = require('ms');
import ReactInterval from '../../common/components/ReactInterval';

export interface Props {
  snoozeEndDate: object
}

export interface State {
  content: string
}

function sameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default class SnoozeDuration extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { content: '' };

    this.tick = this.tick.bind(this);
  }

  static getDerivedStateFromProps(props: Props) {
    if (!props.snoozeEndDate) {
      return { content: '' };
    }
    // @ts-ignore
    const diff = moment(props.snoozeEndDate).diff(new Date());
// @ts-ignore
    const msDiff = millisec(diff);

    const h = Math.floor(diff / ms('1hour'));
// @ts-ignore
    const m = msDiff.getMinutes();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
// @ts-ignore
    const untilTomorrow = diff > ms('4h') && sameDay(moment(props.snoozeEndDate).toDate(), tomorrow);

    let content;

    if (untilTomorrow) {
      content = 'until tomorrow';
    } else if (diff > ms('1h')) {
      content = m !== 0 ? `for ${h}h${m}min` : `for ${h}h`;
    } else if (diff > ms('1min')) {
      content = `for ${m}min`;
    } else {
      content = `for <1min`;
    }

    return { content };
  }

  tick() {
    this.setState(SnoozeDuration.getDerivedStateFromProps(this.props));
  }

  render() {
    return (
      <span>
        <ReactInterval enabled={true} callback={this.tick} />
        {this.state.content}
      </span>
    );
  }
}
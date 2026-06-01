import { Collection } from 'immutable';
import React from 'react';
import { fontMixin } from '../../utils/fontMixin';
import ListItem, { ListItemType } from './ListItem';

const STYLE = {
  container: {} as React.CSSProperties,
  title: {
    ...fontMixin(12, 600),
    margin: '20px 0 10px',
    textTransform: 'uppercase' as const,
  },
  itemsWrapper: {} as React.CSSProperties,
};

type Props = {
  title?: string,
  iconSize?: number,
  items: Collection<number, ListItemType>,
};

export default class List extends React.PureComponent<Props, {}> {
  render() {
    const { title, items, iconSize } = this.props;

    return (
      <div style={STYLE.container}>
        {title && <div style={STYLE.title}>{title}</div>}

        <ul style={STYLE.itemsWrapper}>
          { (items as any).toArray().map((item: ListItemType) =>
            <ListItem key={item.id} iconSize={iconSize} item={item} />
          )}
        </ul>
      </div>
    );
  }
}
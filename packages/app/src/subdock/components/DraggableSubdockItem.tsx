import * as React from 'react';
import { DragSource, DragSourceMonitor, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import SubdockItem, { BareApplication, WrappedActions } from './SubdockItem';
import { findDOMNode } from 'react-dom';
import { useReorderTabMutationMutation, useReorderFavoriteMutationMutation } from '../../tabs/queries@local.gql.generated';

// PROPS

type GqlProps = {
  reorderTab: (tabId: string, newPosition: number) => any,
  reorderFavorite: (favoriteId: string, newPosition: number) => any,
};

type OwnProps = {
  index: number,
  dragType: string,
  application: BareApplication,
  tabId: string,
  item: any,
  favorite: boolean,
  actions: WrappedActions,
};

interface DndProps {
  connectDropTarget: (arg: any) => any,
  connectDragSource: (arg: any) => any,
  connectDragPreview: (arg: any) => any,
  isDragging: boolean,
}

type InnerProps = OwnProps & GqlProps & DndProps;

// DRAG SOURCE CONTRACTS

const dockAppSource = {
  beginDrag(props: InnerProps) {
    const { item, tabId } = props;
    return {
      index: props.index,
      application: { id: props.application.id },
      item: { title: item.title },
      tabId: tabId,
    };
  },
  endDrag(_props: InnerProps, monitor: DragSourceMonitor) {
    const dropResult = monitor.getDropResult();
    if (!dropResult) return;
  },
};

const SubdockItemTarget = {
  drop: () => ({
    type: 'DND_SUBDOCK',
  }),
  hover(props: InnerProps, monitor: any, component: any) {
    const { favorite, reorderTab, reorderFavorite } = props;
    const { tabId, index: dragIndex } = monitor.getItem();
    const hoverIndex = props.index;

    if (dragIndex === hoverIndex) {
      return;
    }

    const domNode = findDOMNode(component);
    if (!domNode) return;
    const hoverBoundingRect = domNode.getBoundingClientRect();

    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    const clientOffset = monitor.getClientOffset();

    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    favorite ? reorderFavorite(tabId, hoverIndex) : reorderTab(tabId, hoverIndex);

    monitor.getItem().index = hoverIndex;
  },
};

const collectTarget = (connect: any) => ({
  connectDropTarget: connect.dropTarget(),
});

const collectSource = (connect: any, monitor: any) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
});

// COMPONENT

@DropTarget(({ dragType }: InnerProps) => dragType, SubdockItemTarget, collectTarget)
@DragSource(({ dragType }: InnerProps) => dragType, dockAppSource, collectSource)
class DraggableSubdockItemInner extends React.PureComponent<InnerProps> {
  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage());
  }

  componentDidUpdate() {
    this.props.connectDragPreview(getEmptyImage());
  }

  render() {
    const {
      isDragging, connectDragSource, connectDropTarget,
      application, actions, item,
    } = this.props;

    const opacity = isDragging ? 0 : undefined;

    return connectDragSource && connectDropTarget && connectDragSource(connectDropTarget(
      <div style={{ opacity }}>
        <SubdockItem
          application={application}
          actions={actions}
          item={item}
        />
      </div>
    ));
  }
}

// WRAPPER WITH HOOKS

const DraggableSubdockItem: React.FC<OwnProps> = (props) => {
  const [reorderTabMutation] = useReorderTabMutationMutation();
  const [reorderFavoriteMutation] = useReorderFavoriteMutationMutation();

  const reorderTab = (tabId: string, newPosition: number) =>
    reorderTabMutation({ variables: { tabId, newPosition } });

  const reorderFavorite = (favoriteId: string, newPosition: number) =>
    reorderFavoriteMutation({ variables: { favoriteId, newPosition } });

  return (
    <DraggableSubdockItemInner
      {...props}
      reorderTab={reorderTab}
      reorderFavorite={reorderFavorite}
    />
  );
};

// EXPORT

export default DraggableSubdockItem;

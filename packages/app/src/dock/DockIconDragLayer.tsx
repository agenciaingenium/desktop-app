import React from 'react';
import { DragLayer } from 'react-dnd';
import AppDockIcon from './components/ConnectedAppDockIcon';

interface OuterProps {
  onDraggingStateChange?: (isDragging: boolean) => void,
}
interface OwnProps {
  item: {
    applicationId: string,
    manifestURL: string,
    index: number,
  },
  itemType: string,
  initialOffset: { x: number, y: number },
  currentOffset: { x: number, y: number },
  isDragging: boolean,
}

type Props = OuterProps & OwnProps;

function getItemStyles(props: Props) {
  const { currentOffset } = props;
  if (!currentOffset) {
    return {
      display: 'none',
    };
  }

  const transform = `translate(${currentOffset.x > 30 ? currentOffset.x : 0}px, ${currentOffset.y}px)`;

  return {
    display: 'flex',
    alignItems: 'center',
    transform: transform,
    WebkitTransform: transform,
  };
}

// @ts-ignore
@DragLayer(monitor => ({
  item: monitor.getItem(),
  itemType: monitor.getItemType(),
  initialOffset: monitor.getInitialSourceClientOffset(),
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
}))
// @ts-ignore
// @ts-ignore
class DockIconDragLayer extends React.PureComponent<Props> {

  componentDidUpdate(prevProps: Props) {
    const { onDraggingStateChange } = this.props;
    if (!onDraggingStateChange) return;

    if (prevProps.isDragging !== this.props.isDragging) {

      // We are only interested when an 'APP_DOCK_APP' is dragged
      // Though, when the drag ends (isDragging=false), `itemType`
      // is null. To make sure `onDraggingStateChange` is called when
      // drag ends, we don't check item type for `isDragging=false`.
      if (this.props.isDragging && this.props.itemType === 'APP_DOCK_APP') {
        onDraggingStateChange(true);
      }
      if (!this.props.isDragging) {
        onDraggingStateChange(false);
      }
    }
  }
  render() {
    const { item, isDragging, itemType } = this.props;

    if (itemType !== 'APP_DOCK_APP') {
      return null;
    }
    if (!isDragging) {
      return null;
    }

    return (
      <div style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 100,
        left: 0,
        top: 0,
      }}>
        <div style={getItemStyles(this.props)}>
          <AppDockIcon
            applicationId={item.applicationId}
            active={true}
            // @ts-ignore
            iconRef={() => {}}
          />
        </div>
      </div>
    );
  }
}

export default DockIconDragLayer as React.ComponentType<OwnProps>;
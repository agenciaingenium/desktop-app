import * as React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { findDOMNode } from 'react-dom';
import { oc } from 'ts-optchain';

import { useGetApplicationQuery, GetApplicationQuery } from '../queries@local.gql.generated';

import AppDockIcon from './ConnectedAppDockIcon';

interface AppDockIconProps {
  applicationId: string,
  active: boolean,
  badge: any,
  isInstanceLogoInDockIcon: any,
  logoURL: string,
  tabTitle: string,
  onOverStateChange: any,
  onClick: () => any,
  onRightClick: () => any,
  dramaticEnter?: boolean,
}

interface OwnProps extends AppDockIconProps {
  manifestURL: string,
  index: number,
  moveIcon: (dragApplicationId: any, hoverIndex: any, manifestURL: any) => any,
  iconRef: (el: HTMLDivElement) => void
}

interface DndProps {
  connectDropTarget: (arg: any) => any,
  connectDragSource: (arg: any) => any,
  connectDragPreview: (arg: any) => any,
  isDragging: boolean,
}

type Props = OwnProps & DndProps & { application: GetApplicationQuery['application'] };

const dockAppSource = {
  beginDrag(props: Props) {
    return {
      applicationId: props.applicationId,
      manifestURL: props.manifestURL,
      index: props.index,
      tabTitle: props.tabTitle,
    };
  },
};

const dockAppTarget = {
  drop: () => ({
    type: 'DND_DOCK',
  }),
  hover(props: Props, monitor: any, component: any) {
    const { index: dragIndex, applicationId: dragApplicationId, manifestURL } = monitor.getItem();
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

    props.moveIcon(dragApplicationId, hoverIndex, manifestURL);

    monitor.getItem().index = hoverIndex;
  },
};

@DropTarget('APP_DOCK_APP', dockAppTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('APP_DOCK_APP', dockAppSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
}))
class DraggableAppDockIconInner extends React.PureComponent<Props> {
  componentDidMount() {
    this.props.connectDragPreview(getEmptyImage());
  }

  componentDidUpdate() {
    this.props.connectDragPreview(getEmptyImage());
  }

  render() {
    const {
      isDragging, connectDragSource, connectDropTarget, applicationId, active, badge, isInstanceLogoInDockIcon,
      logoURL, onOverStateChange, dramaticEnter,
      onClick, onRightClick, iconRef,
    } = this.props;

    const opacity = isDragging ? 0 : undefined;

    return connectDragSource && connectDropTarget && connectDragSource(connectDropTarget(
      <div style={{ opacity }}>
        <AppDockIcon
          applicationId={applicationId}
          active={active}
          badge={badge}
          isInstanceLogoInDockIcon={isInstanceLogoInDockIcon}
          logoURL={logoURL}
          onOverStateChange={onOverStateChange}
          onClick={onClick}
          onRightClick={onRightClick}
          iconRef={iconRef}
          dramaticEnter={dramaticEnter}
        />
      </div>
    ));
  }
}

const DraggableAppDockIcon: React.FC<OwnProps> = (props) => {
  const { data } = useGetApplicationQuery({
    variables: { applicationId: props.applicationId },
  });

  const application = oc(data).application();

  return <DraggableAppDockIconInner {...props} application={application} />;
};

export default DraggableAppDockIcon;

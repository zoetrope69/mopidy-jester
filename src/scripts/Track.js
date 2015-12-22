import React, { Component, PropTypes } from 'react';
import ItemTypes from './ItemTypes';
import { DragSource, DropTarget } from 'react-dnd';

const trackSource = {
  beginDrag(props) {
    return {
      id: props.id,
      originalIndex: props.findTrack(props.id).index
    };
  },

  endDrag(props, monitor) {
    const { id: droppedId, originalIndex } = monitor.getItem();
    const didDrop = monitor.didDrop();

    if (!didDrop) {
      props.moveTrack(droppedId, originalIndex);
    }
  }
};

const trackTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor) {
    const { id: draggedId } = monitor.getItem();
    const { id: overId } = props;

    if (draggedId !== overId) {
      const { index: overIndex } = props.findTrack(overId);
      props.moveTrack(draggedId, overIndex);
    }
  }
};

@DropTarget(ItemTypes.TRACK, trackTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
@DragSource(ItemTypes.TRACK, trackSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
export default class Track extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    id: PropTypes.any.isRequired,
    item: PropTypes.object.isRequired,
    current: PropTypes.object.isRequired,
    moveTrack: PropTypes.func.isRequired,
    playTrack: PropTypes.func.isRequired,
    findTrack: PropTypes.func.isRequired
  };

  render() {
    const { playTrack, item, current, index, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;

    let isCurrentTrack = false;

    if (item.tlid && current.tlid) {
      isCurrentTrack = item.tlid === current.tlid;
    }

    let trackSource = 'unknown';
    if (item.track.uri.indexOf(':')) {
      trackSource = item.track.uri.substr(0, item.track.uri.indexOf(':'));
    }

    return connectDragSource(connectDropTarget(
      <li style={{ opacity }}
          className={`track track--source-${trackSource}` + (isCurrentTrack ? ` track--${current.state}` : '')}
          onClick={playTrack.bind(this, item.tlid)}>

        <div className="track__indicator">{isCurrentTrack ? '🔊' : index}</div>

        <div className="track__name">{item.track.name}</div>

        {trackSource !== 'soundcloud' && (
          <div className="track__album">
            {typeof item.track.album !== 'undefined' && item.track.album.name}
          </div>
        )}

        <div className="track__artists">
          {typeof item.track.artists !== 'undefined' && item.track.artists[0].name}
        </div>

        <div className="track__source" />

      </li>
    ));
  }
}

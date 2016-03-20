import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import ItemTypes from './ItemTypes';
import { DragSource, DropTarget } from 'react-dnd';

const trackSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  }
};

const trackTarget = {
  canDrop() {
    return false;
  },

  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveTrack(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
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
    removeTrack: PropTypes.func.isRequired,
    findTrack: PropTypes.func.isRequired
  };

  render() {
    const { removeTrack, playTrack, item, current, isDragging, connectDragSource, connectDropTarget } = this.props;
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
          >
        <div className="track__art" style={isCurrentTrack ? { backgroundImage: `url(${current.image})` } : {}} />
        <div className="track__gif" style={isCurrentTrack ? { backgroundImage: `url(${current.gif})` } : {}} />
        <div onClick={playTrack.bind(this, item.tlid)}>
          <div className="track__indicator">{isCurrentTrack ? '🔊' : '▶'}</div>

          <div className="track__name">{item.track.name}</div>

          {trackSource !== 'soundcloud' && (
            <div className="track__album">
              {typeof item.track.album !== 'undefined' && item.track.album.name}
            </div>
          )}

          <div className="track__artists">
            {typeof item.track.artists !== 'undefined' && item.track.artists[0].name}
          </div>
        </div>

        <button className="track__delete" onClick={removeTrack.bind(this, item.tlid)}>✖</button>

        <div className="track__source"></div>

      </li>
    ));
  }
}

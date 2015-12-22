import React, { Component, PropTypes } from 'react';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import ItemTypes from './ItemTypes';
import Track from './Track';

const trackTarget = {
  drop() {
  }
};

@DragDropContext(HTML5Backend)
@DropTarget(ItemTypes.TRACK, trackTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))
export default class TrackList extends Component {
  static propTypes: {
    tracks: PropTypes.object.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    moveTrack: PropTypes.func.isRequired,
    playTrack: PropTypes.func.isRequired,
    findTrack: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { connectDropTarget } = this.props;
    const { tracks: { list, current }, moveTrack, playTrack } = this.props;

    return connectDropTarget(
      <ul className="tracks">
        {list.map((item, i) => {
          return (
            <Track key={item.tlid + i}
                   index={i}
                   id={item.tlid + i}
                   item={item}
                   current={current}
                   playTrack={playTrack}
                   moveTrack={moveTrack} />
          );
        })}
      </ul>
    );
  }
}

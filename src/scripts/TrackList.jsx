import React, { Component, PropTypes } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Track from './Track';

@DragDropContext(HTML5Backend)
export default class TrackList extends Component {
  static propTypes = {
    tracks: PropTypes.object.isRequired,
    moveTrack: PropTypes.func.isRequired,
    playTrack: PropTypes.func.isRequired,
    findTrack: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { tracks: { list, current }, findTrack, moveTrack, playTrack } = this.props;

    return (
      <ul className="tracks">
        {list.map((item, i) => {
          return (
            <Track key={item.tlid}
                   index={i}
                   id={i}
                   item={item}
                   current={current}
                   playTrack={playTrack}
                   moveTrack={moveTrack}
                   findTrack={findTrack}
                   />
          );
        })}
      </ul>
    );
  }
}

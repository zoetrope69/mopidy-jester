import React, { Component } from 'react';

export default class TrackList extends Component {
  static propTypes: {
    mopidy: PropTypes.object.isRequired,
    list: PropTypes.array.isRequired,
    current: PropTypes.object
  }

  constructor(props) {
    super(props);
  }

  playSong(tlid) {
    const { mopidy } = this.props;
    mopidy.playback.play([null, tlid])
      .catch((error) => console.log(error))
      .then(() => console.log('playing'));
  }

  render() {

    const { list, current } = this.props;

    return (
    <ul className="tracks">
      {list.map((item, key) => {

        let isCurrentTrack = false

        if (item.tlid && current.tlid) {
          isCurrentTrack = item.tlid === current.tlid;
        }

        let trackSource = 'unknown';
        if (item.track.uri.indexOf(':')) {
          trackSource = item.track.uri.substr(0, item.track.uri.indexOf(':'));
        }

        return (
          <li key={key}
              className={`track track--source-${trackSource}` + (isCurrentTrack ? ` track--${current.state}` : '')}
              onClick={this.playSong.bind(this, item.tlid)}>

            <div className="track__indicator">{isCurrentTrack ? '🔊' : key}</div>

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
        );

      })}
    </ul>
    );
  }
}

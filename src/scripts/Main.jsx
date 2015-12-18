import React, { Component } from 'react';

export default class Main extends Component {
  static propTypes: {
    mopidy: PropTypes.object.isRequired,
    tracks: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
  }

  playSong(tlid) {
    console.log(tlid);
    const {mopidy} = this.props;
    mopidy.playback.play([null, tlid])
      .catch((error) => console.log(error))
      .then(() => console.log('playing'));
  }

  render() {

    const { tracks } = this.props;

    return (
      <div className="main">
        {tracks.list && tracks.list.length > 0 && (
          <ul className="tracks">
            {tracks.list.map((item, key) => {

              const isCurrentTrack = item.tlid === tracks.current.tlid;

              let trackSource = 'unknown';
              if (item.track.uri.indexOf(':')) {
                trackSource = item.track.uri.substr(0, item.track.uri.indexOf(':'));
              }

              return (
                <li key={key}
                    className={`track track--source-${trackSource}` + (isCurrentTrack ? ` track--${tracks.current.state}` : '')}
                    onClick={this.playSong.bind(this, item.tlid)}>

                  <div className="track__indicator">{key}</div>

                  <div className="track__name">{item.track.name}</div>

                  {trackSource !== 'soundcloud' && (
                    <div className="track__album">
                      {typeof item.track.album !== 'undefined' && item.track.album.name}
                    </div>
                  )}

                  <div className="track__artists">
                    {typeof item.track.artists !== 'undefined' && item.track.artists[0].name}
                  </div>

                </li>
              );

            })}
          </ul>
        )}
      </div>
    );
  }
}

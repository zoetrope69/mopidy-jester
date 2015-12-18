import React, { Component } from 'react';

export default class CurrentTrack extends Component {
  static propTypes: {
    mopidy: PropTypes.object.isRequired,
    current: PropTypes.object.isRequired
  }

  togglePlaying() {
    const { mopidy, current } = this.props;

    if (current.state === 'paused') {
      mopidy.playback.resume();
    } else {
      mopidy.playback.pause();
    }
  }

  nextSong() {
    const { mopidy } = this.props;
    mopidy.playback.next();
  }

  previousSong() {
    const { mopidy } = this.props;
    mopidy.playback.previous();
  }

  millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }

  render() {

    const { current } = this.props;

    let progress = 0;

    if (current && current.track && current.position) {
      if (current.position > current.track.length) {
        progress = 100;
      } else if (current.position > 0) {
        progress = current.position / current.track.length * 100;
      }
    }

    return (
      <div className="sidebar">

        <div className="sidebar__art">
          {current.image && current.image.length > 0 && (
          <div>
            <img className="sidebar__art__foreground" src={current.image} />
            <img className="sidebar__art__background" src={current.image} />
          </div>
          )}
        </div>

        {(!current || !current.tlid || current.tlid === -1) ? (
          <div className="sidebar__main sidebar__main--no-song">No song playing yo..</div>
        ) : (
          <div className="sidebar__main">

            <div className="progress">
              <div className="progress__bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="sidebar__main__details">
              <p className="sidebar__main__details__name">{current.track.name}</p>
              <p className="sidebar__main__details__album">{typeof current.track.album !== 'undefined' && current.track.album.name}</p>
              <p className="sidebar__main__details__artist">{typeof current.track.artists !== 'undefined' && current.track.artists[0].name}</p>
            </div>

            <div className="controls">
              <button className="control control--previous" onClick={this.previousSong.bind(this)}>Previous</button>
              <button className={`control control--${current.state}`} onClick={this.togglePlaying.bind(this)}>{current.state}</button>
              <button className="control control--next" onClick={this.nextSong.bind(this)}>Next</button>
            </div>

            <div className="progress__details">
              <span className="progress__details__current">{this.millisToMinutesAndSeconds(current.position)}</span>
              <span className="progress__details__length">{this.millisToMinutesAndSeconds(current.track.length)}</span>
            </div>

          </div>
        )}

    </div>
  );
  }
}

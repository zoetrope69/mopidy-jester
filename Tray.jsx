import React, { Component } from 'react';
import Mopidy from 'mopidy';
import AlbumArt from './AlbumArt';

const mopidy = new Mopidy({
  webSocketUrl: 'ws://dogdicks.twinboyscolley.lol/mopidy/ws/',
  callingConvention: 'by-position-or-by-name'
});

export default class Tray extends Component {

	constructor(props) {

		super(props);

		this.state = {
			loading: false,
			loaded: false,
			track: {},
      trackPos: 0,
      playing: ''
		};

	}

	componentWillMount() {

		const that = this;

    that.setState({ loading: true });

    var promises = [];

		promises.push(mopidy.playback.getCurrentTrack().then((track) => {
			that.setState({ track });
		}));

    promises.push(mopidy.playback.getState().then((playing) => {

      if (playing === 'playing') {
        this.startTimer();
      }

      that.setState({ playing });
    }));

    promises.push(mopidy.playback.getTimePosition().then((trackPos) => {
      that.setState({ trackPos });
    }));

    Promise.all(promises).then((values) => {

      that.setState({
        loading: false,
        loaded: true
      });

      mopidy.on('event:trackPlaybackStarted', (data) => {
        const { track } = data.tl_track;

        that.stopTimer();
        that.startTimer();

  			that.setState({
          track,
          trackPos: 0
        });
  		});

      mopidy.on('event:trackPlaybackPaused', () => {
        that.stopTimer();
      });

      mopidy.on('event:trackPlaybackResumed', () => {
        that.startTimer();
      });

    });

	}

  componentWillUnmount() {
    this.stopTimer();
  }

  startTimer() {
    this.timer = setInterval(this.tick.bind(this), 1000);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  tick() {
    let { trackPos } = this.state;

    trackPos += 1000;

    this.setState({ trackPos });
  }

  togglePlaying() {
    const { playing } = this.state;

    if (playing === 'paused') {
      mopidy.playback.resume();
      this.setState({ playing: 'playing' });
      this.startTimer();
    } else {
      mopidy.playback.pause();
      this.setState({ playing: 'paused' });
      this.stopTimer();
    }
  }

  nextSong() {
    mopidy.playback.next();
  }

  previousSong() {
    mopidy.playback.previous();
  }

  millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }

	render() {

		const { loaded, loading, playing, track, trackPos } = this.state;

    const progress = trackPos / track.length * 100;

		return (
    <div>
    {loading && !loaded ? (
      <p>Loading data...</p>
    ) : (
    <div className="tray">

      <AlbumArt track={track} />

      <div className="tray__main">

        <progress className="tray__main__progress" max={track.length} value={trackPos} />

        <div className="tray__main__details">
          <p className="tray__main__details__name">{track.name}</p>
          <p className="tray__main__details__album">{track.album.name}</p>
          <p className="tray__main__details__artist">{track.artists[0].name}</p>
        </div>

        <div className="tray__main__controls">
          <button onClick={this.previousSong.bind(this)}>Previous</button>
          <button onClick={this.togglePlaying.bind(this)}>{playing === 'paused' ? 'Resume' : 'Pause'}</button>
          <button onClick={this.nextSong.bind(this)}>Next</button>

          <p>{this.millisToMinutesAndSeconds(trackPos)} / {this.millisToMinutesAndSeconds(track.length)}</p>
        </div>

      </div>

    </div>
    )}
		</div>
		);
	}
}

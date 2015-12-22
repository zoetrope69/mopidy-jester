import React, { Component, PropTypes } from 'react';

export default class CurrentTrack extends Component {
  static propTypes: {
    current: PropTypes.object,
    toggleTrack: PropTypes.func.isRequired,
    nextTrack: PropTypes.func.isRequired,
    previousTrack: PropTypes.func.isRequired,
    seekTrack: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);

    this.state = {
      potentialProgress: 0,
      progressDown: false
    };
  }

  millisToMinutesAndSeconds(millis) {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  getOffsetRect(elem) {
    const box = elem.getBoundingClientRect();

    const body = document.body;
    const docElem = document.documentElement;

    const scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    const clientTop = docElem.clientTop || body.clientTop || 0;
    const clientLeft = docElem.clientLeft || body.clientLeft || 0;

    const top = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
  }

  handleMouseMove(event) {
    const barElem = event.target;
    const barElemWidth = barElem.offsetWidth;
    const barElemPosition = this.getOffsetRect(barElem).left;
    const handlePosition = event.pageX - barElemPosition;

    const potentialProgress = Math.floor(handlePosition / barElemWidth * 100);

    this.setState({ potentialProgress });
  }

  handleMouseDown() {
    this.setState({ progressDown: true });
  }

  handleMouseUp(event) {
    console.log('handleMouseUp');
    this.setState({ progressDown: false });

    const { current, seekTrack } = this.props;
    const { potentialProgress } = this.state;

    const newPosition = Math.floor(current.track.length * (potentialProgress / 100));
    seekTrack(newPosition);
  }

  render() {
    const { current, toggleTrack, nextTrack, previousTrack } = this.props;
    const { potentialProgress, progressDown } = this.state;

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
            <img className="sidebar__art__foreground" src={current.image} />
          )}
        </div>

        {(!current || !current.tlid || current.tlid === -1) ? (
          <div className="sidebar__main sidebar__main--no-song">No song playing yo..</div>
        ) : (
          <div className="sidebar__main">

            <div className="progress"
                 onMouseMove={this.handleMouseMove.bind(this)}
                 onMouseDown={this.handleMouseDown.bind(this)}
                 onMouseUp={this.handleMouseUp.bind(this)}
                 >
              <div className="progress__bar" style={{ width: `${progressDown ? potentialProgress : progress}%` }}>
                <div className={`progress__bar__handle ${progressDown ? 'progress__bar__handle--active' : ''}`}/>
              </div>
            </div>

            <div className="sidebar__main__details">
              <p className="sidebar__main__details__name">{current.track.name}</p>
              <p className="sidebar__main__details__album">{!current.track.uri.includes('soundcloud:') && typeof current.track.album !== 'undefined' && current.track.album.name}</p>
              <p className="sidebar__main__details__artist">{typeof current.track.artists !== 'undefined' && current.track.artists[0].name}</p>
            </div>

            <div className="controls">
              <button className="control control--previous" onClick={previousTrack}>Previous</button>
              <button className={`control control--${current.state}`} onClick={toggleTrack}>{current.state}</button>
              <button className="control control--next" onClick={nextTrack}>Next</button>
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

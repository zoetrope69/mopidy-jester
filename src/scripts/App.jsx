import React, { Component } from 'react';
import request from 'superagent';
import Mopidy from 'mopidy';

import CurrentTrack from './CurrentTrack';
import TrackList from './TrackList';
import Search from './Search';

const lastFmApiKey = '2f12beee08b9eaf9baaf1b165b7852d3';
const mopidyOptions = {
  autoConnect: true,
  backoffDelayMin: 4000,
  backoffDelayMax: 64000,
  webSocketUrl: 'ws://192.168.0.22:6680/mopidy/ws/',
  callingConvention: 'by-position-or-by-name'
};

const mopidy = new Mopidy(mopidyOptions);

const timerIncrementAmount = 1000;
const attemptTimerIncrementAmount = 50;

export default class App extends Component {

  constructor(props) {
    super(props);

    this.moveTrack = this.moveTrack.bind(this);
    this.playTrack = this.playTrack.bind(this);
    this.toggleTrack = this.toggleTrack.bind(this);
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.nextTrack = this.nextTrack.bind(this);
    this.previousTrack = this.previousTrack.bind(this);
    this.seekTrack = this.seekTrack.bind(this);
    this.findTrack = this.findTrack.bind(this);
    this.search = this.search.bind(this);

    this.state = {
      timeToAttempt: 0,
      connecting: false,
      connected: false,
      error: '',
      loading: false,
      loaded: false,
      tracks: {
        list: [],
        current: {
          tlid: -1,
          track: {},
          position: 0,
          state: '',
          image: ''
        }
      }
    };
  }

  componentWillUpdate() {
    // console.log('state: ', this.state); // for debugging
  }

  componentWillMount() {
    const that = this;

    that.setState({ connecting: true });

    mopidy.on(console.log.bind(console));

    mopidy.on('websocket:error', () => {
      console.log('error websocket');

      that.setState({
        error: "Couldn't connect to the Mopidy server"
      });
    });

    mopidy.on('websocket:close', () => {
      console.log('close websocket');
      that.cleanupMopidy();
    });

    mopidy.on('websocket:open', () => {

      mopidy.on('state:offline', () => {
        console.log('mopidy is offline');
        that.setState({ connected: false });
      });

      mopidy.on('reconnecting', () => {
        console.log('reconnecting');
        that.setState({ connecting: true });
      });

      mopidy.on('reconnectionPending', (result) => {
        console.log('reconnectionPending');
        const { timeToAttempt } = result;
        that.setState({
          timeToAttempt,
          connecting: false
        });
        that.startAttemptTimer();
      });

      mopidy.on('state:online', () => {

        that.stopAttemptTimer();

        that.setState({
          connecting: false,
          connected: true
        });

        this.updateState(() => {

          that.startTimer();

          mopidy.on('event:seeked', (position) => {
            that.stopTimer();
            const { tracks } = this.state;
            tracks.current.position = position.time_position;
            that.setState({ tracks });
            that.startTimer();
          });

          mopidy.on('event:tracklistChanged', () => {
            that.updateState();
          });

          mopidy.on('event:trackPlaybackStarted', () => {
            that.startTimer();
            that.updateState();
          });

          mopidy.on('event:trackPlaybackEnded', () => {
            that.stopTimer();
            that.updateState();
          });

          mopidy.on('event:trackPlaybackPaused', () => {
            that.stopTimer();
            that.updateState();
          });

          mopidy.on('event:trackPlaybackResumed', () => {
            that.updateState(() => {
              that.startTimer();
            });
          });
        });
      });
    });
  }

  componentWillUnmount() {
    this.cleanupMopidy();
  }

  cleanupMopidy() {
    this.stopTimer();

    mopidy.close();
    mopidy.off();
  }

  startAttemptTimer() {
    this.stopAttemptTimer();
    this.attemptTimer = setInterval(this.updateAttemptTimer.bind(this), attemptTimerIncrementAmount);
  }

  stopAttemptTimer() {
    clearInterval(this.attemptTimer);
  }

  updateAttemptTimer() {
    let { timeToAttempt } = this.state;

    timeToAttempt -= attemptTimerIncrementAmount;

    if (timeToAttempt <= 0) {
      this.stopAttemptTimer();
    }

    this.setState({ timeToAttempt });
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(this.updateTimer.bind(this), timerIncrementAmount);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  updateTimer() {
    const { tracks } = this.state;

    tracks.current.position += timerIncrementAmount;

    this.setState({ tracks });
  }

  getAlbumArt(track) {
    return new Promise((resolve, reject) => {
      // check if there is already a image in the track object
      if (track.album && typeof track.album.images !== 'undefined') {
        return resolve(track.album.images[0]);
      }

      // look up the image using mopidy
      mopidy.library.getImages([ [track.uri] ])
        .then(uris => {
          const images = uris[track.uri];
          const image = images[0].uri;
          return resolve(image);
        })
        .catch(() => {
          // use last.fm to find any album art
          const artist = track.artists[0].name;
          const album = track.album.name;

          request
            .post(`http://ws.audioscrobbler.com/2.0/?method=album.getInfo&api_key=${lastFmApiKey}&format=json`)
            .query({ artist, album })
            .set('Accept', 'application/json')
            .end((err, res) => {
              if (err) {
                return reject("Couldn't find a image from Last.fm...");
              }

              const data = res.body;

              if (data.error) {
                return reject(data.message);
              }

              const images = data.album.image;

              // let's loop through the images and find the biggest

              let tempImage = '';
              for (let i = 0; i < images.length; i++) {
                const image = images[i];

                // if size specified
                if (image.size.length > 0) {
                  tempImage = image['#text'];
                }
              }

              // if there was an image bring that back
              if (tempImage.length > 0) {
                return resolve(tempImage);
              }

              return reject('No image found');
            });
        });
    });
  }

  getTrackList() {
    return new Promise((resolve, reject) => {
      mopidy.tracklist.getTlTracks()
        .catch(error => reject(error))
        .then(tlTracks => resolve(tlTracks));
    });
  }

  getCurrentTrack() {
    return new Promise((resolve, reject) => {
      mopidy.playback.getCurrentTlTrack()
        .catch(error => reject(error))
        .then(tlTrack => resolve(tlTrack));
    });
  }

  getCurrentTrackState() {
    return new Promise((resolve, reject) => {
      mopidy.playback.getState()
        .catch(error => reject(error))
        .then(state => resolve(state));
    });
  }

  getCurrentTrackPosition() {
    return new Promise((resolve, reject) => {
      mopidy.playback.getTimePosition()
        .catch(error => reject(error))
        .then(position => resolve(position));
    });
  }

  formState() {
    return new Promise((resolve, reject) => {
      const promises = [];

      promises.push(this.getTrackList());
      promises.push(this.getCurrentTrack());
      promises.push(this.getCurrentTrackState());
      promises.push(this.getCurrentTrackPosition());

      Promise.all(promises)
        .then(results => {
          const state = {
            list: results[0] || [],
            current: {
              ...results[1],
              state: results[2],
              position: results[3]
            }
          };
          resolve(state);
        }, reason => reject(reason));
    });
  }

  updateState(callback) {
    const that = this;

    this.formState().
      catch(error => {
        that.setState({
          loading: false,
          loaded: false,
          error
        });

        if (callback) {
          callback();
        }
      })
      .then(tracks => {
        that.setState({
          loading: false,
          loaded: true,
          tracks: {
            ...tracks
          }
        });

        if (tracks.current) {
          that.getAlbumArt(tracks.current.track)
            .catch((error) => {
              console.log('art error', error);
              const { tracks } = this.state;
              tracks.current.image = '';
              that.setState({ tracks });
            })
            .then(image => {
              const { tracks } = this.state;
              tracks.current.image = image;
              that.setState({ tracks });
            });
        }

        if (callback) {
          callback();
        }

      });

  }

  moveTrack(dragIndex, hoverIndex) {
    mopidy.tracklist.move({ start: dragIndex, end: dragIndex, to_position: hoverIndex})
      .catch((error) => console.log(error));
  }

  addTrack(uri) {
    mopidy.tracklist.add({ uris: [uri] })
      .catch((error) => console.log(error));
  }

  removeTrack(tlid) {
    mopidy.tracklist.remove({ tlid: [tlid] })
      .catch((error) => console.log(error));
  }

  playTrack(tlid) {
    mopidy.playback.play([null, tlid])
      .catch((error) => console.log(error));
  }

  toggleTrack() {
    const { tracks: { current } } = this.state;

    if (current.state === 'paused') {
      mopidy.playback.resume();
    } else {
      mopidy.playback.pause();
    }
  }

  nextTrack() {
    mopidy.playback.next();
  }

  previousTrack() {
    mopidy.playback.previous();
  }

  findTrack(id) {
    const { tracks: { list } } = this.state;
    const track = list[id];

    return {
      track,
      index: id
    };
  }

  seekTrack(position) {
    return new Promise((resolve, reject) => {
      mopidy.playback.seek({ time_position: position })
        .catch(error => reject(error))
        .then(result => resolve('seeked', result));
    });
  }

  search(term) {
    const that = this;
    return new Promise((resolve, reject) => {
      mopidy.library.search({ any: [term] })
        .catch(error => reject(error))
        .then(results => {
          console.log('results', results);
          if (results.length < 1) {
            reject('No results');
          }

          const result = results[0];

          result.albums = result.albums.map(album => {
            that.getAlbumArt(album)
              .catch(() => console.log('Didnt find album art'))
              .then(image => album.image = image);
            return album;
          });

          resolve(result);
        });
    });
  }

  render() {

    const { timeToAttempt, error, connecting, connected, loading, loaded, tracks } = this.state;

    const timeToAttemptSeconds = Math.floor((timeToAttempt + 1) / 1000);

    return (
    <div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!connected && <p>Not connected to Mopidy. </p>}
      {timeToAttemptSeconds > 0 && <p>{timeToAttemptSeconds} second{timeToAttemptSeconds > 1 ? 's' : ''} to try again...</p>}
      {connecting && <p>Connecting now...</p>}

      {!connecting && connected && (
      <div>

        {!loaded && <p>No tracks loaded in.</p>}
        {loading && <p>Loading tracks...</p>}

        {!loading && loaded && (
        <div>
          {tracks && (
            <div>
              <Search
                addTrack={this.addTrack}
                search={this.search} />
              <CurrentTrack
                toggleTrack={this.toggleTrack}
                nextTrack={this.nextTrack}
                previousTrack={this.previousTrack}
                seekTrack={this.seekTrack}
                current={tracks.current}
                />
              <div className="main">
                {tracks.list && tracks.list.length > 0 && (
                  <TrackList
                    tracks={tracks}
                    playTrack={this.playTrack}
                    moveTrack={this.moveTrack}
                    findTrack={this.findTrack}
                    removeTrack={this.removeTrack}
                    />
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
      )}
    </div>
    );
  }
}

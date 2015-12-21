import React, { Component } from 'react';
import request from 'superagent';
import Mopidy from 'mopidy';
import CurrentTrack from './CurrentTrack';
import TrackList from './TrackList';
import Search from './Search';

const lastFmApiKey = '2f12beee08b9eaf9baaf1b165b7852d3';

const mopidy = new Mopidy({
  webSocketUrl: 'ws://localhost:6680/mopidy/ws/',
  callingConvention: 'by-position-or-by-name'
});

const timerIncrementAmount = 1000;

export default class App extends Component {

  constructor(props) {

    super(props);

    this.state = {
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
    // console.log('state: ', this.state);
  }

  componentWillMount() {

    const that = this;

    that.setState({ connecting: true });

    mopidy.on('state:online', () => {

      that.setState({
        connecting: false,
        connected: true
      });

      this.updateState(() => {
        that.startTimer();

        mopidy.on('event:tracklistChanged', (data) => {
          that.updateState();
        });

        mopidy.on('event:trackPlaybackStarted', (data) => {
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

    mopidy.on('state:offline', () => {
      that.setState({ connected: false });
    });

  }

  componentWillUnmount() {
    this.stopTimer();

    mopidy.close();
    mopidy.off();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(this.updateTimer.bind(this), timerIncrementAmount);
  }

  stopTimer() {
    clearInterval(this.timer);
  }

  updateTimer() {
    let { tracks } = this.state;

    tracks.current.position += timerIncrementAmount;

    this.setState({ tracks });
  }

  getAlbumArt() {
    return new Promise((resolve, reject) => {
      const that = this;
      const { track } = this.state.tracks.current;

      // check if there is already a image in the track object
      if (track.album && typeof track.album.images !== 'undefined') {
        return resolve(track.album.images[0]);
      } else {

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
              .end(function(err, res) {
                if (err) {
                  console.log(err);
                  return reject("Couldn't find a image from Last.fm...");
                }

                const data = res.body;

                if (data.error) {
                  return reject(data.message);
                }

                const images = data.album.image;

                // let's loop through the images and find the biggest

                let tempImage = '';
                for (var i = 0; i < images.length; i++) {
                  var image = images[i];

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

      }

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

  updateState(callback = () => {}) {

    const that = this;

    this.formState().
      catch(error => {

        that.setState({
          loading: false,
          loaded: false,
          error
        });

        callback();

      })
      .then(result => {

        that.setState({
          tracks: {
            ...result
          }
        });

        this.getAlbumArt()
          .catch(error => console.log(error))
          .then(image => {
            let { tracks } = this.state;
            tracks.current.image = image;
            that.setState({tracks});
          });

        callback();

      });

  }

  render() {

    const { connecting, connected, loading, loaded, tracks } = this.state;

    return (
    <div>
      {connecting && !connected ? (
        <p>Connecting to Mopidy...</p>
      ) : (
      <div>
        {loading && !loaded ? (
          <p>Loading tracks...</p>
        ) : (
        <div>
          {tracks && (
            <div>
              {/* <Search mopidy={mopidy} /> */}
              <CurrentTrack mopidy={mopidy} current={tracks.current} />
              <div className="main">
                {tracks.list && tracks.list.length > 0 && (
                  <TrackList mopidy={mopidy} list={tracks.list} current={tracks.current} />
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

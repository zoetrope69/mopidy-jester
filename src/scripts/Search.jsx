import React, { Component } from 'react';
import TrackList from './TrackList';

export default class Main extends Component {
  static propTypes: {
    mopidy: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    this.state = {
      terms: '',
      tracks: [],
      albums: []
    }
  }

  handleChange(event) {
    const terms = event.target.value;
    console.log('handleChange', terms);
    this.setState({ terms });
  }

  searchSong() {
    const that = this;
    const { mopidy } = this.props;
    const { terms } = this.state;
    const searchService = 'spotify';

    console.log('searchSong', terms);

    mopidy.library.search([{ any: [terms] }, [searchService + ':']])
      .catch((error) => console.log(error))
      .then((results) => {
        console.log(results);
        const { tracks, albums } = results[0];
        that.setState({ tracks, albums });
      });
  }

  render() {

    const { mopidy } = this.props;
    const { terms } = this.state;
    let { tracks } = this.state;

    tracks = tracks.map(item => {
      return {
        track: item
      };
    });

    return (
      <div className="search">
        <label className="search__icon" for="search">🔍</label>
        <input className="search__input" id="search"
                placeholder="Search" value={terms}
                onBlur={this.searchSong.bind(this)}
                onChange={this.handleChange.bind(this)} />
        {tracks && tracks.length > 0 && (
          <TrackList mopidy={mopidy} list={tracks} />
        )}
      </div>
    );
  }
}

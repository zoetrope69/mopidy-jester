import React, { Component, PropTypes } from 'react';

export default class CurrentTrack extends Component {
  static propTypes = {
    search: PropTypes.func,
    addTrack: PropTypes.func
  }

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.search = this.search.bind(this);

    this.state = {
      term: '',
      results: {
        artists: [],
        albums: [],
        tracks: []
      }
    };
  }

  handleChange(event) {
    const term = event.target.value;
    this.setState({ term });
  }

  search(event) {
    event.preventDefault();
    const { term } = this.state;
    const { search } = this.props;

    search(term)
      .then(results => this.setState({ results }))
      .catch(error => console.log(error));
  }

  handleClick(uri) {
    const { addTrack } = this.props;
    addTrack(uri);
  }

  render() {
    const { results } = this.state;

    return (
      <div className="search">
        <form onSubmit={this.search} className="search__box">
          <input placeholder="dj khaled" className="search__input" type="text" onChange={this.handleChange} />
          <button className="search__icon" type="submit">🔍</button>
        </form>

        {results.artists.length > 0 && (
        <div className="artists">
          <h2 className="search__heading">Artists</h2>
          {results.artists.map((artist, i) =>
            <li key={i} className="artist">
              <div className="artist__name">{artist.name}</div>
            </li>
          )}
        </div>
        )}

        {results.albums.length > 0 && (
        <div className="albums">
          <h2 className="search__heading">Albums</h2>
          {results.albums.map((album, i) =>
            <li key={i} className="album">
              <div className="album__art">
                <img src={album.image ? album.image : 'http://lorempixel.com/300/300'} alt={`${album.name}'s album art`} />
              </div>
              <div className="album__name">{album.name}</div>
            </li>
          )}
        </div>
        )}

        {results.tracks.length > 0 && (
        <div className="tracks">
          <h2 className="search__heading">Tracks</h2>
          {results.tracks.map((track, i) => {
            let trackSource = 'unknown';
            if (track.uri.indexOf(':')) {
              trackSource = track.uri.substr(0, track.uri.indexOf(':'));
            }

            return (
            <li key={i} className={`track track--source-${trackSource}`} onClick={this.handleClick.bind(this, track.uri)}>

              <div className="track__indicator">➕</div>

              <div className="track__name">{track.name}</div>

              {trackSource !== 'soundcloud' && (
                <div className="track__album">
                  {typeof track.album !== 'undefined' && track.album.name}
                </div>
              )}

              <div className="track__artists">
                {typeof track.artists !== 'undefined' && track.artists[0].name}
              </div>

              <div className="track__source"></div>

            </li>
            );
          })}
        </div>
        )}

      </div>
    );
  }
}

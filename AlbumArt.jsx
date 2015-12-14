import React, { Component, PropTypes } from 'react';
import request from 'superagent';

const lastFmApi = '2f12beee08b9eaf9baaf1b165b7852d3';

export default class AlbumArt extends Component {

	propTypes: {
		track: PropTypes.object.isRequired,
		image: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			image: 'http://fillmurray.com/200/200'
		};
	}

	getAlbumArt(size = 'medium') {

		const that = this;

		const validSizes = ['small', 'medium', 'large', 'extralarge'];

		// is the album art request a valid size
		if (validSizes.indexOf(size) < 0) {
			return false;
		}

		const { track } = this.props;

		const artist = track.artists[0].name;
		const album = track.album.name;

		if (track) {

			if (typeof track.album.images !== 'undefined') {
				that.setState({ image: track.album.images[0] });
			} else {

				request
					.post(`http://ws.audioscrobbler.com/2.0/?method=album.getInfo&api_key=${lastFmApi}&format=json`)
					.query({ artist, album })
					.set('Accept', 'application/json')
					.end(function(err, res){
						if (err) {
							console.log(err);
						}

						const data = JSON.parse(res.text);

						const images = data.album.image;

						for (var i = 0; i < images.length; i++) {
							var image = images[i];

							// if size specified
							if (image.size === size) {
								if (typeof image['#text'] !== 'undefined' && image['#text'] !== '') {
									that.setState({ image: image['#text'] })
								}
							}
						}

					});

				}

		}

	}

	componentDidUpdate() {
    this.getAlbumArt('extralarge');
  }

	render() {

		const { image } = this.state;

		return (
		<div className="tray__art">
      <img src={image} />
		</div>
		);

	}
}

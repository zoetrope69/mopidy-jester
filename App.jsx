import React, { Component } from 'react';
import Mopidy from 'mopidy';
import Track from './Track';

const mopidy = new Mopidy({
  webSocketUrl: 'ws://dogdicks.twinboyscolley.lol/mopidy/ws/',
  callingConvention: 'by-position-or-by-name'
});

export default class App extends Component {

	constructor(props) {

		super(props);

		this.state = {
			connecting: false,
			connected: false,
			error: ''
		};

		// mopidy.on('event:teackchaned')

	}

	componentWillMount() {

		const that = this;

		that.setState({ connecting: true });

		mopidy.on('state:online', () => {
			that.setState({
				connecting: false,
				connected: true
			});
		});

		mopidy.on('state:offline', () => {
			that.setState({
				connected: false
			});
		});

	}

	render() {

		const { connecting, connected } = this.state;

		return (
    <div>
		{connecting && !connected ? (
			<p>Connecting to Mopidy...</p>
		) : (
			<Tray />
		)}
		</div>
		);
	}
}

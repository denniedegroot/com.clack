'use strict';

const Homey = require('homey');
const { Discovery } = require('@2colors/esphome-native-api');

class ClackDriver extends Homey.Driver {

	onInit() {
		this.log('ClackDriver has been inited');
		
		this._devices = {};
	}

	async discover() {
		this._devices = {};

		await Discovery().then(devices => {
			devices.forEach(device => {
				if (device.friendly_name !== 'clack' || this._devices[device.mac])
					return;

				this.log(`Found device: ${device.mac}`)
				this._devices[device.mac] = device;
			})
		})
		.catch(this.error);
	}

	async onPairListDevices( data ) {
		this.log('onPairListDevices');

		await this.discover();

		return await Promise.all(Object.keys(this._devices).map(deviceId => {
			return {
				name: 'Clack Reader',
				data: {
					id: deviceId,
				}
			}
		}));
	}

}

module.exports = ClackDriver;
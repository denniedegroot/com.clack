'use strict';

const Homey = require('homey');
const { Client } = require('@2colors/esphome-native-api');
const { Discovery } = require('@2colors/esphome-native-api');

const capabilityMapping = {
	"clacktext_sensorzout_bijvullen"		: "alarm_salt",
	"clacksensorvermogen"					: "measure_power",
	"clacksensorspanning"					: "measure_voltage",
	"clacksensorstroom"						: "measure_current",
	"clacksensorwatermeter"					: "meter_water_liter",
	"clacksensorwaterontharder_m3_over"		: "meter_water_remaining_m3",
	"clacksensorwaterontharder_ltr_over"	: "meter_water_remaining_ltr",
	"clacknumbercapaciteit_in_liters"		: "meter_water_capacity_ltr",
	"clacksensorzoutniveau_procent"			: "meter_salt_level",
	"clackswitchchlorinator"				: "clack_chlorinator",
	"clacktext_sensorgeregenereerd_op"		: "clack_regenerated"
}

class ClackDevice extends Homey.Device {

	async onInit() {
		this.log('ClackDevice has been inited');
		this.setUnavailable();

		this._device = null;
		this._deviceEntities = [];

		this._searchDevice();
	}

	async _onDeviceInit() {
		this.log('_onDeviceInit');

		const client = new Client({
			host: this._device.address,
			port: this._device.port,
		});

		client.connect();

		client.on('deviceInfo', deviceInfo => {
			this.setAvailable();
		});

		client.on('newEntity', entity => {
			this._deviceEntities[entity.config.key] = entity.config;

			entity.on('state', (state) => {
				if (!this._deviceEntities[state.key])
					return;

				const capabilityName = capabilityMapping[this._deviceEntities[state.key].uniqueId];

				if (capabilityName) {
					if (capabilityName == 'alarm_salt') {
						let value = false;
						const valueOld = this.getCapabilityValue(capabilityName);

						if (state.state == 'ja' || state.state == 'yes')
							value = true;

						if (value != valueOld)
							this.setCapabilityValue(capabilityName, value).catch(this.error);
					} else {
						if (this.getCapabilityValue(capabilityName) != state.state)
							this.setCapabilityValue(capabilityName, state.state).catch(this.error);
					}
				}

				this.log(this._deviceEntities[state.key].uniqueId + ' updated to ' + state.state);
			});
		});
		
		client.on('error', (error) => this.log(error));
	}

	async _searchDevice() {
		const {id} = this.getData();

		await Discovery().then(devices => {
			devices.forEach(device => {
				if (id === device.mac) {
					this.log(`Found device: ${device.mac}`)
					this._device = device;
					this._onDeviceInit();

					return;
				}
			})
		})
		.catch(this.error);
	}

}

module.exports = ClackDevice;
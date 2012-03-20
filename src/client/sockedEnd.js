(function ($wnd, Socked) {
	"use strict";
	var Logger = Socked.Logger;
	var Transport = Socked.Transport;

	var ready = function (cb) {
		if (typeof (cb) === 'function') {
			try {
				cb();
			} catch (e) {
				Logger.log('Error on Socked.ready(): ', e);
			}
		}
	};

	var transport = new Transport();

	var createConnection = function (connectionInfo) {
		return transport.createConnection(connectionInfo);
	};
	var getChannel = function (connId, channelName) {
		var conn = transport.getConnection(connId);
		if (conn === null) {
			return null;
		}
		return conn.getChannel(channelName);
	};
	var subscribe = function (connId, channelName, options) {
		var channel = getChannel(connId, channelName);
		if (channel === null) {
			return null;
		}
		return channel.subscribe(options);
	};

	// replace the global Socked object by
	// one that only implements the public API
	$wnd.Socked = {
			ready: ready,
			createConnection: createConnection,
			getChannel: getChannel,
			subscribe: subscribe
	};

}(window, window.Socked));

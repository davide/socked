//SockJS connection
// TODO: refactor non-sockjs Connection code up the "class hierarchy"
(function ($wnd, Socked) {
	"use strict";
	if (typeof ($wnd.SockJS) === 'undefined') {
		Socked.Connection = function() {
			throw "SockJS not available";
		}
		return;
	}
	var Channel = Socked.Channel;
	var Logger = Socked.Logger;
	Socked.Connection = function(connInfo) {
		var deferredMessages = [];

		var appKey = connInfo.appKey;
		var channels = {};
		for (var i = 0; i < connInfo.channels.length; i += 1) {
			var channelInfo = connInfo.channels[i];
			var channel = new Channel(channelInfo, this);
			var name = channelInfo.name;
			channels[name] = channel;
		}

		var deferMessage = function (message) {
			deferredMessages.push(message);
		}

		var send = function (message) {
			// Abstract
		};

		var sendOrDefer = function (message) {
			// Abstract
		};

		var sendDeferredMessages = function () {
			for (var i = 0; i < deferredMessages.length; i += 1) {
				send(deferredMessages[i]);
			}
			deferredMessages = [];
		};

		this.getId = function() {
			return (connInfo === null) ? "" : connInfo.id;
		};

		this.getChannel = function (channelName) {
			return channels[channelName] || null;
		};

		var handleChannelMessage = function (channelName, op, message) {
			var channel = self.getChannel(channelName);
			if (channel !== null) {
				if (op === "s") {
					channel.onConnect();
				} else if (op === "u") {
					channel.onDisconnect();
				} else {
					channel.onMessage(message);
				}
			}
		}

		//
		// START SockJS specific fields / functions
		//
		var self = this;
		var socket = null;

		var SUBSCRIBE_CODE = "s";
		var UPDATE_SUBSCRIPTION_CODE = "us";
		var UNSUBSCRIBE_CODE = "u";
		var MESSAGE_CODE = "m";

		this.isConnected = function () {
			return socket !== null;
		};

		var handleClose = function() {
			socket = null;
			// TODO: reconnect?
			// TODO: broadcast failure to channel listeners?
		};

		// override abstract
		send = function (message) {
			if (socket !== null) {
				message = JSON.stringify(message);
				socket.send(message);
			}
		};

		// override abstract
		sendOrDefer = function (message) {
			if (socket !== null) {
				send(message);
			} else {
				deferMessage(message);
			}
		};

		var afterConnectHandlers = {
				onopen : function() {
					// Never called, right?
				},
				onmessage : function(m) {
					var data = JSON.parse(m.data);
					var channelName = data.shift();
					var op = data.shift();
					var msg = data.shift();
					handleChannelMessage(channelName, op, msg);
				},
				onclose : function() {
					handleClose();
				}
		};

		var createSocket = function (host, onConnectionSucceeded, onConnectionFailed) {
			var url = "http://" + host + "/sockjs";
			var sjsSocket = new $wnd.SockJS(url);

			sjsSocket.onopen = function() {
				sjsSocket.onmessage = afterConnectHandlers.onmessage;
				sjsSocket.onopen = afterConnectHandlers.onopen;
				sjsSocket.onclose = afterConnectHandlers.onclose;
				onConnectionSucceeded(sjsSocket);
			};
			sjsSocket.onclose = function() {
				var reason = 'Connection closed.';
				onConnectionFailed(reason);
			};
		};

		var authenticate = function () {
			var message = [appKey];
			send(message);
		};

		this.connect = function(onConnectionSucceeded, onConnectionFailed){
			if (socket !== null) {
				onConnectionSucceeded(self);
				return;
			}
			// TODO: perform authentication
			var host = connInfo.server;
			createSocket(host, function (sjsSocket) {
				socket = sjsSocket;
				authenticate();
				sendDeferredMessages();
				onConnectionSucceeded(self);
			},
			function (reason) {
				socket = null;
				onConnectionFailed(reason);
			});
		}

		this.disconnect = function(){
			if (socket !== null) {
				socket.close();
				socket = null;
			}
		};

		this.connectToChannel = function (channelName) {
			var message = [channelName, SUBSCRIBE_CODE];
			sendOrDefer(message);
		};

		this.disconnectFromChannel = function (channelName) {
			var message = [channelName, UNSUBSCRIBE_CODE];
			sendOrDefer(message);
		};

		this.sendToChannel = function (channelName, msg) {
			var message = [channelName, MESSAGE_CODE, msg];
			sendOrDefer(message);
		};

		this.updateChannelSubscription = function (channelName, role, interests) {
			var message = [channelName, UPDATE_SUBSCRIPTION_CODE, role];
			if (interests !== null) {
				var interestsArray = [];
				var l = interests.length;
				for (var i = 0; i < l; i += 1) {
					interestsArray[i] = interests[i];
				}
				message[3] = interestsArray;
			}
			sendOrDefer(message);
		};
	};
}(window, window.Socked));


(function ($wnd) {
	"use strict";
	$wnd.Socked = {};
}(window));

(function ($wnd, Socked) {
	"use strict";
	Socked.Logger = {
			log: function () {
				var l = arguments.length;
				var arr = [];
				for (var i = 0; i < l; i += 1) {
					arr[i] = arguments[i];
				}
				if (typeof ($wnd.console) !== 'undefined') {
					$wnd.console.log(arr);
				}
			}
	};
}(window, window.Socked));

(function (Socked) {
	"use strict";
	Socked.ChannelRef = function (channel, reSubscribeCallback) {
		var self = this;
		this.onConnect = null;
		this.onMessage = null;
		this.onDisconnect = null;
		this.options = {
			role: "sender",
			interests: null
		};

		this.onConnect = function (onConnect) {
			self.onConnect = onConnect;
			return self;
		};

		this.onMessage = function (onMessage) {
			self.onMessage = onMessage;
			return self;
		};

		this.onDisconnect = function (onDisconnect) {
			self.onDisconnect = onDisconnect;
			return self;
		};

		this.send = function (message) {
			if (channel !== null) {
				if (self.options.role === "receiver") {
					return;
				}
				channel.send(message);
			}
		};

		this.unsubscribe = function () {
			if (channel !== null) {
				channel.unsubscribe(self);
			}
		};

		// TODO: check if already subscribed
		this.reSubscribe = function(options) {
			if (channel !== null) {
				reSubscribeCallback(self, options);
			}
		};
	};
}(window.Socked));

(function (Socked) {
	"use strict";
	var ChannelRef = Socked.ChannelRef;
	Socked.Channel = function(connInfo, conn) {
		var self = this;
		var name = connInfo.name;
		var channelRefs = [];

		var countUp = function(x){return x + 1};
		var countDown = function(x){return x - 1};

		var connect = function () {
			conn.connectToChannel(name);
		};

		var disconnect = function() {
			conn.disconnectFromChannel(name);
		};

		var subscribeWithRef = function (ref, options) {
			ref.options = options;
			if (channelRefs.length === 0) {
				connect();
			}
			var optionsUpdated = updateSubscriptionOptions(options, countUp);
			if (optionsUpdated === true) {
				conn.updateChannelSubscription(name, channelRole, channelInterests);
			}
			channelRefs.push(ref);
		};

		var numSenders = 0;
		var numReceivers = 0;
		var DEFAULT_CHANNEL_ROLE = "sender";
		var channelRole = DEFAULT_CHANNEL_ROLE;

		var updateRolesCount = function (role, countUpdater) {
			if (role !== "sender") {
				numReceivers = countUpdater(numReceivers);
			}
			if (role !== "receiver") {
				numSenders = countUpdater(numSenders);
			}
		};

		var updateChannelRole = function (role, countUpdater) {
			updateRolesCount(role, countUpdater);

			var newRole = DEFAULT_CHANNEL_ROLE;
			if (numSenders > 0 && numReceivers > 0) {
				newRole = "both";
			} else if (numSenders > 0) {
				newRole = "sender";
			} else if (numReceivers > 0) {
				newRole = "receiver";
			}
			if (newRole !== channelRole) {
				channelRole = newRole;
				return true;
			}
			return false;
		};

		var allInterestsCount = 0;
		var channelInterestsCounts = {};
		var channelInterests = null;

		var updateInterestsCount = function (interests, countUpdater) {
			if (interests === null) {
				allInterestsCount = countUpdater(allInterestsCount);
				return;
			}
			var l = interests.length;
			for (var i = 0; i < l; i += 1) {
				var interest = interests[i];
				var count = channelInterestsCounts[interest] || 0;
				count = countUpdater(count);
				if (count === 0) {
					delete (channelInterestsCounts[interest]);
				} else {
					channelInterestsCounts[interest] = count;
				}
			}
		};

		var updateChannelInterests = function (interests, countUpdater) {
			updateInterestsCount(interests, countUpdater);

			// subscribe to all interests
			if (allInterestsCount > 0) {
				if (channelInterests !== null) {
					channelInterests = null;
					return true;
				}
				return false;
			}

			// here allInterestsCount == 0

			// capture the updated interests (channelInterestsCounts' keys)
			var newInterests = [];
			var newInterestsLength = 0;
			for (var key in channelInterestsCounts) {
				if (channelInterestsCounts.hasOwnProperty(key)) {
					newInterests.push(key);
					newInterestsLength += 1;
				}
			}

			if (newInterestsLength === 0) {
				// No interests exist!
				// This should only happen when there are no subscriptions. In which
				// case there's no point in updating the interests on the server
				// side... but we'll do it anyway for consistency sake.
				channelInterests = null;
				return true;
			}

			if (channelInterests === null) {
				channelInterests = newInterests.sort();
				return true;
			}

			// channelInterests !== null
			// compare new and old interests
			newInterests.sort();
			var channelInterestsLength = channelInterests.length;
			if (newInterestsLength === channelInterestsLength) {
				var i = 0;
				for (; i < newInterestsLength; i += 1) {
					if (newInterests[i] !== channelInterests[i]) {
						break;
					}
				}
				if (i === newInterestsLength) {
					return false;
				}
			}
			channelInterests = newInterests;
			return true;
		};

		var updateSubscriptionOptions = function (options, countUpdater) {
			var role = options.role;
			var roleUpdated = updateChannelRole(role, countUpdater);
			var interests = options.interests || null;
			var interestsUpdated = updateChannelInterests(interests, countUpdater);
			return roleUpdated || interestsUpdated;
		};

		this.subscribe = function (options) {
			var reSubscribeCallback = function(ref, options) {
				subscribeWithRef(ref, options);
			};
			var ref = new ChannelRef(self, reSubscribeCallback);
			subscribeWithRef(ref, options);
			return ref;
		}

		this.unsubscribe = function (ref) {
			// channelRefs.remove(ref)
			var pos = channelRefs.indexOf(ref);
			if (pos !== -1) {
				channelRefs.splice(pos);
			}
			ref.onDisconnect();
			if (channelRefs.length === 0) {
				disconnect();
			}
			var options = ref.options;
			var optionsUpdated = updateSubscriptionOptions(options, countDown);
			if (optionsUpdated === true) {
				conn.updateChannelSubscription(name, channelRole, channelInterests);
			}
		}

		this.onConnect = function () {
			var l = channelRefs.length;
			for (var i = 0; i < l; i += 1) {
				var ref = channelRefs[i];
				if (ref.onConnect !== null) {
					ref.onConnect();
				}
			}
		};

		this.onMessage = function (message) {
			var l = channelRefs.length;
			for (var i = 0; i < l; i += 1) {
				var ref = channelRefs[i];
				if (ref.onMessage !== null) {
					if (ref.options.role === "sender") {
						continue;
					}
					if (typeof (message.action) !== 'undefined') {
						var action = message.action;
						var interests = ref.options.interests || null;
						if (interests !== null) {
							var l2 = interests.length;
							var found = false;
							for (var i2 = 0; i2 < l2; i2 += 1) {
								if (interests[i2] === action) {
									found = true;
									break;
								}
							}
							if (!found) {
								continue;
							}
						}
					}
					ref.onMessage(message);
				}
			}
		};

		this.onDisconnect = function () {
			var l = channelRefs.length;
			for (var i = 0; i < l; i += 1) {
				var ref = channelRefs[i];
				if (ref.onDisconnect !== null) {
					ref.onDisconnect();
				}
			}
		};

		this.send = function (message) {
			conn.sendToChannel(name, message);
		};
	};
}(window.Socked));

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


(function (Socked) {
	"use strict";
	var Logger = Socked.Logger;
	var Connection = Socked.Connection;
	Socked.Transport = function() {
		var connections = {};

		var openConnection = function (id, conn) {
			conn.connect(function () {
				Logger.log("Socked: connection " + id + " established!");
			}, function (reason) {
				var errorMsg = "Connection " + id + "#connect() failed due to " + reason;
				Logger.log(errorMsg);
				// TODO: Broadcast connection error via DOM
			});
		};

		this.createConnection = function (connInfo) {
			var id = connInfo.id;
			var conn = connections[id] || null;
			if (conn === null) {
				conn = new Connection(connInfo);
				connections[id] = conn;
				openConnection(id, conn);
			}
			return conn;
		};

		this.getConnection = function (id) {
			return connections[id] || null;
		}
	};
}(window.Socked));

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

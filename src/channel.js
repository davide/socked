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

		this.inspectChannelRole = function() {
			return channelRole;
		};

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

		this.inspectChannelInterests = function() {
			return channelInterests;
		};

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

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

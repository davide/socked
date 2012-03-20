// Reference: http://expressjs.com/
var express = require('express')
var app = express.createServer();

var docroot = __dirname + '/../../www';
console.log('Serving files from ' + docroot);
app.use(express.static(docroot));
app.use(express.errorHandler({
	dumpExceptions : true,
	showStack : true
}));

// Worth reading:
// http://stackoverflow.com/questions/4445883/node-websocket-server-possible-to-have-multiple-separate-broadcasts-for-a-si
var channels = {};
var getChannel = function(name) {
	var channel = channels[name];
	if (channel == null) {
		channels[name] = channel = [];
	}
	return channel;
}
var subscribeChannel = function(conn, name) {
	var channel = getChannel(name);
	channel.push(conn);
	return channel;
}
var unsubscribeChannel = function(conn, channel) {
	for ( var c in channels) {
		if (c == channel) {
			delete (channels.c);
			return;
		}
	}
};

var broadcastToChannel = function(channelName, msg) {
	var channel = getChannel(channelName);
	if (channel == null) {
		return;
	}
	for ( var i = channel.length - 1; i >= 0; i--) {
		var conn2 = channel[i];
		if (conn2.role == 'sender') {
			// console.log("SKIPING connection with sender role")
			continue;
		}
		if (conn2.interests !== null) {
			if (typeof msg.action === 'undefined') {
				// console.log("SKIPPING someone interested in stuff, but got no stuff for them!")
				continue;
			}
			if (conn2.interests.indexOf(msg.action) == -1) {
				// console.log("SKIPPING someone not interested in: ", msg.action)
				continue;
			}
		}
		// console.log("SENDING: ", msg)
		conn2.write(JSON.stringify([ channelName, "m", msg ]))
	}
};

var broadcastHandler = {
	onData : function(conn, channelName, data) {
		console.log("onData: ", data);
		var op = data.shift();
		if (op == 's') {
			// console.log("subscribe")
			// set 'sender' role and empty interests to prevent
			// receiving messages right from the start
			conn.role = 'sender';
			conn.interests = [];
			var channel = subscribeChannel(conn, channelName);
			if (typeof conn.clientSubscribedChannels == 'undefined') {
				conn.clientSubscribedChannels = [ channel ];
			} else {
				conn.clientSubscribedChannels.push(channel);
			}
			conn.write(JSON.stringify([ channelName, "s" ]))
		} else if (op == 'u') {
			// console.log("unsubscribe")
			unsubscribeChannel(conn, channel);
			conn.write(JSON.stringify([ channelName, "u" ]));
		} else if (op == 'us') {
			var role = data.shift();
			conn.role = role;
			var interests = data.shift();
			conn.interests = interests;
			// console.log("update: ", role, interests)
		} else if (op == 'm') {
			var msg = data.shift();
			// console.log("message: ", msg)
			broadcastToChannel(channelName, msg);
		} else {
			console.log("INVALID OP: ", op);
		}
	},
	onClose : function(conn) {
		var channels = conn.clientSubscribedChannels || [];
		for ( var i = channels.length; i >= 0; i--) {
			var channel = channels[i];
			unsubscribeChannel(conn, channel);
		}
		channels = [];
	}
};

var channelHandlers = {
	"broadcast" : broadcastHandler,
	"actionAware" : broadcastHandler
};

var customersData = {
	"myKey" : {
		"mouselive" : "broadcast",
		"batataChannel" : "broadcast",
		"teteChannel" : "actionAware",
		"interestsChannel" : "broadcast"
	}
}

var getChannelHandler = function(customerData, channelName) {
	var handlerId = customerData[channelName];
	if (typeof handlerId == 'undefined') {
		console.log("Failed loading channel handler for channel ", channelName,
				"(customerData is ", customerData, ")");
		return null;
	}
	return channelHandlers[handlerId] || null;
}

// Reference:
// https://github.com/sockjs/sockjs-node/blob/master/examples/test_server/sockjs_app.js
var sockjs = require('sockjs');
var sockjs_opts = {
	sockjs_url : "http://cdn.sockjs.org/sockjs-0.2.min.js"
};
var channelServer = sockjs.createServer(sockjs_opts);
channelServer.on('connection', function(conn) {
	var customerData = null;
	var handler = null;
	conn.on('data', function(data) {
		data = JSON.parse(data);
		if (customerData == null) {
			var appKey = data.shift();
			customerData = customersData[appKey] || null;
			if (customerData == null) {
				console.log("appKey not found: ", appKey);
			}
			return;
		}
		var channelName = data.shift();
		if (handler == null) {
			handler = getChannelHandler(customerData, channelName);
			if (handler == null) {
				console.log("CHANNEL NOT FOUND: ", channelName);
			}
		}
		if (handler != null) {
			handler.onData(conn, channelName, data);
		}
	});
	conn.on('close', function() {
		if (handler != null) {
			handler.onClose(conn);
		}
	});
});
channelServer.installHandlers(app, {
	prefix : '/sockjs'
});

app.listen(8080);

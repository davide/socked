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

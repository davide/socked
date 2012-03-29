module('Channel',{
	setup: function (){
		//TODO: testChannel should be initialized at each test

	},
	tearDown: function(){

	}
});

test('Subscribe "work" interest on "myChannel" channel with role receiver', function(){
		expect(4);

	    var mockConn = {

			/*there's no way to test connection without a subscription. Is this an hint for refactor?*/
			connectToChannel: function(name){
				equal('myChannel', name, 'it should connect to channel "myChannel"');
			},

			updateChannelSubscription: function(name, channelRole, channelInterests){
				equal('receiver', channelRole, 'it should subscribe with "receiver" role');
				equal(1, channelInterests.length, 'it should register "1" interest');
				ok(channelInterests.indexOf('work') != -1, 'it should register "work" interest');
			}
		};

		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		
		testChannel.subscribe({role:'receiver', interests:['work']});
	});

test('Send message with role "receiver"', function(){
		expect(2);

		var wasSent = false;
		var wasReceived = false;

		var mockConn = {
			connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){},
			sendToChannel: function(name, message){
				wasSent = true;
			}

		};

		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		var channelRef = testChannel.subscribe({role:'receiver', interests:['work']});
		
		channelRef.send('yada yada');

		equal(false, wasSent, 'It should not send message through the connection');

		channelRef.onMessage(function(message){
			wasReceived = true;
		});
		testChannel.onMessage('yada yada');

		equal(true, wasReceived, 'It should receive messages through the connection');
});


test('Send message with role "sender"', function(){
		expect(2);

		var wasSent = false;
		var wasReceived = false;

		var mockConn = {
			connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){},
			sendToChannel: function(name, message){
				wasSent = true;
			}

		};

		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		var channelRef = testChannel.subscribe({role:'sender', interests:['work']});

		channelRef.send('yada yada');

		equal(true, wasSent, 'It should send the message through the connection');

		channelRef.onMessage(function(message){
			wasReceived = true;
		});
		testChannel.onMessage('yada yada');

		equal(false, wasReceived, 'It should not receive the message through the connection');
});


test('Send message with role "both"', function(){
		expect(2);

		var wasSent = false;
		var wasReceived = false;

		var mockConn = {
			connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){},
			sendToChannel: function(name, message){
				wasSent = true;
			}

		};

		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		var channelRef = testChannel.subscribe({role:'both', interests:['work']});

		channelRef.send('yada yada');

		equal(true, wasSent, 'It should send the message through the connection');

		channelRef.onMessage(function(message){
			wasReceived = true;
		});
		testChannel.onMessage('yada yada');

		equal(true, wasReceived, 'It should receive the message through the connection');
});

test('Subscribe channel "myChannel" with no role nor interests', function(){
		expect(2);

	    var mockConn = {
	    	connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){}
		};
		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		
		testChannel.subscribe();
		var role = testChannel.inspectChannelRole();
		var interests = testChannel.inspectChannelInterests();
		equal(role, 'receiver', 'It should have role = \'receiver\'');
		equal(interests, null, 'It should have interests = null');
	});

test('Subscribe channel "myChannel" with role "receiver"; then role "sender"; then unsubscribe sender client', function(){
		expect(3);

	    var mockConn = {
	    	connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){}
		};
		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		
		testChannel.subscribe({role:'receiver'});
		var role = testChannel.inspectChannelRole();
		equal(role, 'receiver', 'It should have role = \'receiver\'');

		var senderRef = testChannel.subscribe({role:'sender'});
		role = testChannel.inspectChannelRole();
		equal(role, 'both', 'Then it should have role = \'both\'');

		senderRef.unsubscribe();
		role = testChannel.inspectChannelRole();
		equal(role, 'receiver', 'Then it should have role = \'receiver\'');
	});

test('Subscribe channel "myChannel" with role "both" and interest "work", then interest "personal", then interest null', function(){
		expect(3);

	    var mockConn = {
	    	connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){}
		};
		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		
		testChannel.subscribe({role:'both', interests:['work']});
		var interests = testChannel.inspectChannelInterests();
		ok(interests.indexOf('work') != -1, 'It should have channelInterests = [\'work\']');

		testChannel.subscribe({role:'both', interests:['personal']});
		interests = testChannel.inspectChannelInterests();
		ok(interests.indexOf('work') != -1 && interests.indexOf('personal') != -1, 'Then it should have channelInterests = [\'work\', \'personal\']');

		testChannel.subscribe({role:'both'}); // Same as interests:null
		interests = testChannel.inspectChannelInterests();
		equal(interests, null, 'Then it should have channelInterests = null');
	});

test('Subscribe channel "myChannel" with role "both" and interest "personal", then interest null, then unsubscribe the last client', function(){
		expect(3);

	    var mockConn = {
	    	connectToChannel: function(name){},
			updateChannelSubscription: function(name, channelRole, channelInterests){}
		};
		var testChannel = new Socked.Channel({name:'myChannel'}, mockConn);
		
		testChannel.subscribe({role:'both', interests:['personal']});
		var interests = testChannel.inspectChannelInterests();
		ok(interests.indexOf('personal') != -1, 'It should have channelInterests = [\'personal\']');

		var allChannelRef = testChannel.subscribe({role:'both'});
		interests = testChannel.inspectChannelInterests();
		equal(interests, null, 'Then it should have channelInterests = null');

		allChannelRef.unsubscribe();
		interests = testChannel.inspectChannelInterests();
		ok(interests.indexOf('personal') != -1, 'Then it should have channelInterests = [\'personal\']');
	});

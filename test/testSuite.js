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
		expect(1);

		var wasSent = false;

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
});
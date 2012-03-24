module('Channel',{
	setup: function (){
		
		
	},
	tearDown: function(){

	}
});

test('Subscribe "work" interest on "myConnection" channel', function(){
		expect(4);

	    mockConn = {

	    	/*there's no way to test connection without a subscription. Is this an hint for refactor?*/
			connectToChannel: function(name){
				equal('myConnection', name, 'it should connect to channel "myConnection"');
			},

			updateChannelSubscription: function(name, channelRole, channelInterests){
				equal('receiver', channelRole, 'it should subscribe with "receiver" role');
				equal(1, channelInterests.length, 'it should register "1" interest');
				ok(channelInterests.indexOf('work') != -1, 'it should register "work" interest');
			}
		};

		testChannel = new Socked.Channel({name:'myConnection'}, mockConn);
		testChannel.subscribe({role:'receiver', interests:['work']});
	});
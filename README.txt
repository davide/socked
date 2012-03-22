/***************************************************************
* Socked
***************************************************************/

Socked is a persistent connection library for the web that
gives you 'Connections' and 'Channels' to use as abstractions
while creating your apps.

To reduce traffic to an absolute minimum in channel subscriptions
it is also possible to set the client's role (sender|receiver|both)
and provide an array of 'interests' that should be used by a Socked
compatible server to filter the channel messages.

The communication mechanism is/will be pluggable. At this point
Socked uses the SockJS library (which includes cross-domain support).

/***************************************************************
* Development Dependencies
***************************************************************/

== Linux
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs

== Windows
# Install node.js and package manager
# http://nodejs.org/#download

== Install smoosh globally
npm install smoosh -g

/***************************************************************
* BUILD
***************************************************************/

== Linux
# This command will monitor your changes and
# smoosh (jslint/package/mnify) the files:
./sockit.sh

== Windows
smoosh ./config.json

The build output will be located under the dist folder.

/***************************************************************
* Examples
***************************************************************/

Browse the example pages here: http://davide.github.com/socked/
All that code live on the gh-pages branch.



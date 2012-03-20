
/***************************************************************
* Install nodejs
***************************************************************/
== Linux
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs

== Windows
# Install node.js and package manager
# http://nodejs.org/#download

/***************************************************************
* Install Dependencies
***************************************************************/
== Install sockjs and express.js

# https://github.com/sockjs/sockjs-node
npm install sockjs

# http://expressjs.com/guide.html
npm install express

== Install smoosh globally
npm install smoosh -g

/***************************************************************
* BUILD
***************************************************************/

== Linux
# This command will monitor your changes and
# smoosh (jslint/package/mnify) the files:
./socked.sh

== Windows
smoosh ./config.json

/***************************************************************
* SEE IT IN ACTION
***************************************************************/
== Startup server
./server.sh

# Open http://localhost:8080/ to check if everything is working.
# The output is normally printed to the the dev console.

# Connection + messages:
  - http://localhost:8080/index.html
# Filtering messages (a.k.a. interests):
  - http://localhost:8080/interests.html
# Mouse tracking:
  - http://localhost:8080/mouselive/sender.html
  - http://localhost:8080/mouselive/receiver.html


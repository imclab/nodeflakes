var https = require('https');

var socket = null;

var StreamConsumer = function(username, password) {
    var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
    var options = {
        host: 'stream.twitter.com',
        port: 443,
        path: '/1/statuses/filter.json?track=merry%20christmas,happy%20christmas,father%20christmas,christmas%20presents,merry%20xmas,love%20christmas',
        headers: {
            authorization: auth
        }
    };
        
    var strpos = -1;
    var tweet = '';

    this.start = function() {
        var that = this;
        console.log("connecting to "+options.host+"...");
        https.get(options, function(res) {
            if (res.statusCode != 200) {
                console.log("got non OK response code: "+res.statusCode);
                return;
            }

            var lastChunk = new Date();
            var thisChunk = null;

            console.log("connected!");

            res.setEncoding("utf8");
            res.on('data', function(chunk) {
                tweet += chunk;
                strpos = tweet.indexOf("\r");

                if (strpos !== -1) {
                    var data = tweet.substr(0, strpos);
                    if (data.length > 1) {
                        // temporary rather crude throughput stuff
                        thisChunk = new Date();
                        var chunkTime = (thisChunk.getTime() - lastChunk.getTime()) / 1000;
                        var chunkLength = data.length / 1024;
                        var throughput = Math.round(chunkLength / chunkTime);
                        lastChunk = thisChunk;
                        console.log("sending message ("+throughput+" k/sec)");

                        // bung the completed tweet on the queue
                        socket.send(data);
                    } else {
                        console.log("ignoring heartbeat "+data.length);
                    }

                    // make sure we don't lose the remainder
                    tweet = tweet.substr(strpos+1);
                }
            });
            res.on('end', function() {
                console.log('end of response');
                console.log("last chunk: "+tweet);
            });
        });
    }

    this.setSocket = function(_socket) {
        socket = _socket;
    }
}

module.exports = StreamConsumer;

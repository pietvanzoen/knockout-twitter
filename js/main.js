
function formatText(text) {
    var link = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var user = /@(\w+)/ig;
    var hashTags = /#(\w+)/ig;
    var desc = "";
    if(link) {
        desc = text.replace(link,'<a href="$1" target="_blank">$1</a>');
    }
    if(user) {
        desc = desc.replace(user,'<a href="https://twitter.com/$1" target="_blank">@$1</a>');
    }
    if(hashTags) {
        desc = desc.replace(hashTags,'<a href="https://twitter.com/search?q=%23$1" target="_blank">#$1</a>');
    }
    return desc;
}

function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

// Class to represent a row in the seat reservations grid
function Tweet(data) {
    var self = this;
    self.data = data;

    self.tweet_url = 'https://twitter.com/'+data.user.screen_name+'/status/'+data.id_str;

    self.time_since = ko.computed(function(){
        var date = new Date(data.created_at)
        return timeSince(date.getTime());
    }, self);

    self.user_url = 'https://twitter.com/'+data.user.screen_name;

    self.formattedText = formatText(data.text);

    self.formattedScreenName = formatText('@'+data.user.screen_name);

    self.media_url = '';
    if (data.entities.media && data.entities.media[0].type === "photo") {
        self.media_url = data.entities.media[0].media_url;
    }
}

function Column(tweets){
    var self = this;
    self.col = tweets;
}


function KoTwitter() {

        // Data
        var self = this;
        self.numcols = ko.observable(3);
        self.tweets = ko.observableArray();
        self.tweetsLength = ko.observable();
        self.query = ko.observable("weather");
        self.columns = ko.observableArray();
        self.colClass = ko.computed(function(){
            return 'col-sm-'+(12/self.numcols());
        }, self);

        self.updateFeed = function() {
            self.tweets().length = 0;
            self.columns().length = 0;
            // var statuses = sampleData;
            var queryString = "q="+encodeURIComponent(self.query())+"&amp;geocode=45.52000,-122.68194,10mi";
            cb.__call(
                "search_tweets",
                queryString,
                function (reply) {
                    var statuses = reply.statuses;
                    for (var i = statuses.length - 1; i >= 0; i--) {
                        self.tweets.push(new Tweet(statuses[i]));
                    }
                    for (var j = self.numcols() - 1; j >= 0; j--) {
                        var offset = self.tweets().length/self.numcols();
                        var begin = j*offset;
                        var end = begin+offset;
                        self.columns.push(new Column(self.tweets.slice(begin, end)));
                    }
                },
                true // this parameter required
            );

        };
        self.updateFeed();

}

ko.applyBindings(new KoTwitter());
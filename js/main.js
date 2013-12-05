
// Format tweet text with links
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

// Calculate time since tweet
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

// Class to represent a tweet
function Tweet(data) {
    var self = this;
    self.data = data;

    self.tweet_url = 'https://twitter.com/'+data.user.screen_name+'/status/'+data.id_str;

    self.time_since = ko.computed(function(){
        var date = new Date(data.created_at);
        return timeSince(date.getTime())+' ago';
    }, self);

    self.user_url = 'https://twitter.com/'+data.user.screen_name;

    self.formattedText = formatText(data.text);

    self.formattedScreenName = formatText('@'+data.user.screen_name);

    self.media_url = '';
    if (data.entities.media && data.entities.media[0].type === "photo") {
        self.media_url = data.entities.media[0].media_url;
    }
}

// Column build class
function Column(tweets){
    var self = this;
    self.col = tweets;
}

// Business time
function KoTwitter() {

        var self = this;
        self.tweets = ko.observableArray(); // main tweets array

        // Grid Variables
        self.numcols = 3; // number of columns to render
        self.columns = ko.observableArray(); // main columns array
        self.colClass = ko.computed(function(){
            // calculate grid column width
            return 'col-sm-'+(12/self.numcols);
        }, self);

        // Alert Box Variables
        self.alertText = ko.observable('');
        self.alertType = ko.observable('success');
        self.alertClass = ko.computed(function(){
            return 'alert-'+self.alertType();
        }, self);

        // Signin Form Variables
        self.authPin = ko.observable();
        self.showSignin = ko.observable(true);
        self.showPinForm = ko.observable(false);

        // Grid columns builder
        self.buildGrid = function(data) {
            var statuses = data;
            for (var i = statuses.length - 1; i >= 0; i--) {
                self.tweets.push(new Tweet(statuses[i]));
            }
            for (var j = self.numcols - 1; j >= 0; j--) {
                var offset = self.tweets().length/self.numcols;
                var begin = j*offset;
                var end = begin+offset;
                // splits tweets array into three columns
                self.columns.push(new Column(self.tweets.slice(begin, end)));

                // TODO: split tweets so they render in order.
                // e.g tweet 1 would go in column 1, tweet 2
                // would go in column 2, tweet 3 would go in
                // column3... tweet 4 would go in column 1.
                // etc etc.
            }
        };

        // Signin
        self.signIn = function() {
            self.showSignin(false);
            self.showPinForm(true);
            self.alertText('<strong>Signing In:</strong> Please authorize and copy your authorization PIN here and submit.');

            // get authorization requst token
            cb.__call(
                "oauth_requestToken",
                {oauth_callback: "oob"},
                function (reply) {
                    console.log(reply);
                    // set request token
                    cb.setToken(reply.oauth_token, reply.oauth_token_secret);

                    // get the authorize screen URL and load window
                    cb.__call(
                        "oauth_authorize",
                        {},
                        function (auth_url) {
                            window.codebird_auth = window.open(auth_url);
                        }
                    );
                }
            );
        };

        // Get authorization token
        self.authorize = function() {
            self.showPinForm(false);
            self.alertText('<strong>Processing</strong>: Autorizing app...');
            cb.__call(
                "oauth_accessToken",
                {oauth_verifier: self.authPin()},
                function (reply) {
                    // TODO: authorization error fallback

                    // set authorization token
                    cb.setToken(reply.oauth_token, reply.oauth_token_secret);

                    // update alert
                    self.alertText('<strong>Success!</strong>: Loading tweets...');

                    // load tweets
                    self.loadHomeTimeline();
                }
            );
        };


        // Load user home timeline
        self.loadHomeTimeline = function() {

            // reset columns and tweets
            self.tweets().length = 0;
            self.columns().length = 0;

            cb.__call(
                "statuses_homeTimeline",
                {},
                function (reply) {
                    self.alertText('');

                    // build grid
                    self.buildGrid(reply);
                }
            );

        };

}

ko.applyBindings(new KoTwitter());
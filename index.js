var express = require('express');
var app = express();
var http = require('http').Server(app);
var request = require('request');
var async = require('async');

var apis = {
    switchduino: 'http://localhost:9291',
    serialrgb: 'http://localhost:9191'
};

var switches = {
    monitor: 'c',
    led: 'b',
    speaker: 'a'
};

app.set('view engine', 'jade');

app.get('/', function(req, res) {
    res.render('index');
});

app.post('/all', function(req, res) {
    var order = ['monitor', 'speaker', 'led'];

    // fade LEDs out
    request.post(apis.serialrgb + '/fadeout/1500');

    async.eachSeries(order, function(sw, cb) {
        request.post(apis.switchduino + '/switch/' + switches[sw], function(err, apiRes, body) {
            cb(err);
        });
    });
});

app.post('/goodnight', function(req, res) {
    // turn off monitors instantly
    request.post(apis.switchduino + '/switch/' + switches.monitor);

    // fade LEDs out slowly after 10 sec
    setTimeout(function() {
        request.post(apis.serialrgb + '/fadeout/20000', function() {
            console.log('fadeout done');
        });
    }, 10 * 1000);

    // turn everything off after 30 sec
    setTimeout(function() {
        var order = ['monitor', 'speaker', 'led'];

        async.eachSeries(order, function(sw, cb) {
            request.post(apis.switchduino + '/switch/' + switches[sw], function(err, apiRes, body) {
                cb(err);
            });
        });
    }, 30 * 1000);
});

app.post('/switch/:id', function(req, res) {
    var delay = 0;
    var sw = req.params.id;

    if (sw.toLowerCase() === switches.led) {
        if (sw === sw.toUpperCase()) {
            // LEDs turned on, fade them in after a short delay
            setTimeout(function() {
                request.post(apis.serialrgb + '/fadein/3000');
            }, 500);
        } else {
            // LEDs turned off, fade them out
            request.post(apis.serialrgb + '/fadeout/3000');
            delay = 3000;
        }
    }

    setTimeout(function() {
        request.post(apis.switchduino + '/switch/' + sw, function(err, apiRes, body) {
            res.json(body);
        });
    }, delay);
});

app.use(express.static(__dirname + '/bower_components'));

http.listen(9292, function() {
    console.log('listening on 9292');
});

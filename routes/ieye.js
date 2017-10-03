var express = require('express');
var router = express.Router();
var path = require('path');
require('map.prototype.tojson');
var dp = require('../dataprocessing.js');

var sessionData = new Map();
var historyData = new Map();

var ACCESSKEY = 'wiseye';
var CHECKTIME = 300000;
var DAY_IN_MS = 86400000; // a day in miliseconds, for clearing history
var CHECK_PROGRESS = 0; // counts how many ms has gone by

// checks if session is active
// if not, store
setInterval(function() {
    if (CHECK_PROGRESS >= DAY_IN_MS) {
        historyData.clear();
        CHECK_PROGRESS = 0;
    }

    sessionData.forEach((session, sessionID) => {
        // update history map
        if (!historyData.has(sessionID)) {
            historyData.set(sessionID, session);
        }

        var now = new Date();
        var then = new Date(session.lastBeat);
        if ((now - then) > CHECKTIME) {
            // store and delete session data
            console.log('no heartbeat sensed - saving');
            dp.writeFile('ieye', sessionID, session.userID, sessionData.get(sessionID));
            sessionData.delete(sessionID);
        } 
    });

    CHECK_PROGRESS += CHECKTIME;
}, CHECKTIME);

/**
 * Middleware checks for valid user
 * @param {*} req request
 * @param {*} res response
 * @param {*} next next function
 */
function checkUser(req, res, next) {
    if (req.cookies.key === ACCESSKEY) {
        next();
    } else {
        res.redirect('/ieye/sessionsgate');
    }
}


router.get('/', function(req, res) {
    res.send('');
});

router.post('/heartbeat', function(req, res) {
    var userID = req.body.userID;
    var sessionID = req.body.sessionID;
    if (!sessionData.has(sessionID)) {
        res.end();
        return;
    }
    sessionData.get(sessionID).lastBeat = (new Date());

    res.end();
});

router.post('/check', function(req, res) {
    var key = req.body.key;
    if (key === ACCESSKEY) {
        res.cookie('key', key, {maxAge: 3600000});
        res.send('valid');
    } else {
        res.send('invalid');
    }
});

router.get('/sessionsgate', function(req, res) {
    res.render('check', {});
});

router.get('/sessions', checkUser, function(req, res) {
    res.render('analytics', {historyData: historyData.toJSON(), sessionData: sessionData.toJSON()});
});

router.post('/user', function(req, res) {
    var log = req.body.data;
    var userID = log.userID;
    var sessionID = log.sessionID;

    // set up user data
    sessionData.set(sessionID, log);
    sessionData.get(sessionID).userID = userID;
    sessionData.get(sessionID).environment.windowResizes = [];
    sessionData.get(sessionID).video = [];
    sessionData.get(sessionID).widget = [];
    sessionData.get(sessionID).lastBeat = (new Date());
    sessionData.get(sessionID).exception = [];
    sessionData.get(sessionID).pausedCountUser = 0;
    sessionData.get(sessionID).pausedCountWidget = 0;    
    sessionData.get(sessionID).alerts = [];    
    sessionData.get(sessionID).metrics = [];    

    dp.createUserFile('ieye', userID);

    res.end();
});

router.post('/data/:type', function(req, res) {
    var type = req.params.type;
    var data = req.body.data;
    var sessionID = req.body.sessionID;
    var user = sessionData.get(sessionID);

    switch (type) {
        case 'environment': // array of window resizes
            user.environment.windowResizes = user.environment.windowResizes.concat(data);
            break;
        case 'video': // array of video statusses
            user.video = user.video.concat(data);
            break;
        case 'prediction': // single prediction object
            user.prediction.push(data);
            break;
        case 'widget': // single widget status object
            user.widget.push(data);
            // if paused
            if (data['eventTypeID'] == '4') {
                // if paused by widget:
                if (data['isIEyeEvent'] == '1') {
                    user.pausedCountWidget += 1;
                } else {
                    // if paused by user
                    user.pausedCountUser += 1;
                }
            }            
            break;
        case 'exception':
            user.exception.push(data);
            break;
        case 'metrics':
            user.metrics.push(data);
            break;
        case 'alert':
            user.alerts.push(data);
            break;
        case 'feedback':
            dp.writeFeedback(data);
            break;
        default: // none
    }

    console.log(data);
    res.end();
});

// =============================================================================
// TESTING SPACE
// =============================================================================
/**
 * @return {*} 
 */
function getMocks() {
    var mock = new Map();
    var now = new Date();
    for (var i = 0; i < 5; i++) {
        var log = {
            'userID': 'user'+i,
            'sessionID': '1111.2222.AAAA.BBBB||'+i,
            'environment': {
                'browser': 'Chrome',
                'browserVersion': '11',
                'mobile': false,                
            },
            'sessionStartTime': (new Date(now.setHours(now.getHours() + (Math.random() * 2) ))).toISOString(),
        };
        var userID = log.userID;
        var sessionID = log.sessionID;

        // set up user data
        mock.set(sessionID, log);
        mock.get(sessionID).userID = userID;    
    }

        var logA = {
            'userID': 'user'+i,
            'sessionID': '1111.2222.AAAA.BBBB||bannedA',
            'banned': true,
            'environment': {
                'browser': 'Chrome',
                'browserVersion': '11',
                'mobile': true,                
            },
            'sessionStartTime': (new Date(now.setHours(now.getHours() + (Math.random() * 2) ))).toISOString(),
        };
        var userID = logA.userID;
        var sessionID = logA.sessionID;

        // set up user data
        mock.set(sessionID, logA);
        mock.get(sessionID).userID = userID;

        var logB = {
            'userID': 'user'+i,
            'sessionID': '1111.2222.AAAA.BBBB||bannedB',
            'banned': true,
            'environment': {
                'browser': 'Safari',
                'browserVersion': '11',
                'mobile': false,                
            },
            'sessionStartTime': (new Date(now.setHours(now.getHours() + (Math.random() * 2) ))).toISOString(),
        };
        var userID = logB.userID;
        var sessionID = logB.sessionID;

        // set up user data
        mock.set(sessionID, logB);
        mock.get(sessionID).userID = userID;           
    
    return mock;
}

router.get('/testsession', function(req, res) {
    var mocks = getMocks();

    res.render('analytics', {historyData: mocks.toJSON(), sessionData: mocks.toJSON()});
});

module.exports = router;

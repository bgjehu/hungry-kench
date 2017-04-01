const Promise = require('bluebird');
const {Router} = require('express');
const {readFileSync, writeFileSync} = require('fs');
const {filter, indexOf, isEmpty, head, map, sortBy} = require('lodash');
const request = require('request-promise');

const who = 'who.tmp';
const when = 'when.tmp';
const token = process.env.SLACK_API_TOKEN;

const getListOfMembers = () => request({
    url: 'https://slack.com/api/users.list',
    qs: {token},
    json: true
}).then((res) => {
    const {members} = res;
    return Promise.resolve(sortBy(filter(map(members, 'real_name'), (m) => m !== 'slackbot')));
});

const whoseDay = (members) => {
    const last = whoNow();
    const {length} = members;
    if (isEmpty(last)) {
        return head(members);
    } else {
        const idx = indexOf(members, last) + 1;
        return members[idx >= length ? idx % length : idx];
    }
};

const whenNow = (time) => isEmpty(time) ? readFileSync(when, 'utf8') : writeFileSync(when, time);
const whoNow = (name) => isEmpty(name) ? readFileSync(who, 'utf8') : writeFileSync(who, name);
const messageObj = (msg, color) => {
    const colors = {
        yellow: '#ffd900',
        green: '#01ff00',
        red: '#ff0100'
    };
    return {
        attachments: [{
            text: msg,
            color: colors[color] || colors.green
        }]
    }
};
const announcement = (name) => messageObj(`${name} gets to choose lunch place today!`, 'green');

const sameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

const router = Router();
router.post('/lunch', (req, res) => {
    const date = new Date(parseInt(whenNow()));
    const now = new Date();
    if (!sameDay(date, now)) {
        getListOfMembers().then((members) => {
            const theOne = whoseDay(members);
            whoNow(theOne);
            whenNow(now.getTime() + '');
            res.send(announcement(theOne));
        }).catch(() => {
            res.send(messageObj("Dude, I can't help you right now!", 'red'));
        });
    } else {
        res.send(messageObj("/lunch is exec'ed today! Enter /today to find out whose day is it!", 'red'));
    }
});

router.post('/today', (req, res) => {
    const theOne = whoNow();
    if (!isEmpty(theOne)) {
        res.send(announcement(theOne));
    } else {
        res.send(messageObj('Enter /lunch to init!', 'yellow'));
    }
});

router.post('/reset', (req, res) => {
    writeFileSync(when, '');
    writeFileSync(who, '');
    res.send(messageObj('Done!', 'green'));
});

module.exports = router;



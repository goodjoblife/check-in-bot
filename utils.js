
const get = require('lodash/get');

function getLocation(context) {
    const attachments = get(context, 'event.attachments');
    if (attachments) {
        for (let i = 0; i < attachments.length; i = i + 1) {
            const type = get(attachments, `[${i}].type`);
            if (type === 'location') {
                const coordinates = get(attachments, `[${i}].payload.coordinates`);
                if (coordinates) {
                    return coordinates;
                }
            }
        }
    }
    return null;
}

function getTimeStamp(context) {
    return get(context, 'event._rawEvent.timestamp');
}

function getImageUrl(context) {
    const attachments = get(context, 'event.attachments');
    if (attachments) {
        for (let i = 0; i < attachments.length; i = i + 1) {
            const type = get(attachments, `[${i}].type`);
            if (type === 'image') {
                const url = get(attachments, `[${i}].payload.url`);
                if (url) {
                    return url;
                }
            }
        }
    }
    return null;
}

function calcTime(ms) {
    let secs = Math.round(ms / 1000);
    let mins = Math.floor(secs / 60);
    secs = secs % 60;
    let hrs = Math.floor(mins / 60);
    mins = mins % 60;
    return { hrs, mins, secs };
}

function formatTime(timeObj) {
    let str = '';
    if (hrs === 0 && mins === 0) {
        return '不到一分鐘';
    }
    if (hrs > 0) {
        str = `${hrs}小時`;
    }
    if (mins > 0) {
        str = `${str} ${mins}分鐘`;
    }
    return str;
}

module.exports = {
    getLocation,
    getTimeStamp,
    getImageUrl,
    calcTime,
    formatTime,
}

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


module.exports = {
    getLocation,
    getTimeStamp,
    getImageUrl,
}
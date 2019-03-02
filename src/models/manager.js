'use strict';

const Meeting = require('./meeting');
const _ = require('lodash');
const config = require('../config');
const Channel = require('./channel');

class manager {

    /**
     * @constructor
     * @param  {Object} controller
     */
    constructor(controller) {
        this.meetings = {};
        this.controller = controller;
        this.bindEvents_();
    }


    /**
     * meetingExist - Check if a meeting is ongoing.
     *
     * @param  {String} channelId
     * @return {boolean}
     */
    meetingExist(channelId) {
        return this.meetings[channelId];
    }


    /**
     * create - Creates a meeting.
     *
     * @param  {String} channelId
     * @return {Meeting}
     */
    create(channelId) {
        let meeting = new Meeting(channelId);
        this.meetings[channelId] = meeting;
        return meeting;
    }


    /**
     * destroy - Destroys an existing meeting.
     *
     * @param  {String} channelId
     */
    destroy(channelId) {
        delete this.meetings[channelId];
    }

    /**
     * @private
     *
     * bindEvents_ - Bind interval events.
     */
    bindEvents_() {
        let that = this;

        this.controller
            .hears(['start meeting'], 'ambient', (bot, message) => {
                let channelId = message.channel;

                /**
                 * TODO: After storage implementation get rid of this.
                 */
                let meeting = that.meetingExist(channelId);
                if (meeting && !meeting.isActive)
                    that.destroy(channelId);

                if (meeting)
                    return bot.reply(message,
                        'Sorry, there is an existing meeting in this channel');

                meeting = that.create(channelId);
                let channel = new Channel(that.controller);
                channel
                    .getMembers(channelId)
                    .then((members) => {
                        meeting.setMembers(members);
                        channel
                            .getChannelInfo(channelId)
                            .then((info) => {
                                meeting.setName(info.name);
                                return meeting.start(bot, message);
                            }).then(() => {
                                that.destroy(channelId);
                            });
                    })
                    .catch((err) => {
                        console.error('Error', err);
                    });
            });

        this.controller
            .hears(['status'], 'direct_mention', (bot, message) => {
                bot.reply(message, 'Active meetings are ' +
                    JSON.stringify(that.meetings));
            });

        this.controller
            .hears(['help'], 'direct_mention', (bot, message) => {
                bot.reply(message, "Commands\n \
                    `start meeting`\n \
                    *Starts meeting. To be able to start meeting with \
                    this command your bot should be invited to the channel.\n \
                    `skip`\n \
                    *Skips the current user's turn. Asks/Returns to the skipped \
                    users again at the end of the meeting. Can be skipped more than once.\n \
                    `dismiss`\n \
                    Dismisses the current user, in other words kicks the current user \
                    out of the meeting. Useful in case of an absence.\n \
                    `quit`\n \
                    Ends the meeting. Meeting can be restarted by typing start meeting again.");
            });

        this.controller
            .hears(['skip', 'dismiss'], 'ambient', (bot, message) => {
                let meeting = that.meetings[message.channel];

                if (!meeting) return;

                meeting.emit(message.text);
            });

        this.controller
            .hears(['quit'], 'ambient', (bot, message) => {
                let meeting = that.meetings[message.channel];

                if (!meeting) return;

                meeting.emit(message.text);
                that.destroy(message.channel);
            });

    }
}


module.exports = manager;

'use strict';

const _ = require('lodash');
const MailerModel = require('./mailer');
const config = require('../config');
const async = require('async');
const EventEmitter = require('events').EventEmitter;


class meeting extends EventEmitter {

    /**
     * @constructor
     *
     * @param  {String} channelId
     */
    constructor(channelId) {
        super();
        this.channelId = channelId;
        this.channelName = '';
        this.answers = [];
        this.isActive = true;
    }

    setMembers(members) {
        this.participants = members;
    }

    setName(name) {
        this.channelName = name;
    }

    finish(){
        this.isActive = false;
    }

    /**
     * start - Starts a conversation
     *
     * @param  {Object} bot
     * @param  {String} message
     * @return {Promise}
     */
    start(bot, message) {
        this.questions = config.get('questions:' + this.channelName) || config.get('questions:default');
        let that = this;
        let participantCount = 0;

        return new Promise((resolve, reject) => {
            async.whilst(() => {
                return participantCount < that.participants.length
            },
            (cb) => {
                let participant = that.participants[participantCount];
                message.user = participant.id;

                if(!that.isActive)
                    return;

                bot.startConversation(message, (err, convo) => {
                    convo.say('Hello @' + participant.name +
                        ', it is your turn now.');

                    let skipParticipant = () => {
                        that.participants.push(participant);
                        convo.stop();
                    };

                    let dismissParticipant = () => {
                        convo.stop();
                    };

                    let quitConversation = () => {
                        bot.say({
                            text: 'Meeting is over',
                            channel: that.channelId
                        });
                        that.finish();
                        convo.stop();
                    };

                    that.once('skip', skipParticipant)
                        .once('dismiss', dismissParticipant)
                        .once('quit', quitConversation);

                    let userAnswers = [];

                    _.forEach(that.questions, (question, index) => {
                        convo.ask(that.questions[index], (msg, convo) => {
                            switch (msg.text) {
                                case 'skip':
                                    that.emit('skip'); break;
                                case 'dismiss':
                                    that.emit('dismiss'); break;
                                case 'quit':
                                    that.emit('quit'); break;
                            }

                            userAnswers.push({
                                question: question,
                                answer: msg.text,
                                createdAt: Date.now()
                            });

                            convo.next();
                        });
                    });

                    convo.say('Thank you @' + participant.name);

                    convo.on('end', (convo) => {
                        if (convo.status != 'stopped')
                            that.answers.push({
                                participant: participant,
                                answer: userAnswers
                            });

                        that.removeListener('skip', skipParticipant)
                            .removeListener('dismiss', dismissParticipant)
                            .removeListener('quit', quitConversation);

                        participantCount++;
                        cb();
                    });
                });
            }, (err) => {
                if(err) return reject(err);
                let emails_list = "";
                bot.startConversation(message, (err, convo) => {
                    convo.say("Meeting has ended.");
                    convo.ask("Who would you like to send these results to? " +
                        "(you can write multiple emails separated with a comma ',')", (msg, convo) => {
                        emails_list = msg["text"];
                        let mailContent = MailerModel.mailify(that.answers, this.channelName);
                        console.log("emails_list" + emails_list);
                        let mailSender = new MailerModel(mailContent, emails_list);
                        mailSender.send();
                        resolve();
                        bot.say({
                            text: 'Results are mailed to ' + emails_list,
                            channel: that.channelId
                        });
                    });
                });
            });
        });
    }
};


module.exports = meeting;

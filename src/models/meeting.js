"use strict";

const _ = require("lodash");
const MailerModel = require("./mailer");
const config = require("../config");
const async = require("async");
const EventEmitter = require("events").EventEmitter;

const TESTING_CHANNEL = "GPK6W53TL"; // # berkeley-cs169 #course-staff-testing
const STAFF_IDS = ["UMLKL2DC0", "UGLUX4ALQ", "UGZHDSF6E", "ULWLD2GG7"];
const MEETING_RESULTS_CHANNEL = "GQ0RRR1K3";

class meeting extends EventEmitter {
  /**
   * @constructor
   *
   * @param  {String} channelId
   */
  constructor(channelId) {
    super();
    this.channelId = channelId;
    this.channelName = "";
    this.answers = [];
    this.skippedMembers = [];
    this.participants = [];
    this.isActive = true;
  }

  setMembers(members) {
    this.filterStaffRoles(members);
  }

  setName(name) {
    this.channelName = name;
  }

  finish() {
    this.isActive = false;
  }

  /**
   *  filters members who should not be pinged.
   *  TODO: Needs configuration.
   */
  filterStaffRoles(members) {
    if (this.channelId === TESTING_CHANNEL) {
      this.participants = members;
      return;
    }

    this.skippedMembers = _.filter(members, user => meeting.userIsStaff(user));
    this.participants = _.filter(members, user => !meeting.userIsStaff(user));
  }

  /**
   * Inspect a Slack profile title to see if it is a staff member.
   * TODO is this the best? Configurable Ids?
   * @param {Object} slackMember
   */
  static userIsStaff(slackMember) {
    return STAFF_IDS.indexOf(slackMember.id) > -1;
  }

  skippedStaffMessage() {
    if (this.skippedMembers.length === 0) {
      return '';
    }
    return `\n(Skipping ${this.skippedMembers.length} staff members in this group.)`;
  }

  /**
   * start - Starts a conversation
   *
   * @param  {Object} bot
   * @param  {String} message
   * @return {Promise}
   */
  start(bot, message) {
    this.questions =
      config.get("questions:" + this.channelName) ||
      config.get("questions:default");
    let that = this;
    let participantCount = 0;

    bot.say({
      text: `Awesome :smile:, let\'s get started!${this.skippedStaffMessage()}`,
      channel: that.channelId
    });

    return new Promise((resolve, reject) => {
      async.whilst(
        () => {
          return participantCount < that.participants.length;
        },
        cb => {
          let participant = that.participants[participantCount];
          message.user = participant.id;

          if (!that.isActive) {
            return;
          }

          bot.startConversation(message, (err, convo) => {
            convo.say(`Hello <@${participant.id}>, it is your turn now.`);

            let dismissParticipant = () => {
              convo.stop();
            };

            let quitConversation = () => {
              bot.say({
                text: "Meeting is over",
                channel: that.channelId
              });

              let mailContent = MailerModel.mailify(
                that.answers,
                this.channelName
              );
              // TODO: Temporarily send messages to a specific channel.
              bot.say({
                text: `${MailerModel.subject(that.channelName)}\n${mailContent}`,
                channel: MEETING_RESULTS_CHANNEL
              });

              that.finish();
              convo.stop();
            };

            that
              .once("skip", () => that.skipParticipant(participant, convo))
              .once("dismiss", dismissParticipant)
              .once("quit", quitConversation);

            let userAnswers = [];

            _.forEach(that.questions, (question, index) => {
              convo.ask(that.questions[index], (msg, convo) => {
                switch (msg.text) {
                  case "skip":
                    that.emit("skip");
                    break;
                  case "dismiss":
                    that.emit("dismiss");
                    break;
                  case "quit":
                    that.emit("quit");
                    break;
                }

                userAnswers.push({
                  question: question,
                  answer: msg.text,
                  createdAt: Date.now()
                });

                convo.next();
              });
            });

            // TODO: Randomize the emoji.
            convo.say(`Thank you, ${friendlyName(participant)}. :tada:`);

            convo.on("end", convo => {
              if (convo.status != "stopped")2
                that.answers.push({
                  participant: participant,
                  answer: userAnswers
                });

              that
                .removeListener("skip", () => that.skipParticipant(participant, convo))
                .removeListener("dismiss", dismissParticipant)
                .removeListener("quit", quitConversation);

              participantCount++;
              cb();
            });
          });
        },
        err => {
          if (err) {
            return reject(err);
          }

          // Mostly usedful for debugging.
          if (that.participants.length === 0) {
            bot.say({
              text: "No available users in this group. See ya later! :wave:",
              channel: that.channelId
            });
          } else {
            bot.say({
              text: "Meeting has ended.\nThank you! :smile:",
              channel: that.channelId
            });

            let mailContent = MailerModel.mailify(
              that.answers,
              this.channelName
            );
            // TODO: Temporarily send messages to a specific channel.
            bot.say({
              text: `${MailerModel.subject(that.channelName)}\n${mailContent}`,
              channel: MEETING_RESULTS_CHANNEL
            });
            // let mailSender = new MailerModel(mailContent);
            // mailSender.send(that.channelName);
            resolve();
          }
        }
      );
    });
  }

  skipParticipant = (participant, convo) => {
    this.participants.push(participant);
    convo.stop();
  };
}

function friendlyName(user) {
  user.profile.first_name || user.name || user.real_name;
}

module.exports = meeting;

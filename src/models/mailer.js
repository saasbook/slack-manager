'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');



class mailer {
    /**
     * @constructor
     *
     * @param  {String} content
     */
    constructor(content, emails, opt_settings) {
        this.content = content;
        console.log(emails);
        this.transporter = nodemailer.createTransport(opt_settings || {
            service: config.get('mailer:service'),
            auth: {
                user: config.get('mailer:email'),
                pass: config.get('mailer:pass')
            }
        });
        var emails_split = emails.split(",");
        var i = 0;
        while (i < emails_split.length) {
            if (emails_split[i].includes("|")) {
                var inter = emails_split[i].split("|")[1];
                emails_split[i] = inter.slice(0, inter.length-1);
            }
            i++;
        }
        emails = emails_split.join();
        this.options = {
            from: config.get('mail:from'),
            to: emails,
            subject: 'About your meeting today',
            text: content || 'No body.'
        };
    }


    /**
     * send - Sends an email with pre-set settings.
     */
    send() {
        this.transporter.sendMail(this.options);
    }

    static mailify(answers, channelName){
        let mailContent = 'Hello, \nToday\'s meeting results for #'+ channelName + ' are shown below.\n';
        answers.forEach((answer) => {
            mailContent += "\n" + answer.participant.real_name + " responded:\n\n";
            answer.answer.forEach((entry, index) => {
                mailContent += entry.question + "\n" + entry.answer + "\n";
            });
        });

        return mailContent;
    }
}


module.exports = mailer;

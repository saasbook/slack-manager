# Agile Development tool for Slack.

### Note: This version has been customized for CS169 at UC Berkeley.

Basically, "**Standup meetings for Slack**"

Slack Manager allows teams to conduct lightweight "standup" style meetings via Slack. You can start a meeting by inviting your bot to your current channel and just type "start meeting".

Advantages of Slack Manager from other services:
  - Free and easy to use.
  - Configurable mail settings.
  - Configurable questions.
  - Works with multiple channels.
  - Currently, the channels *must* be private channels.

![alt text](http://new.tinygrab.com/783f33d7b18d7bcd72f1de9785bcbf86e10c3eb82a.png "Slack-Manager")

### Create your Slack bot.

  - First make a bot integration inside of your Slack channel. Go here: `https://my.slack.com/services/new/bot`
  - Enter a name for your bot. Make it something fun and friendly, but avoid a single task specific name. Bots can do lots! Let's not pigeonhole them.
  - When you click "Add Bot Integration", you are taken to a page where you can add additional details about your bot, like an avatar, as well as customize its name & description.

Copy the API token that Slack gives you. You'll need it in the next step.

### Installation & Running.

* Clone the repository by:
```
git clone https://github.com/saasbook/slack-manager
```

* Install via NPM
```
npm install
```

* Copy the environment file:
```
cp .env.sample .env
```

* Fill in `.env` with your unique values. **Do Not** put production tokens in the `.sample` file!

* Run the bot using `foreman` or any other Procfile-based too. `foreman start`.

* Alternatively, do `source .env && npm start`. You can test this locally as long as the Slack token is correct.

Mailer service uses nodemailer's transport methods. Therefore, for better understanding please read nodemailer's [available transports ](https://github.com/nodemailer/Nodemailer#available-transports).

For example for Gmail settings: change your settings file by:
```
{
    "token": "YOUR SLACK TOKEN HERE",
    "mailer": {
        "service": "Gmail",
        "email": "email@address.com",
        "pass": "mySuperFancyPassword"
    }
}
```

### Configure your questions

Open `default.json` and add a questions field shown below.

slack-manager lets users to ask different questions to different channels. If you prefer a single question list
then you will only need the default field of the questions object. If you want to ask different questions to different channels
then you will need to add additional fields to the questions object. Fields of the questions object must be the names of the
corresponding channels.

Note: If no questions that has the same name as the channel found then the default list will be asked.

```
"questions": {
    "default": [
        "What did you do yesterday?",
        "What are you going to do today?",
        "Did you encounter any problems?"
    ],
    "CHANNEL-NAME": [
        "How do you feel?"
    ],
    "ANOTHER-CHANNEL-NAME": [
        "Another question?",
        "Perhaps more?"
    ]
}
```

### Configure Staff and Rooms

**NOTE:** The repo currently contains CS169 specific data!

Set the 3 variables:
* `TESTING_CHANNEL` This exempts checking `STAFF_IDS`.
* `STAFF_IDS` This is a list of users for which the bot will always skip asking to provide a status.
* `MEETING_RESULTS_CHANNEL` This is the channel where results are sent.

## Deploy To Heroku

Use Environment Variables in place of a `config.json` file.

```
token=YOUR-SLACK-TOKEN
mailer_service=gmail # Unless you have a more complex config.
mailer_email= # A valid gmail / google apps address.
mailer_pass= # A
mail_from= # must match mailer_email
mail_to=
```

## Usage

### Commands

- ``` start meeting ```

    Starts meeting. To be able to start meeting with this command your bot should be invited to the channel.

- ``` skip ```

    Skips the current user's turn. Asks/Returns to the skipped users again at the end of the meeting. Can be skipped more than once.

- ``` dismiss ```

    Dismisses the current user, in other words kicks the current user out of the meeting. Useful in case of an absence.

- ``` quit ```

    Ends the meeting. Meeting can be restarted by typing ``` start meeting ``` again.

### Tech

Slack-Manager uses a number of open source projects to work properly:

* [Botkit](https://github.com/howdyai/botkit) - Botkit - Building Blocks for Building Bots
* [Node-mailer](https://github.com/andris9/Nodemailer) - Send e-mails with Node.JS – easy as cake! E-mail made in Estonia.
* [Lodash](https://github.com/lodash/lodash) - A JavaScript utility library delivering consistency, modularity, performance, & extras.
* [Async](https://github.com/caolan/async) - Async utilities for node and the browser.
* [Nconf](https://github.com/indexzero/nconf) - Hierarchical node.js configuration with files, environment variables, command-line arguments, and atomic object merging.

### Development

Want to contribute? Great! Feel free to submit bugs, and open pull requests.

## License

MIT

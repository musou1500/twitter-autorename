const request = require('request-promise-native');
const cheerio = require('cheerio');
const Twitter = require('twitter');
const config = require('config');

const client = new Twitter(config);

client.get('account/verify_credentials', function(err, user) {
  const userId = user.id_str;
  client.stream('statuses/filter', { follow: userId }, function(stream) {
    stream.on('data', onData);
    stream.on('error', onError);
  });
})

function onError(err) {
  console.log(JSON.strigify(err));
}

function onData(event) {
  const matches = /([^\s　]+)になりたい/.exec(event.text);
  if (event.user.screen_name == 'musou1500' && matches) {
    changeNameAndNotify(event, matches[1]);
  } else if (event.text.includes('名前') && event.text.includes('変えて')) {
    getRandomName().then(event, changeNameAndNotify);
  }
}

function changeNameAndNotify(tweet, newName) {
  const replyTargets = getReplyTargets(tweet);
  client.post('account/update_profile', { name: newName }, () => {
    client.post('statuses/update', {
      status: `${replyTargets} ${newName}になった`,
      in_reply_to_status_id: tweet.id_str
    });
  });
}

function getRandomName() {
  const options = {
    uri: 'https://ja.wikipedia.org/wiki/Special:Random',
    transform: (body) => cheerio.load(body)
  };

	return request.get(options)
		.then($ => Promise.resolve($('h1#firstHeading').text()));
}

function getReplyTargets(tweet) {
  let screenNames = tweet.entities.user_mentions.map(user => user.screen_name);
  if (screenNames.includes(tweet.user.screen_name)) {
    screenNames.push(tweet.user.screen_name);
  }

  return screenNames.map(screenName => `@${screenName}`).join(' ');
}

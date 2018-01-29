const http = require('http');
const snek = require('snekfetch');
const { Client } = require('discord-rpc');

const client = new Client({ transport: 'ipc' });
const startTimestamp = new Date();

let token;
let csrf;
let port = 4370;

getPort();

function getPort() {
  if (port > 4380) {
    port = 4370;
    console.log(`Spotify cannot be found. Be sure the Spotify app is running on your pc!`);
  } else {
    request('/service/version.json?service=remote')
      .then(() => console.log(`Spotify found!`))
      .catch(() => {
        port++;
        getPort();
      });
  }
}

process.on('uncaughtException', () => {
  // Yes I am doing nothing here. It would crash otherwise.
});

// Why use snekfetch here? Well the https module never returned a proper token. Always a fake one ¯\_(ツ)_/¯
function getToken() {
  snek.get('https://open.spotify.com/token').then((t) => {
    let to = JSON.parse(t.text);
    token = to.t;
  });
}
function request(place) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Yeah hang on let me try that again.`)), 1000);
    var url = {
      host: 'hi.spotilocal.com',
      port: port,
      path: place,
      headers: {
        Origin: 'https://open.spotify.com',
      },
    };
    http.get(url, (res) => {
      var body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        clearTimeout(timeout);
        resolve(JSON.parse(body));
      });
    });
  });
}
function getCSRF() {
  request('/simplecsrf/token.json').then((h) => {
    csrf = h.token;
  });
}
function update() {
  request(`/remote/status.json?csrf=${csrf}&oauth=${token}`).then((l) => {
    var stuff = l;
    if (stuff.track) {
      client.setActivity({
        state: `By - ${stuff.track.artist_resource.name}`,
        details: `Playing - ${stuff.track.track_resource.name}`,
        largeImageKey: 'spotify',
        largeImageText: stuff.track.track_resource.name,
        smallImageKey: 'play',
        smallImageText: stuff.track.artist_resource.name,
        instance: true,
        startTimestamp,
      });
    } else if (stuff.error) {
      getToken();
      getCSRF();
    }
  });
}

client.on('ready', () => {
  console.log('Done didily doing it!');
  try {
    update();
    setInterval(() => {
      update();
    }, 5e3);
  } catch (e) {
    console.log(e);
  }
});


client.login('399724040920629258').catch(console.error);

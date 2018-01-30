const { Client } = require('discord-rpc');
const spotify = require('./spoofy.js');

const spoofy = new spotify();

const client = new Client({ transport: 'ipc' });
const startTimestamp = new Date();

spoofy.getPort();

process.on('uncaughtException', () => {
  // Yes I am doing nothing here. It would crash otherwise.
});

function update() {
  spoofy.request(`/remote/status.json?csrf=${spoofy.csrf}&oauth=${spoofy.token}`).then((l) => {
    var stuff = l;
    let name;
    if (!stuff.error) {
      if (stuff.track.artist_resource.name)
        name = stuff.track.artist_resource.name;
      else
        name = 'N/A';
      client.setActivity({
        state: `By - ${name}`,
        details: `Playing - ${stuff.track.track_resource.name}`,
        largeImageKey: 'spotify',
        largeImageText: stuff.track.track_resource.name,
        smallImageKey: 'play',
        smallImageText: name,
        instance: true,
        startTimestamp,
      });
    } else {
      spoofy.getToken();
      spoofy.getCSRF();
    }
  }).catch(() => {
    // I am also doing nothing here to avoid console errors.
  });
}

client.on('ready', () => {
  console.log('Spoofy RPC running!');
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

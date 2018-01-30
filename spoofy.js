const snek = require('snekfetch');
const http = require('http');


class Spoofy {
  constructor() {
    this.port = 4370;
    this.token = null;
    this.csrf = null;
  }

  getPort() {
    if (this.port > 4380) {
      this.port = 4370;
      console.log(`Spotify cannot be found. Be sure the Spotify app is running on your pc!`);
    } else {
      this.request('/service/version.json?service=remote')
        .then(() => console.log(`Spotify found!`))
        .catch(() => {
          this.port++;
          this.getPort();
        });
    }
  }


  // Why use snekfetch here? Well the https module never returned a proper token. Always a fake one ¯\_(ツ)_/¯
  getToken() {
    snek.get('https://open.spotify.com/token').then((t) => {
      let to = JSON.parse(t.text);
      this.token = to.t;
    });
  }

  request(place) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Yeah hang on let me try that again.`)), 1000);
      var url = {
        host: 'hi.spotilocal.com',
        port: this.port,
        path: place,
        headers: {
          Origin: 'https://open.spotify.com',
        },
      };
      http.get(url, (res) => {
        let body = '';
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
  getCSRF() {
    this.request('/simplecsrf/token.json').then((h) => {
      this.csrf = h.token;
    }).catch(() => {
      console.log(`Error getting CSRF.`);
    });
  }
}

module.exports = Spoofy;

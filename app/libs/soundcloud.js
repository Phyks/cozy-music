import Track from '../models/track';


const api = 'https://api.soundcloud.com';
const clientID = '02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea';

class Soundcloud {

    import(url) {
        this.get('/resolve', { url: url}, (res) => {
            if (res.kind == 'playlist') {

            } else if (res.kind == 'track') {
                this.checkIfAlreadyExist(res);
            }
        });
    }

    checkIfAlreadyExist(track) {
        cozysdk.run('Track', 'soundcloud', {}, (err, res) => {
            if (res) {
                let exist = false;
                const tracks = JSON.parse('' + res);
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].value.ressource.url == track.stream_url) {
                        exist = true;
                    }
                }
                if (!exist) {
                    this.importTrack(track);
                } else {
                    alert('Already in DB')
                }
            }
        });
    }

    importTrack(track) {
        if (!track.streamable) {
            alert('Track is not streamable');
            return;
        }
        let newTrack = new Track();
        newTrack.set('ressource', {
            type: 'soundcloud',
            url: track.stream_url
        });
        newTrack.set('metas', {
            title: track.title,
            artist: track.user.username,
            genre: track.genre,
        });
        console.log(newTrack);
        newTrack.save();
        alert('Imported ' + track.title);
    }

    addClientID(url) {
        return url + '?client_id=' + clientID;
    }

    get(endpoint, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = {};
        }

        let url;
        if (endpoint.includes(api)) {
            url = this.addClientID(endpoint);
        } else {
            url = this.addClientID(api + endpoint);
        }

        for (let key in params){
            if (params.hasOwnProperty(key)) {
                url += '&' + key + '=' + params[key];
            }
        }

        console.log('SCDL', url);

        $.ajax({
            dataType: 'json',
            url: url,
            success: callback
        });
    }
}

export default new Soundcloud();

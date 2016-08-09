import Backbone from 'backbone';
import Track from '../models/track';
import cozysdk from 'cozysdk-client';
import application from '../application'

const Tracks = Backbone.Collection.extend({

    model: Track,

    initialize(models, options) {
        let defaultView = 'playableByTitle'
        this.viewName = options ? options.viewName || defaultView : defaultView
    },

    sync(method, model, options) {
        if (method == 'read') {
            let promise = cozysdk.queryView('Track', this.viewName, options.data)
            promise.then((res) => {
                if (options && options.success) {
                    options.success(res);
                }
            })
            promise.catch((err) => {
                if (options && options.error) {
                    options.error(err);
                }
            });
            return promise;
        }
    },

    parse(tracks, options) {
        let result = [];
        for (let i = 0; i < tracks.length; i++) {
            result.push(tracks[i].value);
        }
        return result;
    }
});

// COZYSDK : Requests \\
let callback = (error, response) => {};

cozysdk.defineView('Track', 'playableByTitle', (doc) => {
    if (!doc.hidden && doc.metas) {
        emit(doc.metas.title, doc);
    }
}, callback);

cozysdk.defineView('Track', 'playableByArtist', (doc) => {
    if (!doc.hidden && doc.metas) {
        emit(doc.metas.artist, {_id: doc._id});
    }
}, callback);

cozysdk.defineView('Track', 'playableByAlbum', (doc) => {
    if (!doc.hidden && doc.metas) {
        emit(doc.metas.album, {_id: doc._id});
    }
}, callback);

cozysdk.defineView('Track', 'all', (doc) => {
    if (!doc._attachments) {
        emit(doc._id, doc);
    }
}, callback);

cozysdk.defineView('Track', 'oldDoctype', (doc) => {
    if (doc.title) {
        emit(doc._id, doc);
    }
}, callback);

cozysdk.defineView('Track', 'file', (doc) => {
    if (doc.ressource.type == 'file') {
        emit(doc._id, doc.ressource.fileID);
    }
}, callback);

cozysdk.defineView('Track', 'allFileTrack', (doc) => {
    if (doc.ressource.type == 'file') {
        emit(doc._id, doc);
    }
}, callback);

cozysdk.defineView('Track', 'soundcloud', (doc) => {
    if (doc.ressource.type == 'soundcloud') {
        emit(doc._id, doc);
    }
}, callback);

cozysdk.defineView('File', 'music', (doc) => {
    if (doc.class == 'music') {
        emit(doc.name, doc);
    }
}, callback);


export default Tracks;

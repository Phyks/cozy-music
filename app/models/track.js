import Backbone from 'backbone';
import scdl from '../libs/soundcloud';
import cozysdk from 'cozysdk-client';

const Track = Backbone.Model.extend({

    defaults: {
        _id: undefined,
        playlists: '',
        metas: '',
        dateAdded: Date.now,
        plays: 0,
        ressource: '',
        hidden: false
    },

    idAttribute:'_id',

    sync(method, model, options) {
        switch (method) {
            case 'create':
                return cozysdk.create('Track', model.toJSON())
                    .then((res) => {
                        model.set('_id', res._id);
                        options.success();
                    });
                break;
            case 'read':
                return cozysdk.find('Track', model.get('_id'))
                    .then((res) => {
                        options.success();
                     });
                break;
            case 'update':
                return cozysdk.updateAttributes('Track', model.id, model.toJSON())
                    .then((res) => {
                        options.success();
                    });
                break;
            case 'delete':
                return cozysdk.destroy('Track', model.get('_id'))
                    .then((res) => {
                        options.success();
                    });
                break;
        }
    },

    getStream(callback) {
        let ressource = this.get('ressource');
        this.set('plays', this.get('plays') +1); // Update the plays number
        this.save();
        switch (ressource.type) {
            case 'file':
                let id = this.get('ressource').fileID;
                cozysdk.getFileURL(id, 'file', (err, res) => {
                    if (res) {
                        callback(res);
                    }
                })
                break;
            case 'soundcloud':
                let url = this.get('ressource').url;
                callback(scdl.addClientID(url));
                break;
        }
    }
});

export default Track;

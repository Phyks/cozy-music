import Mn from 'backbone.marionette';
import application from '../application';
import Tracks from '../collections/tracks';

const Header = Mn.ItemView.extend({

    template: require('./templates/header'),

    ui: {
        title: '#playlist-title'
    },

    events: {
        'click #reset-upnext': 'resetUpNext',
        'click #delete-playlist': 'deletePlaylist',
        'keypress @ui.title': 'keypressPlaylistTitle',
        'blur @ui.title' : 'savePlaylistTitle'
    },

    modelEvents: {
      'change:currentPlaylist': 'changedPlaylist'
    },

    initialize() {
       this.listenTo(
            this.model.get('currentPlaylist').get('tracks'),
            'update reset',
            this.render
        );
    },

    keypressPlaylistTitle(e) {
        e.stopPropagation();
        if (e.key == 'Enter') {
            this.ui.title.blur();
            return false;
        }
    },

    savePlaylistTitle(e) {
        if (this.ui.title.html() == '') {
            setTimeout(() => { this.ui.title.focus() }, 0);
        } else {
            let currentPlaylist = this.model.get('currentPlaylist');
            currentPlaylist.set('title', this.ui.title.html());
            currentPlaylist.save();
        }
    },

    serializeData() {
        let currentPlaylist = this.model.get('currentPlaylist');
        return {
            title: currentPlaylist.get('title'),
            count: currentPlaylist.get('tracks').length,
            type: currentPlaylist.get('tracks').type
        }
    },

    // Rebind the listener to the correct playlist
    changedPlaylist(model, newValue) {
        this.stopListening(model.changed);
        this.listenTo(
            this.model.get('currentPlaylist').get('tracks'),
            'update reset',
            this.render
        );
        this.render();
    },

    deletePlaylist() {
        let currentPlaylist = this.model.get('currentPlaylist');
        application.channel.trigger('delete:playlist', currentPlaylist);
    },

    resetUpNext() {
        application.channel.trigger('reset:UpNext');
    },

});

export default Header;

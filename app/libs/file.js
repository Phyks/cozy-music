import Track from '../models/track';
import application from '../application';
import cozysdk from 'cozysdk-client';
import async from 'async';

export function syncFiles() {
    cozysdk.run('Track', 'oldDoctype', {}, (err, tracks) => {
        if (tracks.length > 0) {
            createCozicFolder(tracks);
        } else {
            fileSynchronisation();
        }
    });
}

function fileSynchronisation() {
    cozysdk.run('File', 'music', {}, (err, files) => {
        if (files) {
            getAllTracksFileId(files);
        }
    });
}

// Create Cozic Folder
function createCozicFolder(tracks) {
    cozysdk.defineRequest('Folder', 'Cozic', (doc) => {
            if (doc.name == 'Cozic') {
                emit(doc._id, doc);
            }
        }, (error, response) => {
            cozysdk.run('Folder', 'Cozic', {}, (err, folder) => {
                if (folder.length == 0) {
                    let folder = {
                        "path": "",
                        "name": "Cozic",
                        "docType": "folder",
                        "creationDate": Date.now,
                        "lastModification": Date.now,
                        "tags": []
                    }
                    cozysdk.create('Folder', folder, (err, res) => {
                        convertToBinaries(tracks);
                    });
                } else {
                    convertToBinaries(tracks);
                }
            });
    });
}

// Convert attachment into a binary
function convertToBinaries(tracks) {
    async.eachSeries(tracks, convertOneTrack, (err) => {
        fileSynchronisation();
    });
}

function convertOneTrack(track, callback) {
    track = track.value;
    cozysdk.convertToBinaries(track._id, 'file', (err, resp) => {
        if (resp) {
            getTrack(track, callback);
        }
    });
}

// Get track info
function getTrack(track, callback) {
    cozysdk.find('Track', track._id, (err, newTrack) => {
        getBinary(newTrack, callback);
    });
}

// Get binary info
function getBinary(track, callback) {
    let binaryId = track.binary.file.id;
    cozysdk.find('Binary', binaryId, (err, binary) => {
        migrateTrack(track, binary, callback);
    });
}

// Delete the old track and create a File doctype
function migrateTrack(track, binary, callback) {
    let file = {
       'path': '/Cozic',
       'name': track.slug,
       'docType': 'file',
       'mime': 'audio/mpeg',
       'creationDate': Date.now,
       'lastModification': Date.now,
       'class': 'music',
       'size': binary._attachments.file.length,
       'tags': [],
       'uploading': false,
       'binary': track.binary,
       'checksum': ''
    }
    cozysdk.create('File', file, (err, res) => {
        cozysdk.destroy('Track', track._id, (err, res) => {
            callback();
        });
    });
}


// Get all needed variable
function getAllTracksFileId(musicFiles) {
    cozysdk.run('Track', 'file', {}, (err, tracks) => {
        let tracksFileId = [];
        let allTracksFiles = [];
        let musicFilesFileId = [];
        if (tracks) {
            for (let i = 0; i < tracks.length; i++) {
                tracksFileId.push(tracks[i].value.ressource.fileID);
                allTracksFiles.push(new Track(tracks[i].value));
            }
            for (let i = 0; i < musicFiles.length; i++) {
                musicFilesFileId.push(musicFiles[i].value._id);
            }
            saveTrack(musicFiles, tracksFileId);
            deleteTrack(allTracksFiles, musicFilesFileId);
            let notification = {
                status: 'ok',
                message: t('all your audio files have been added')
            }
            application.channel.request('notification', notification);
        }
    });
}

// Delete track if the files associated is deleted too
function deleteTrack(allTracks, musicFilesFileId) {
    for (let i = 0; i < allTracks.length; i++) {
        let t = allTracks[i];
        if (!_.includes(musicFilesFileId, t.get('ressource').fileID)) {
            t.destroy({ success: () => {
                application.allTracks.get('tracks').remove(t);
            }});
        }
    }
}

// Save the track if it's a new file that has not been synced
function saveTrack(musicFiles, tracksFileId) {
    let files = musicFiles;
    for (let i = 0; i < files.length; i++) {
        let file = files[i].value;
        let trackname = file.name; // TO DO : ID3TAG
        let fileid = file._id;
        let t = new Track({
            metas: {
                title: trackname
            },
            ressource: {
                type: 'file',
                fileID: fileid
            }
        });

        if (!_.includes(tracksFileId, fileid)) { // does not contains fileid
            application.allTracks.get('tracks').create(t);
        }
    }
}

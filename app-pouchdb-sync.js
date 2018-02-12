import '../../@polymer/polymer/polymer.js';
import './pouchdb.js';
import { Polymer } from '../../@polymer/polymer/lib/legacy/polymer-fn.js';

Polymer({
  is: 'app-pouchdb-sync',

  properties: {
    /**
     * The source to sync from. If this sync is `bidirectional`, then the
     * `src` and `target` values are interchangeable.
     */
    src: {
      type: String
    },

    /**
     * The `target` to sync to. If this sync is `bidirectional`, then the
     * `src` and `target` values are interchangeable.
     */
    target: {
      type: String
    },

    /**
     * While `false`, synchronization will only happen from the `src` to the
     * `target`. One-directional synchronization follows the semantics of
     * `PouchDB.replicate`. Set to `true` to make the sync bidirectional,
     * which uses `PouchDB.sync` instead.
     */
    bidirectional: {
      type: Boolean,
      value: false
    },

    /**
     * An event emitter that notifies of events in the synchronization
     * process.
     */
    sync: {
      type: Object,
      computed: '__computeSync(src, target, bidirectional)',
      observer: '__syncChanged'
    },

    /**
     * Set to true to log change events that are emitted by the `sync`
     * instance.
     */
    log: {
      type: Boolean,
      value: false
    }
  },

  __computeSync: function(src, target, bidirectional) {
    var options = {
      live: true,
      retry: true
    }
    return bidirectional ?
      PouchDB.sync(src, target, options) :
      PouchDB.replicate(src, target, options);
  },

  __syncChanged: function(sync, oldSync) {
    if (oldSync) {
      oldSync.removeAllListeners();
      oldSync.cancel();
    }

    if (sync) {
      sync.on('change', this.__onSyncChange.bind(this));
      sync.on('error', this.__onSyncError.bind(this));
    }
  },

  __onSyncChange: function(change) {
    if (this.log) {
      console.log(change);
    }
  },

  __onSyncError: function(error) {
    console.error(error);
  }
});

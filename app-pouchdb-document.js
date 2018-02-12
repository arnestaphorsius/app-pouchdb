import '../../@polymer/polymer/polymer.js';
import { AppStorageBehavior } from '../../@polymer/app-storage/app-storage-behavior.js';
import { AppPouchDBDatabaseBehavior } from './app-pouchdb-database-behavior.js';
import './pouchdb.js';
import { Polymer } from '../../@polymer/polymer/lib/legacy/polymer-fn.js';

Polymer({
  is: 'app-pouchdb-document',

  behaviors: [
    AppStorageBehavior,
    AppPouchDBDatabaseBehavior
  ],

  properties: {
    /**
     * The value of the _id (Pouch/Couch unique identifier) of the PouchDB
     * document that this element's data should refer to.
     */
    docId: {
      type: String,
      value: null
    },

    /**
     * The current _rev (revision) of the PouchDB document that this
     * element's data refers to, if the document is not new.
     */
    rev: {
      type: String,
      readOnly: true,
      value: null
    },

    /**
     * A changes event emitter. Notifies of changes to the PouchDB document
     * referred to by `docId`, if a `docId` has been provided.
     */
    changes: {
      type: Object,
      computed: '__computeChanges(db, docId)'
    }
  },

  observers: [
    '__docRevChanged(data._rev)',
    '__docChanged(db, data, docId, _readied)'
  ],

  /** @override */
  get isNew() {
    return this.docId == null;
  },

  /** @override */
  get zeroValue() {
    return {};
  },

  /** @override */
  saveValue: function() {
    if (!this.db) {
      return Promise.reject('No PouchDB instance available!');
    }

    if (this.docId) {
      this.data._id = this.docId;
    }

    return this._upsert('data', this.data, this.data)
        .then(function(response) {
          this.syncToMemory(function() {
            this.docId = response.id;
            this.set('data._id', response.id);
            this.set('data._rev', response.rev);
          });
        }.bind(this));
  },

  /** @override */
  reset: function() {
    this.docId = null;
    this.data = this.zeroValue;
  },

  /** @override */
  destroy: function() {
    this.set('data._deleted', true);
    return this.transactionsComplete.then(function() {
      return this.reset();
    });
  },

  /** @override */
  getStoredValue: function(storagePath) {
    return this.db.get(this.docId).then(function(doc) {
      return this.get(storagePath, {
        data: doc
      });
    }.bind(this)).catch(function(error) {
      if (error && error.status === 404) {
        return;
      } else {
        throw error;
      }
    });
  },

  /** @override */
  setStoredValue: function(storagePath, value) {
    if (storagePath === 'data' && value == null) {
      return Promise.reject(
          ['Unsupported attempt to unset PouchDB document by assigning null value.',
           'Perhaps you meant to set `data._deleted = true`?'].join(' '));
    }

    return this._put(storagePath, value, this.data);
  },

  __docChanged: function(db, doc, docId) {
    this._log('Doc / ID changed', doc, docId);
    if (db && doc != null && docId != null && doc._id != docId) {
      doc._id = docId;
      this._initializeStoredValue();
    }
  },

  __docRevChanged: function() {
    this._setRev(this.data != null ? this.data._rev : null);
  },

  __computeChanges: function(db, docId) {
    if (this.changes) {
      this.changes.cancel();
    }

    if (db == null || docId == null) {
      return null;
    }

    return db.changes({
      since: 'now',
      live: true,
      doc_ids: [docId],
      include_docs: true,
    }).on('change', function(change) {
      var doc = change.doc;
      this.syncToMemory(function() {
        this.set('data', doc);
      });
    }.bind(this));
  }
});

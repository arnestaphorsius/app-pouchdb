import '../../@polymer/polymer/polymer.js';
import './pouchdb.js';
import { Polymer } from '../../@polymer/polymer/lib/legacy/polymer-fn.js';
import { dom } from '../../@polymer/polymer/lib/legacy/polymer.dom.js';

Polymer({
  is: 'app-pouchdb-conflict-resolution',

  properties: {
    /**
     * The name of the strategy to use to reslve the conflict. Supported
     * strategies are `firstWriteWins` (the default) and `lastWriteWins`.
     */
    strategy: {
      type: String,
      value: 'firstWriteWins'
    },

    /**
     * By default, this element stops propagation of any conflict events
     * that it is able to handle. If set to `true`, the element will allow
     * such events to continue propagating, opening the possibility that
     * another conflict resolution strategy higher up the document tree will
     * superseed this one.
     */
    allowAncestralResolution: {
      type: Boolean,
      value: false
    }
  },

  created: function() {
    this._eventTarget = null;
  },

  attached: function() {
    this._eventTarget = dom(this).host || document;
    this.listen(
        this._eventTarget,
        'app-pouchdb-conflict',
        'resolveConflict');
  },

  detached: function() {
    this.unlisten(
        this._eventTarget,
        'app-pouchdb-conflict',
        'resolveConflict');
  },

  resolveConflict: function(event) {
    if (!this.strategy || !this[this.strategy]) {
      return Promise.reject('No resolution strategy available.');
    }

    event.detail.resolveConflict(this[this.strategy].bind(this));

    if (!this.allowAncestralResolution) {
      event.stopImmediatePropagation();
    }
  },

  firstWriteWins: function(db, method, doc, error) {
    return db.get(doc._id).then(function(canonicalDoc) {
      return {
        id: canonicalDoc._id,
        rev: canonicalDoc._rev
      };
    });
    return Promise.resolve();
  },

  lastWriteWins: function(db, method, doc, error) {
    return db.get(doc._id, { conflicts: true }).then(function(canonicalDoc) {
      doc._rev = canonicalDoc._rev;
      return db.put(doc);
    }.bind(this));
  }
});

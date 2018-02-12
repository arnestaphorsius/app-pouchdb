import '../../@polymer/polymer/polymer.js';
import { AppPouchDBDatabaseBehavior } from './app-pouchdb-database-behavior.js';
import './pouchdb.js';
import './pouchdb.find.js';
import { Polymer } from '../../@polymer/polymer/lib/legacy/polymer-fn.js';

Polymer({
  is: 'app-pouchdb-index',

  behaviors: [
    AppPouchDBDatabaseBehavior
  ],

  properties: {
    /**
     * A list of fields to index.
     */
    fields: {
      type: Array
    },

    /**
     * The name of the index, auto-generated if you don't include it.
     */
    name: {
      type: String,
      value: null
    },

    /**
     * Design document name (i.e. the part after '_design/'), auto-generated
     * if you don't include it.
     */
    ddoc: {
      type: String,
      value: null
    },

    /**
     * The configuration object for the index, derived from `fields`, `name`
     * and `ddoc` properties.
     */
    index: {
      type: Object,
      computed: '__computeIndex(fields.*, name, ddoc)'
    }
  },

  observers: [
    '__createIndex(db, index)'
  ],

  __createIndex: function() {
    if (this.index == null) {
      throw new Error('Index not configured!');
    }

    this.db.createIndex({
      index: this.index
    }).catch(function(error) {
      this._error(error);
    }.bind(this));
  },

  __computeIndex: function() {
    var index;

    if (!this.fields || !this.fields.length) {
      return null;
    }

    index = {};
    index.fields = this.fields;

    if (this.name != null) {
      index.name = this.name;
    }

    if (this.ddoc != null) {
      index.ddoc = this.ddoc;
    }

    return index;
  }
});

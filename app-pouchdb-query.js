import '../../@polymer/polymer/polymer.js';
import { AppPouchDBDatabaseBehavior } from './app-pouchdb-database-behavior.js';
import './pouchdb.js';
import './pouchdb.find.js';
import { Polymer } from '../../@polymer/polymer/lib/legacy/polymer-fn.js';

Polymer({
  is: 'app-pouchdb-query',

  behaviors: [
    AppPouchDBDatabaseBehavior
  ],

  properties: {
    /**
     * The selector to use when querying for documents. Fields referenced
     * in the selector must have indexes created for them.
     */
    selector: {
      type: String
    },

    /**
     * The fields to include in the returned documents.
     */
    fields: {
      type: Array,
      value: function() {
        return [];
      }
    },

    /**
     * A list of field names to sort by. Fields in this list must have
     * indexes created for them.
     */
    sort: {
      type: Array,
      value: function() {
        return [];
      }
    },

    /**
     * The maximum number of documents that can be returned. The default (0)
     * specifies no limit.
     */
    limit: {
      type: Number,
      value: 0
    },

    /**
     * The number of documents to skip before returning results that match
     * the query. In other words, the offset from the beginning of the
     * of the result set to start at.
     */
    skip: {
      type: Number,
      value: 0
    },

    /**
     * An object representing the parsed form of the selector, mapping to
     * a valid selector value as described in
     * [the pouchdb-find docs](https://github.com/nolanlawson/pouchdb-find).
     */
    parsedSelector: {
      type: Object,
      computed: '__computeParsedSelector(selector)'
    },

    /**
     * A configuration object suitable to be passed to the `find` method of
     * the PouchDB database. For more information, refer to the docs
     * [here](https://github.com/nolanlawson/pouchdb-find/blob/master/README.md#dbfindrequest--callback)
     */
    query: {
      type: Object,
      computed: '__computeQuery(db, parsedSelector, fields.*, sort.*, limit, skip)'
    },

    /**
     * The results of the query, if any.
     */
    data: {
      type: Array,
      readOnly: true,
      notify: true,
      value: function() {
        return [];
      }
    }
  },

  observers: [
    'refresh(db, query)'
  ],

  /**
   * PouchDB only notifies of additive changes to the result set of a query.
   * In order to keep the query results up to date with other types of
   * changes, this method can be called to perform the query again without
   * changing any of this element's other properties.
   */
  refresh: function() {
    if (!this.query) {
      throw new Error('Query not configured!');
    }

    this.debounce('find', function() {
      this.db.find(this.query).then(function(results) {
        this._setData(results.docs || []);
      }.bind(this)).catch(function(error) {
        console.error(error);
      }.bind(this));
    }, 1);
  },

  __computeQuery: function() {
    var query = {};

    query.selector = this.parsedSelector;
    query.fields = this.fields;
    query.sort = this.sort;

    if (this.limit) {
      query.limit = this.limit;
    }

    if (this.skip) {
      query.skip = this.skip;
    }

    return query;
  },

  __computeParsedSelector: function(selector) {
    var dimensions = selector.split(/\s*[,]\s*/);
    var parsedSelector = {};

    for (var i = 0; i < dimensions.length; ++i) {
      if (dimensions[i]) {
        this.__parseDimension(parsedSelector, dimensions[i]);
      }
    }
    return parsedSelector;
  },

  __parseDimension: function(parsedSelector, dimension) {
    var parsedDimension = {};
    var tokens = dimension.split(/\s+/);
    var field = tokens.shift();

    while (tokens.length > 1) {
      try {
        this.__parseConstraint(parsedDimension, tokens.splice(0, 2));
      } catch (e) {}
    }

    parsedSelector[field] = parsedDimension;
  },

  __parseConstraint: function(parsedDimension, constraintTokens) {
    var operator = constraintTokens[0];
    var rhs = constraintTokens[1];
    var rhsAsNumber;

    if (/^['"].*['"]$/.test(rhs)) {
      rhs = rhs.slice(1, rhs.length - 1);
    } else {
      rhsAsNumber = window.parseFloat(rhs, 10);
      if (!window.isNaN(rhsAsNumber)) {
        rhs = rhsAsNumber;
      } else {
        rhs = rhs === 'true';
      }
    }

    if (operator != null && rhs != null) {
      parsedDimension[operator] = rhs;
    }
  }
});

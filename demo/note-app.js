import '../../../@polymer/polymer/polymer.js';
import '../../../@polymer/paper-fab/paper-fab.js';
import '../../../@polymer/app-storage/app-indexeddb-mirror/app-indexeddb-mirror.js';
import '../../../note-app-elements/na-elements.js';
import '../app-pouchdb-query.js';
import '../app-pouchdb-document.js';
import '../app-pouchdb-conflict-resolution.js';
import { Polymer } from '../../../@polymer/polymer/lib/legacy/polymer-fn.js';
import { NoteAppBehavior } from '../../../note-app-elements/na-behavior.js';

Polymer({
  _template: `
    <style include="note-app-shared-styles"></style>

    <na-toolbar></na-toolbar>

    <app-pouchdb-conflict-resolution strategy="firstWriteWins">
    </app-pouchdb-conflict-resolution>

    <app-pouchdb-query id="query" db-name="notes" selector="_id \$gt 0" fields="[&quot;_id&quot;, &quot;title&quot;, &quot;body&quot;]" sort="[&quot;_id&quot;]" data="{{data}}">
    </app-pouchdb-query>

    <div class="notes">
      <template is="dom-repeat" items="[[data]]" as="note">
        <na-note id\$="[[note._id]]" title="[[note.title]]" body="[[note.body]]" on-tap="edit">
        </na-note>
      </template>
    </div>

    <app-pouchdb-document id="document" db-name="notes" doc-id="[[editableNoteId]]" data="{{editableNote}}">
    </app-pouchdb-document>

    <paper-fab icon="add" on-tap="create"></paper-fab>

    <na-editor id="editor" note="{{editableNote}}" on-close="commitChange">
    </na-editor>
`,

  is: 'note-app',
  behaviors: [ NoteAppBehavior ]
});

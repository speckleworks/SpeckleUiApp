<template>
  <v-card>
    <v-toolbar flat dark color="primary">
      <v-btn icon dark @click="$emit('close')">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title v-if="isEdit" class="text-truncate font-weight-light">Edit sender</v-toolbar-title>
      <v-toolbar-title v-else class="text-truncate font-weight-light">Add a new sender</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <div class="ma-5">
        <v-layout row wrap align-center v-if="!isEdit">
          <v-flex xs12>
            <p class="headline font-weight-light">Account</p>
            <p
              class="caption"
            >We first need to know which speckle server the data is going to go to.</p>
            <v-overflow-btn
              :items="accounts"
              label="Account"
              editable
              solo
              v-model="SelectionAccount"
              item-text="fullName"
              return-object
            ></v-overflow-btn>
          </v-flex>
        </v-layout>
        <v-layout row wrap align-center v-if="SelectionAccount">
          <!-- STREAM NAME -->
          <v-flex xs12>
            <p class="headline font-weight-light">Stream Name</p>
            <p class="caption">Something meaningful would do, like 'walls-final-final-2'.</p>
            <v-text-field label="walls-final-final-2" single-line solo v-model="newStreamName"></v-text-field>
          </v-flex>
          <!-- SELECTION FILTERS -->
          <v-flex xs12>
            <p class="headline font-weight-light">Objects</p>
            <p class="caption">How do you want to add objects to this stream?</p>
            <v-tabs centered grow icons-and-text v-model="SelectionFilter">
              <v-tab v-for="(filter, index) in filters" :key="index" class="ml-0">
                {{ filter.Name }}
                <v-icon small>{{ filter.Icon }}</v-icon>
              </v-tab>
            </v-tabs>
          </v-flex>
          <v-flex xs12>
            <v-tabs-items v-model="SelectionFilter">
              <v-tab-item v-for="(filter, index) in filters" :key="index">
                <v-card flat tile v-if="filter.Type==='SpeckleUiBase.ElementsSelectionFilter'">
                  <!-- SELECTION -->
                  <v-card-text>
                    <p v-if="filter.Selection.length===0">
                      Select some objects and add them to this strem. 
                    </p>
                    <p v-else>
                      You have added
                      <kbd>{{filter.Selection.length}}</kbd>
                      {{pluralize('object', filter.Selection.length)}} by selection.
                    </p>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn rounded small outlined color="success" @click="addSelectionToSender()">
                      <v-icon>add</v-icon>
                      Add {{selectionCount}} {{pluralize('object', selectionCount)}}
                    </v-btn>
                    <v-btn rounded small outlined color="error" @click="clearSelection()">
                      <v-icon>close</v-icon>Clear
                    </v-btn>
                  </v-card-actions>
                </v-card>
                <v-card flat tile v-else-if="filter.Type==='SpeckleUiBase.ListSelectionFilter'">
                  <!-- LIST -->
                  <v-card-text>
                    <p>
                      Add objects to this stream by {{filter.Name.toLowerCase()}}.
                      <br />You currently have
                      <kbd>{{filter.Selection.length}}</kbd>
                      {{pluralize(filter.Name.toLowerCase(), filter.Selection.length)}} selected:
                    </p>
                    <v-autocomplete
                      v-model="filter.Selection"
                      :items="filter.Values"
                      multiple
                      chips
                    >
                      <template v-slot:prepend-item>
                        <v-list-item ripple @click="toggle(filter)">
                          <v-list-item-action>
                            <v-icon
                              :color="filter.Selection.length > 0 ? 'primary' : ''"
                            >{{ icon(filter) }}</v-icon>
                          </v-list-item-action>
                          <v-list-item-content>
                            <v-list-item-title>Select All</v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                        <v-divider class="mt-2"></v-divider>
                      </template>
                    </v-autocomplete>
                  </v-card-text>
                </v-card>
                <v-card flat tile v-else-if="filter.Type==='SpeckleUiBase.PropertySelectionFilter'">
                  <!-- CUSTOM -->
                  <v-card-text>
                    <p>
                      Add objects to this stream when {{filter.Name.toLowerCase()}}
                      <kbd>{{filter.PropertyName}}</kbd>
                      &nbsp;
                      <i>{{filter.PropertyOperator}}</i>&nbsp;
                      <kbd>{{filter.PropertyValue}}</kbd>.
                      <br />
                      <var
                        v-if="filter.HasCustomProperty"
                      >You can use custom {{filter.Name.toLowerCase()}} names too!</var>
                    </p>

                    <v-autocomplete
                      v-if="!filter.HasCustomProperty"
                      v-model="filter.PropertyName"
                      :items="filter.Values"
                      :label="filter.Name"
                    ></v-autocomplete>
                    <v-combobox
                      v-else
                      v-model="filter.PropertyName"
                      :items="filter.Values"
                      :label="filter.Name"
                    ></v-combobox>
                    <v-autocomplete
                      v-model="filter.PropertyOperator"
                      :items="filter.Operators"
                      label="Operator"
                    ></v-autocomplete>
                    <v-text-field label="Value" v-model="filter.PropertyValue"></v-text-field>
                  </v-card-text>
                </v-card>
              </v-tab-item>
            </v-tabs-items>
          </v-flex>
        </v-layout>
        <v-layout row wrap align-center>
          <v-flex
            xs12
            class="text-xs-left"
            v-if="!SelectionAccount || !SelectionAccount.validated"
          >Could not access that server (is it online?) or no server Selection.</v-flex>
        </v-layout>
        <br />
        <v-layout row wrap align-center>
          <!-- <v-spacer></v-spacer> -->
          <v-btn
            v-if="isEdit"
            block
            color="primary"
            :ripple="false"
            :disabled="!validated"
            @click.native="updateSender()"
          >Update Sender</v-btn>
          <v-btn
            v-else
            block
            color="primary"
            :ripple="false"
            :disabled="!validated"
            @click.native="addSender()"
          >Create Sender</v-btn>
        </v-layout>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState } from "vuex";

var pluralize = require('pluralize')
export default {
  name: 'NewClient',
  props: {
    isVisible: { type: Boolean, default: false },
    isEdit: { type: Boolean, default: false },
    senderClient: { type: Object, default: null },
  },
  data: () => ({
    SelectionAccount: null,
    newStreamName: null,
    SelectionFilter: null,
    filters: []
  }),
  watch: {
    isVisible(val) {
      if (val) {
        this.onOpen()
      }
    },
    // used as callback from addSelectionToSender
    // contains a list of objects (ids) to add to the current selection filter
    selectedObjects(val) {
      if (val && val.length > 0) {
        let filter = this.filters.find(f => f.Type === 'SpeckleUiBase.ElementsSelectionFilter')
        if (filter) {
          val.forEach(o => {
            if (!filter.Selection.includes(o))
              filter.Selection.push(o)
          })
        }
      }
    }
  },
  computed: {
    ...mapState([
      "selectionCount",
      "selectedObjects",
      "accounts"
    ]),
    validated() {
      if (this.newStreamName !== null)
        return this.validatedFilter
      return false
    },
    validatedFilter() {
      if (this.filters.length == 0 || this.SelectionFilter === null)
        return true
      let filter = this.filters[this.SelectionFilter]
      if (filter.Type === 'SpeckleUiBase.PropertySelectionFilter') {
        return filter.PropertyName !== null && filter.PropertyValue !== null && filter.PropertyOperator !== null
      }
      else if (filter.Type === 'SpeckleUiBase.ListSelectionFilter') {
        return filter.Selection.length > 0
      }
      else if (filter.Type === 'SpeckleUiBase.ElementsSelectionFilter') {
        return filter.Selection.length > 0
      }
    }

  },

  methods: {
    pluralize(text, count) {
      return pluralize(text, count)
    },
    checkedAllItems(filter) {
      return filter.Selection.length === filter.Values.length
    },
    checkedSomeItems(filter) {
      return filter.Selection.length > 0 && filter.Selection.length < filter.Values.length
    },
    icon(filter) {
      if (this.checkedAllItems(filter)) return 'check_box'
      if (this.checkedSomeItems(filter)) return 'indeterminate_check_box'
      return 'check_box_outline_blank'
    },
    toggle(filter) {
      this.$nextTick(() => {
        if (this.checkedAllItems(filter)) {
          filter.Selection = []
        } else {
          filter.Selection = filter.Values.slice()
        }      })    },
    async onOpen() {

      if (this.isEdit) {
        this.SelectionAccount = this.accounts.find(ac => ac.Token === this.senderClient.account.Token)
        this.newStreamName = this.senderClient.name
      }
      else {
        this.SelectionAccount = this.accounts.find(ac => ac.IsDefault === true)
        this.newStreamName = null
        this.SelectionFilter = null

      }
console.log(this.senderClient)
      //slowish operation, put here to avoid quirks, might need a loading bar...
      //deep copy
      this.filters = JSON.parse(await UiBindings.getFilters())
      if (this.isEdit) {
        let filterIndex = this.filters.findIndex(f => f.Name === this.senderClient.filter.Name)
        
        if (filterIndex > -1) {
          this.SelectionFilter = filterIndex
          this.filters[filterIndex] = this.senderClient.filter
          
        }
      }
    },
    refreshStreamsAtAccount() {
      this.$store.dispatch('getAccountStreams', this.SelectionAccount)
    },
    async addSelectionToSender() {
      await UiBindings.addSelectionToSender("")
    },
    async clearSelection() {
      let filter = this.filters.find(f => f.Type === 'SpeckleUiBase.ElementsSelectionFilter')
        if (filter) {
          filter.Selection = []
        }
    },
    async addSender() {
      //deep copy
      let filter = JSON.parse(JSON.stringify(this.filters[this.SelectionFilter]))
      let res = await this.$store.dispatch('addSenderClient', { account: this.SelectionAccount, streamName: this.newStreamName, filter: filter })
      this.$emit("close")
    },
    async updateSender() {
      //deep copy
      let filter = JSON.parse(JSON.stringify(this.filters[this.SelectionFilter]))
      let res = await this.$store.dispatch('updateSenderClient', { client: this.senderClient, streamName: this.newStreamName, filter: filter })
      this.$emit("close")
    }
  },
  mounted() {
    this.onOpen()
  }
}
</script>
<style scoped lang='scss'>
</style>
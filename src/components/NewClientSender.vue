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
        <v-layout row wrap align-center>
          <v-flex xs12>
            <p class="headline font-weight-light">Account</p>
            <p
              class="caption"
            >We first need to know which speckle server the data is going to go to.</p>
            <v-overflow-btn
              :disabled="isEdit"
              :items="$store.state.accounts"
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
          <v-flex xs12>
            <p class="headline font-weight-light">Stream Name</p>
            <p class="caption">Something meaningful would do, like 'walls-final-final-2'.</p>
            <v-text-field label="walls-final-final-2" single-line solo v-model="newStreamName"></v-text-field>
          </v-flex>
          <v-flex xs12>
            <p class="headline font-weight-light">Objects</p>
            <p class="caption">Finally, what do you want to send?</p>
            <v-tabs centered grow icons-and-text v-model="tab">
              <v-tab v-for="filter in $store.state.filters" :key="filter.Name" class="ml-0">
                {{ filter.Name }}
                <v-icon small>{{ filter.Icon }}</v-icon>
              </v-tab>
            </v-tabs>
          </v-flex>
          <v-flex xs12>
            <v-tabs-items v-model="tab">
              <v-tab-item v-for="filter in $store.state.filters" :key="filter.Name">
                <v-card flat tile>
                  <!-- SELECTION -->
                  <v-card-text v-if="filter.Type==='SpeckleUiBase.ElementsSelectionFilter'">
                    <p>
                      Add the current object selection to this stream.
                      <br />You currently have
                      <kbd>{{filter.Count}}</kbd>
                      {{pluralize('object', filter.Count)}} selected.
                    </p>
                  </v-card-text>
                  <!-- LIST -->
                  <v-card-text v-else-if="filter.Type==='SpeckleUiBase.ListSelectionFilter'">
                    <p>
                      Add objects to this stream by {{filter.Name.toLowerCase()}}.
                      <br />You currently have
                      <kbd>{{filter.Selection.length}}</kbd>
                      {{pluralize(filter.Name.toLowerCase(), filter.Selection.length)}} selected:
                    </p>
                    <v-select v-model="filter.Selection" :items="filter.Values" multiple chips>
                      <template v-slot:prepend-item>
                        <v-list-item ripple @click="toggle(filter)">
                          <v-list-item-action>
                            <v-icon
                              :color="filter.Selection.length > 0 ? 'indigo darken-4' : ''"
                            >{{ icon(filter) }}</v-icon>
                          </v-list-item-action>
                          <v-list-item-content>
                            <v-list-item-title>Select All</v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                        <v-divider class="mt-2"></v-divider>
                      </template>
                    </v-select>
                    <v-select v-model="filter.Selection" :items="filter.Values" multiple></v-select>

                    <!-- CUSTOM -->
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
var pluralize = require('pluralize')
console.log(pluralize('house', 5))
export default {
  name: 'NewClient',
  props: {
    isVisible: { type: Boolean, default: false },
    isEdit: { type: Boolean, default: false },
    senderClient: { type: Object, default: null },
  },
  watch: {
    isVisible(val) {
      if (val) {
        this.onOpen()
      }
    }
  },
  computed: {
    validated() {
      if (this.newStreamName !== null)
        return true
      return false
    },

  },
  data: () => ({
    SelectionAccount: null,
    newStreamName: null,
    SelectionObjects: [],
    tab: null,
  }),
  methods: {
    pluralize(text, count) {
      return pluralize(text, count)
    },
    checkedAllItems(filter) {
      console.log("filter")
      console.log(filter)
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
    onOpen() {
      if (this.isEdit) {

        let t = this.senderClient.account.Token
        this.SelectionAccount = this.$store.state.accounts.find(ac => ac.Token === t)
        this.newStreamName = this.senderClient.name
      }
      else {
        this.SelectionAccount = this.$store.state.accounts.find(ac => ac.IsDefault === true)
      }
    },
    refreshStreamsAtAccount() {
      this.$store.dispatch('getAccountStreams', this.SelectionAccount)
    },
    async addSender() {
      let res = await this.$store.dispatch('addSenderClient', { account: this.SelectionAccount, streamName: this.newStreamName, objects: this.SelectionObjects })
      this.$emit("close")
    },
    async updateSender() {
      let res = await this.$store.dispatch('updateSenderClient', { client: this.senderClient, streamName: this.newStreamName, objects: this.SelectionObjects })
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
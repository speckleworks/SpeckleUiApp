<template>
  <v-card>
    <v-toolbar dark flat color="secondary">
      <v-btn icon dark @click="$emit('close')">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title class="text-truncate font-weight-light">Add a new receiver</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <div class="ma-5">
        <v-layout row wrap align-center>
          <v-flex xs12>
            <p class="headline font-weight-light">Account</p>
            <p class="caption">We first need to know which speckle server the data is coming from.</p>
            <v-overflow-btn
              :items="$store.state.accounts"
              label="Account"
              editable
              solo
              v-model="selectedAccount"
              item-text="fullName"
              return-object
            ></v-overflow-btn>
          </v-flex>
        </v-layout>
        <v-layout
          row
          wrap
          align-center
          v-if="selectedAccount && selectedAccount.streams.length > 0"
        >
          <v-flex xs12>
            <p class="headline font-weight-light">Stream</p>
            <p
              class="caption"
            >If the stream you're looking for doesn't show up here, try refreshing the list and make sure it's shared with you!</p>
            <v-text-field v-model="search" label="Search streams" prepend-icon="search" clearable></v-text-field>
            <v-list max-height="200" class="overflow-y-auto">
              <v-subheader>Select a stream:</v-subheader>
              <v-list-item-group color="primary" v-model="selectedStream">
                <v-list-item
                  v-for="(item, i) in filteredStreams"
                  :key="i"
                  @click="addReceiver(item)"
                >
                  <v-list-item-content>
                    <v-list-item-title v-text="item.fullName"></v-list-item-title>
                    <v-list-item-subtitle>
                      <timeago :datetime="item.updatedAt" :auto-update="60"></timeago>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>

            <!-- <v-overflow-btn
              append-icon="refresh"
              @click:append="refreshStreamsAtAccount()"
              :items="selectedAccount.streams"
              :label="'Streams from ' + selectedAccount.fullName"
              editable
              :allow-overflow="false"
              v-model="selectedStream"
              item-text="fullName"
              return-object
            ></v-overflow-btn>-->
            <!-- <v-select :items="selectedAccount.streams" item-text="name"></v-select> -->
          </v-flex>
          <!-- <v-flex xs12 v-if="selectedStream" class="caption">
            Last updated:
            <timeago :datetime="selectedStream.updatedAt" :auto-update="60"></timeago>
          </v-flex>-->
        </v-layout>
        <v-layout row wrap align-center>
          <v-flex
            xs12
            class="text-xs-left"
            v-if="selectedAccount && selectedAccount.streams.length===0"
          >Seems like you don't have any streams to receive. Get someone to share some with you, or, even better, create one!</v-flex>
          <v-flex
            xs12
            class="text-xs-left"
            v-if="!selectedAccount || !selectedAccount.validated"
          >Could not access that server (is it online?) or no server selected.</v-flex>
        </v-layout>
        <!-- <v-layout row wrap align-center>
          <v-btn
            color="secondary"
            block
            :ripple="false"
            :disabled="selectedStream===null"
            @click.native="addReceiver()"
          >Create Receiver</v-btn>
        </v-layout>-->
        <v-alert :value="true" type="info" class="mt-5">
          Confused? Check out the
          <v-btn
            class="mb-1"
            @click.native="startProcess('https://speckle.systems/docs/clients/revit/basics')"
            target="_blank"
            light
            x-small
          >docs</v-btn>!
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
export default {
  name: "NewClient",
  props: {
    isVisible: { type: Boolean, default: false }
  },
  watch: {
    selectedAccount(val) {
      // todo: get streams for the account
    },
    isVisible(val) {
      if (val) {
        this.onOpen()
      }
    }
  },
  data: () => ({
    selectedAccount: null,
    selectedStream: null,
    search: ''
  }),
  methods: {
    onOpen() {
      this.selectedAccount = this.$store.state.accounts.find(
        ac => ac.IsDefault === true
      );
      this.selectedStream = null;
    },
    refreshStreamsAtAccount() {
      this.$store.dispatch("getAccountStreams", this.selectedAccount);
    },
    async addReceiver(stream) {
      let res = await this.$store.dispatch("addReceiverClient", {
        account: this.selectedAccount,
        stream: stream
      });
      this.$emit("close");
    },
    startProcess(process) {
      UiBindings.startProcess(process);
    },
  },
  mounted() {
    this.onOpen()
  },
  computed: {
    filteredStreams() {

      let streams

      if (this.search === '' || this.search === null)
        streams = this.selectedAccount.streams
      else
        streams = this.selectedAccount.streams.filter(x => x.fullName.toLowerCase().includes(this.search.toLowerCase()))

      streams = streams.sort(function (a, b) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })

      return streams.slice(0, 20)

    }
  }
};
</script>
<style scoped lang='scss'>
</style>
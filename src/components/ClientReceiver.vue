<template>
  <v-flex xs12>
    <v-card>
      <v-toolbar color="secondary text-truncate elevation-0" dark height="70">
        <v-btn fab small color="white" :depressed="!client.expired" @click.native="bakeReceiver()">
          <v-icon color="secondary">cloud_download</v-icon>
        </v-btn>
        <v-toolbar-title class="text-truncate font-weight-light ml-3">{{client.name}}</v-toolbar-title>
        <v-spacer></v-spacer>

        <!-- NOTIFICATION -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-2" v-on="on" color="red" small v-if="client.expired">lens</v-icon>
          </template>
          <span>This stream has updates that can be received</span>
        </v-tooltip>

        <!-- PREVIEW OBJECTS -->
        <v-tooltip bottom v-show="$store.state.canTogglePreview">
          <template v-slot:activator="{ on }">
            <v-btn small icon @click.native="togglePreview" v-on="on">
              <v-icon small>{{client.preview ? "visibility" : "visibility_off"}}</v-icon>
            </v-btn>
          </template>
          <span>Toggle Preview</span>
        </v-tooltip>

        <!-- SELECT OBJECTS -->
        <v-tooltip bottom v-if="$store.state.canSelectObjects">
          <template v-slot:activator="{ on }">
            <v-btn small icon @click.native="selectObjects" v-on="on">
              <v-icon small>gps_fixed</v-icon>
            </v-btn>
          </template>
          <span>Show objects</span>
        </v-tooltip>

        <!-- OPEN IN BROSWER -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              small
              @click.native="startProcess(`${client.account.RestApi.replace('api','#')}streams/${client.streamId}`)"
              target="_blank"
              v-on="on"
            >
              <v-icon small>open_in_new</v-icon>
            </v-btn>
          </template>
          <span>Open stream in web browser</span>
        </v-tooltip>

        <!-- DELETE -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn small icon @click.native="deleteClient" v-on="on">
              <v-icon small>delete</v-icon>
            </v-btn>
          </template>
          <span>Delete Sender</span>
        </v-tooltip>
      </v-toolbar>
      <v-card-text class="caption">
        <span>
          <v-icon small>developer_board</v-icon>
          {{account.ServerName}}
        </span>&nbsp;
        <span class="caption">
          <v-icon small>fingerprint</v-icon>StreamId:
          <span style="user-select:all;">
            <b>{{client.streamId}}</b>
          </span>
        </span>&nbsp;
        <span class="caption">
          <v-icon small>hourglass_full</v-icon>Last update:
          <timeago :datetime="client.updatedAt" :auto-update="60"></timeago>
        </span>
        <v-progress-linear
          v-show="client.loading"
          :active="client.loading"
          :indeterminate="client.isLoadingIndeterminate"
          height="2"
          v-model="client.loadingProgress"
          color="primary darken-1"
        ></v-progress-linear>
        <br />
        <span class="caption text--lighten-3">{{client.loadingBlurb}}</span>&nbsp;
        <span class="caption grey--text">Total objects: {{client.objects.length}}</span>
      </v-card-text>
      <!-- <v-card-actions>
          <v-btn color="secondary" :flat="!client.expired" @click.native="bakeReceiver()">
            Pull
            <v-icon small right>cloud_download</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn small flat outline icon color="error" @click.native="deleteClient">
            <v-icon small>delete</v-icon>
          </v-btn>
      </v-card-actions>-->
      <v-alert
        dismissible
        color="grey darken-2"
        v-if="client.message && client.message!== ''"
      >{{client.message}}</v-alert>
      <v-alert dismissible dense type="warning" xxxcolor="grey darken-2" v-if="client.errorMsg">
        <div row wrap class="d-flex flex-row">
          <span class="caption" v-html="client.errorMsg"></span>
          <v-btn outlined right x-small class="ml-5" v-if="client.errors" @click="showErrors=true">
            <v-icon small>more_horiz</v-icon>
          </v-btn>
        </div>
      </v-alert>
      <v-dialog v-model="showErrors" scrollable>
        <v-card>
            <v-list>
           <v-subheader>CONVERSION ERRORS</v-subheader>
              <v-list-item :two-line="err.Details" v-for="(err, i) in client.errors" :key="i">
                <v-list-item-content>
                  <v-list-item-title>{{err.Message}}</v-list-item-title>
                  <v-list-item-subtitle v-html="err.Details">{{err.Details}}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              
            </v-list>
        </v-card>
      </v-dialog>
    </v-card>
  </v-flex>
</template>
<script>
import Sockette from "sockette";

export default {
  name: "Client",
  props: {
    client: {
      type: Object,
      default: null
    }
  },
  computed: {
    account() {
      return this.$store.state.accounts.find(
        ac => ac.AccountId === this.client.AccountId
      );
    },
    updatedAt() {
      return new Date(this.client.updatedAt).toLocaleDateString();
    }
  },
  data() {
    return {
      showErrors: false,
    }
  },
  methods: {
    bakeReceiver() {
      this.$store.dispatch("bakeReceiver", this.client);
    },
    deleteClient() {
      this.$store.dispatch("removeReceiverClient", this.client);
      this.sockette.close();
    },
    selectObjects() {
      UiBindings.selectClientObjects(JSON.stringify(this.client));
    },
    togglePreview() {
      console.log(this.client)
      this.$store.commit("SET_CLIENT_DATA", {
        _id: this.client._id,
        preview: !this.client.preview
      })
      UiBindings.clientUpdated(JSON.stringify(this.client))
    },
    startProcess(process) {
      UiBindings.startProcess(process);
    },
    wsOpen(e) {
      this.sockette.json({
        eventName: "join",
        resourceType: "stream",
        resourceId: this.client.streamId
      });
    },
    wsMessage(e) {
      console.log(e.data);
      if (e.data === "ping") {
        this.sockette.send("alive");
        return;
      }
      try {
        let message = JSON.parse(e.data);
        switch (message.args.eventType) {
          case "update-global":
            this.$store.dispatch("updateClient", {
              client: this.client,
              expire: true
            });
            break;
          case "update-meta":
            this.$store.dispatch("updateClient", {
              client: this.client,
              expire: false
            });
            break;
        }
      } catch (err) {
        console.warn(
          `Could not parse/interpret ${e.data} for ${this.client.streamId}`
        );
        console.log(e.data);
      }
    },
    wsError(e) {
      console.log(e);
    },
    wsReconnect(e) {
      console.log(e);
    },
    wsClose(e) {
      console.log(e);
    }
  },
  mounted() {
    console.log("client mounted!");
    console.log(this.client);
    let wsUrl = this.account.RestApi.replace("http", "ws");
    this.sockette = new Sockette(
      `${wsUrl}?client_id=${this.client.clientId}&access_token=${
      this.account.Token
      }`,
      {
        timeout: 5e3,
        maxAttempts: 100,
        onopen: this.wsOpen,
        onmessage: this.wsMessage,
        onerror: this.wsError,
        onreconnect: this.wsReconnect,
        onclose: this.wsClose
      }
    );
  },
  beforeDestroy() {
    console.log("bye bye...");
    this.sockette.close();
  }
};
</script>
<style scoped lang='scss'>
</style>
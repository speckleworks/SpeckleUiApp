<template>
  <v-flex xs12>
    <v-hover>
      <v-card
        :class="`elevation-${client.expired ? '15' : '1'} ${client.expired ? 'expired' : ''}`"
        slot-scope="{ hover }"
      >
        <v-dialog v-model="showEditSender" scrollable fullscreen>
          <NewClientSender
            :is-visible="showEditSender"
            :is-edit="true"
            @close="showEditSender=false"
            :sender-client="client"
          ></NewClientSender>
        </v-dialog>

        <v-toolbar color="primary xxxdarken-1 text-truncate elevation-0" dark height="70">
          <v-btn fab small color="white" @click.native="startUpload()">
            <v-icon color="primary">cloud_upload</v-icon>
          </v-btn>

          <v-toolbar-title class="text-truncate font-weight-light ml-3">{{client.name}}</v-toolbar-title>
          <v-spacer></v-spacer>

          <!-- EDIT -->
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn small icon @click.native="showEditSender=true">
                <v-icon small>edit</v-icon>
              </v-btn>
            </template>
            <span>Edit Sender</span>
          </v-tooltip>

          <!-- SELECT OBJECTS -->
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn small icon @click.native="selectObjects">
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
              >
                <v-icon small>open_in_new</v-icon>
              </v-btn>
            </template>
            <span>Open stream in web browser</span>
          </v-tooltip>

          <!-- DELETE -->
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn small icon @click.native="deleteClient">
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
            :active="client.loading"
            :indeterminate="client.isLoadingIndeterminate"
            height="2"
            v-model="client.loadingProgress"
            color="primary darken-1"
          ></v-progress-linear>
          <span class="caption text--lighten-3">{{client.loadingBlurb}}</span>&nbsp;
          <span class="caption grey--text">Total objects: {{client.objects.length}}</span>
        </v-card-text>
        <!-- <v-card-text class="caption text--lighten-3">{{client.message}}</v-card-text> -->
        <v-card-actions>
          <!-- <v-btn :flat="!client.expired" @click.native="startUpload()" color="primary">
            Push
            <v-icon small right>cloud_upload</v-icon>
          </v-btn>

          <v-btn :flat="!client.expired" @click.native="showEditSender=true">
            Edit
            <v-icon small right>edit</v-icon>
          </v-btn>-->

          <!-- <v-btn
            small
            round
            :disabled="$store.state.selectionCount===0"
            @click.native="addSelection()"
          >
            add
            <v-icon right>add</v-icon>
          </v-btn>&nbsp;
          <v-btn
            small
            round
            :disabled="$store.state.selectionCount===0"
            @click.native="removeSelection()"
          >
            remove
            <v-icon right>remove</v-icon>
          </v-btn>&nbsp;&nbsp;-->
          <span class="caption grey--text">{{$store.state.selectionCount}} selected objects</span>

          <v-spacer></v-spacer>
          <!-- <v-btn small flat outline icon color="error" @click.native="deleteClient">
            <v-icon small>delete</v-icon>
          </v-btn>-->
        </v-card-actions>
        <v-alert
          v-model="client.expired"
          dismissible
          color="grey darken-2"
          v-if="client.message && client.message!== ''"
        >{{client.message}}</v-alert>
        <v-alert
          v-model="client.errors"
          dismissible
          type="warning"
          xxxcolor="grey darken-2"
          v-if="client.errors && client.errors!== ''"
        >{{client.errors}}</v-alert>
      </v-card>
    </v-hover>
  </v-flex>
</template>
<script>
import Sockette from "sockette";
import NewClientSender from './NewClientSender.vue'

export default {
  name: "SenderClient",
  components: {
    NewClientSender,
  },
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
  watch: {
    "client.loading"(val, oldVal) {
      if (!val && this.sendStarted) this.broadcastSendEnd();
    },
    client: {
      handler(val, oldVal) {
        console.log(val);
      },
      deep: true
    }
  },
  data: () => ({
    sendStarted: false,
    showEditSender: false
  }),
  methods: {
    startUpload() {
      this.sendStarted = true;
      this.$store.dispatch("cloneStream", this.client);
      this.client.updatedAt = new Date().toISOString();
      this.client.message = "";
      this.client.expired = false;
      UiBindings.updateSender(JSON.stringify(this.client));
    },
    deleteClient() {
      this.$store.dispatch("removeReceiverClient", this.client);
      this.sockette.close();
    },
    broadcastSendEnd() {
      this.sendStarted = false;
      this.sockette.json({
        eventName: "broadcast",
        resourceType: "stream",
        resourceId: this.client.streamId,
        args: {
          eventType: "update-global"
        }
      });
    },
    addSelection() {
      UiBindings.addSelectionToSender(JSON.stringify(this.client));
    },
    removeSelection() {
      UiBindings.removeSelectionFromSender(JSON.stringify(this.client));
    },
    selectObjects() {
      UiBindings.selectClientObjects(JSON.stringify(this.client));
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
    this.sockette.close();
  }
};
</script>
<style scoped lang='scss'>
.expired {
  // border-left: 12px solid red;
}
</style>
<template>
  <v-app>
    <v-app-bar app v-if="!showNotEmbeddError">
      <v-toolbar-title class="headline text-uppercase mx-0 pa-0">
        <span @click="showDev()">Speckle</span>
        <span class="font-weight-light">{{$store.state.hostAppName}}</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn 
      @click="showAccountsPopup()" 
      color="grey" 
      dark 
      absolute 
      bottom 
      right 
      fab 
      :ripple="false" 
      style="margin-right:120px">
        <v-icon>account_circle</v-icon>
      </v-btn>
      <v-btn
        color="secondary"
        v-show="$store.state.accounts.length>0"
        dark
        absolute
        bottom
        right
        fab
        :ripple="false"
        @click.native="showAddNewReceiver=true"
      >
        <v-icon>cloud_download</v-icon>
      </v-btn>
      <v-btn
        color="primary"
        v-show="$store.state.accounts.length>0"
        absolute
        bottom
        right
        fab
        :ripple="false"
        @click.native="showAddNewSender=true"
        style="margin-right:60px"
      >
        <v-icon>cloud_upload</v-icon>
      </v-btn>
    </v-app-bar>
    <v-dialog v-model="showAddNewReceiver" scrollable xxxfullscreen v-if="!showNotEmbeddError">
      <NewClient :is-visible="showAddNewReceiver" @close="showAddNewReceiver=false"></NewClient>
    </v-dialog>
    <v-dialog v-model="showAddNewSender" scrollable xxxfullscreen v-if="!showNotEmbeddError">
      <NewClientSender :is-visible="showAddNewSender" @close="showAddNewSender=false"></NewClientSender>
    </v-dialog>
    <v-content v-if="!showNotEmbeddError">
      <v-container grid-list-md pa-0>
        <v-layout row wrap v-show="$store.state.accounts.length===0">
          <v-flex xs12>
            <v-card color="primary" dark>
              <v-img contain src="https://robohash.org/specklesucks" height="210"></v-img>
              <v-card-text class="text-sm-center white--text">
                <b>Howdy, stranger!</b> Seems you have no speckle accounts yet.
                <v-btn block class="mt-2" @click.native="showAccountsPopup()">add an account</v-btn>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
        <v-layout row wrap>
          <v-flex xs12 md6 pa-4 xxxv-if="receivers.length>0">
            <span class="headline text-uppercase secondary--text">Receivers</span>
            <v-divider class="my-4 secondary"></v-divider>
            <span class v-if="receivers.length===0">There are no receiver clients in this file.</span>
            <v-container grid-list-xl>
              <v-layout row wrap>
                <client-receiver
                  v-for="client in receivers"
                  :key="client.streamId + ":" + client.AccountId"
                  :client="client "
                ></client-receiver>
              </v-layout>
            </v-container>
          </v-flex>
          <v-flex xs12 md6 pa-4>
            <span class="headline text-uppercase primary--text">Senders</span>
            <v-divider class="my-4 primary"></v-divider>
            <span class v-if="senders.length===0">There are no sender clients in this file.</span>
            <v-container grid-list-xl>
              <v-layout row wrap>
                <client-sender
                  v-for="client in senders"
                  :key="client.streamId + ":" + client.AccountId"
                  :client="client"
                >{{client}}</client-sender>
              </v-layout>
            </v-container>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
    <v-dialog v-model="showNotEmbeddError" persistent width="500">
      <v-card>
        <v-card-title
          class="headline primary white--text"
          primary-title
        >Ouups. This Speckle Ui is not embedded.</v-card-title>
        <v-img src="https://robohash.org/speckled" height="210" contain></v-img>
        <v-card-text class="mt-5">
          See, we're looking for this
          <code>UiBindings</code> object, that should connect this ui to its subsequent model and we can't find it. Don't worry. It's not your fault.
          If you're confused, reach out below:
        </v-card-text>
        <v-card-text class="text-sm-center">
          <v-btn
            large
            rounded
            color
            style="width: 200px"
            class="mt-2"
            :href="$store.state.slackInviteUrl"
            target="_blank"
          >
            Slack
            <v-icon right>question_answer</v-icon>
          </v-btn>
          <br />
          <v-btn
            large
            rounded
            color
            style="width: 200px"
            class="mt-3"
            href="https://discourse.speckle.works"
            target="_blank"
          >
            Forum
            <v-icon right>speaker_notes</v-icon>
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app>
</template>
<script>
import HelloWorld from './components/HelloWorld'
import NewClient from './components/NewClient.vue'
import NewClientSender from './components/NewClientSender.vue'
import ClientReceiver from './components/ClientReceiver.vue'
import ClientSender from './components/ClientSender.vue'
var pluralize = require('pluralize')

export default {
  name: 'App',
  components: {
    HelloWorld,
    NewClient,
    NewClientSender,
    ClientReceiver,
    ClientSender
  },
  computed: {
    receivers() {
      return this.$store.state.clients.filter(cl => cl.type === 'receiver')
    },
    senders() {
      return this.$store.state.clients.filter(cl => cl.type === 'sender')
    }
  },
  data() {
    return {
      showAddNewReceiver: false,
      showAddNewSender: false,
      showNotEmbeddError: false
    }
  },
  methods: {
    showDev() {
      console.log('showing dev')
      UiBindings.showDev()
    },
    showAccountsPopup() {
      UiBindings.showAccountsPopup()
    }
  },
  mounted() {
    console.log('app mounted!')
    if (typeof UiBindings === 'undefined' || UiBindings === null) {
      this.showNotEmbeddError = true
      return
    }

    this.$store.dispatch('getAccounts')
    this.$store.dispatch('getApplicationHostName')
    this.$store.dispatch('getExistingClients')
  }
}
</script>
<style>
.theme--light.v-card > .v-card__text {
  color: #000 !important;
}
</style>
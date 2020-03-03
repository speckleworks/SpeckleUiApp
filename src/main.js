import Vue from 'vue'
import vuetify from './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import Axios from 'axios'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.config.productionTip = false

import VueTimeago from 'vue-timeago'
Vue.use( VueTimeago, {
  name: 'Timeago',
  locale: 'en',
} )

// if IE <= 11, disable REST caching since IE has caching problems
let ua = window.navigator.userAgent
if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/' > 0)) {
  Axios.defaults.headers.common[ 'Cache-Control' ] = 'no-cache, no-store'
  Axios.defaults.headers.common[ 'Pragma' ] = 'no-cache'
  Axios.defaults.headers.common[ 'Expires' ] = '0'
}

// set up an event bus on the window, to be used by the SpeckleUiBindings class to send events here
window.EventBus = new Vue( )

// generic route used for quite a bit of comms
window.EventBus.$on( 'update-client', args => {
  let cl = JSON.parse( args )
  console.log( cl )
  window.Store.commit( 'SET_CLIENT_DATA', cl )
} )

// keeps track of the selected objects count
window.EventBus.$on( 'update-selection-count', args => {
  let parsed = JSON.parse( args )
  if ( window.Store )
    window.Store.commit( "SET_SELECTION_COUNT", parsed.selectedObjectsCount )
} )

// keeps track of the selected objects
window.EventBus.$on('update-selection', args => {
  let parsed = JSON.parse(args)
  if (window.Store)
    window.Store.commit("SET_SELECTION_OBJECTS", parsed.selectedObjects)
})

window.Store = store
window.app = new Vue( {
  router,
  store,
  vuetify,
  render: h => h( App )
} ).$mount( '#app' )
'use strict'

const fs = require('fs-extra')

if (!fs.existsSync('./conf/config.js')) {
  fs.copySync('./conf/config.example.js', './conf/config.js')
}

const config = require('./conf/config')

const requestWorker = require('./src/requestWorker')
const ProxmoxApi = require('./src/ProxmoxApi')

async function run () {
  const api = new ProxmoxApi()
  api.username = config.proxmoxUser
  api.password = config.proxmoxPassword

  if (config.proxmoxHosts.length === 0) {
    api.baseUrl = `https://${config.proxmoxApiServer}.${config.proxmoxDomain}:8006/api2/json`
  } else {
    api.baseUrl = `https://${config.proxmoxHosts[0]}:8006/api2/json`
  }

  await api.login()
  const nodes = await api.getNodes()
  config.updateProxmoxNodes(nodes['data'], /* persist */ true)

  requestWorker.stopWorker()
}

run()

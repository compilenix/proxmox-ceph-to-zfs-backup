const fs = require('fs-extra')

if (!fs.existsSync('./conf/config.js')) {
  fs.copySync('./conf/config.example.js', './conf/config.js')
}

const config = require('./conf/config')

// const logging = require('./src/logging')
const requestWorker = require('./src/requestWorker')

async function run () {
  const options = {
    method: 'POST',
    url: `${config.proxmoxApi}/access/ticket`,
    form: {
      username: config.proxmoxUser,
      password: config.proxmoxPassword
    }
  }

  const result = await requestWorker.request(options)
  const ticket = JSON.parse(result.response.body)
  config.proxmoxCookies.setCookie(`PVEAuthCookie=${ticket['data']['ticket']}`, `${config.proxmoxApi}/`)
  config.defaultRequestOptions.headers['CSRFPreventionToken'] = ticket['data']['CSRFPreventionToken']

  const nodes = await requestWorker.request({
    method: 'GET',
    url: `${config.proxmoxApi}/nodes`
  })
  console.log(nodes.body)

  requestWorker.stopWorker()
}

run()

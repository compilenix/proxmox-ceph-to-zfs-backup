const request = require('request') // eslint-disable-line
const FileCookieStore = require('tough-cookie-filestore')
const fs = require('fs-extra')

class Config {
  configure () {
    this.proxmoxApiServer = 'proxmox-server-01'
    this.proxmoxDomain = 'home.local'
    this.proxmoxUser = 'proxmoxUserName@pve'
    this.proxmoxPassword = 'S4CAzI45tDu5g9YNVh20FhvzEUkHwj'
    this.requestUserAgent = `${this.packageJson.name}/${this.packageJson.version} (${this.packageJson.repository.url})`

    this.debugLoggging = [
      'index',
      'ProxmoxApi'
    ]

    this.infoLoggging = [
      'index',
      'requestWorker',
      'ProxmoxApi'
    ]

    this.errorLogggingDisable = [
      // 'index',
      // 'requestWorker',
    ]
  }

  constructor () {
    // @ts-ignore
    this.packageJson = require('../package.json')
    this.waitBetweenRequests = 100

    this.configure()
    this.proxmoxHosts = []

    if (fs.existsSync('./conf/nodes.json')) {
      const nodes = fs.readJsonSync('./conf/nodes.json')
      this.updateProxmoxNodes(nodes)
    }

    if (!fs.existsSync('temp')) fs.ensureDirSync('temp')
    if (!fs.existsSync('temp/cookies.json')) fs.ensureFileSync('temp/cookies.json')
    this.proxmoxCookies = request.jar(new FileCookieStore('temp/cookies.json'))

    /** @type {(request.UrlOptions & request.CoreOptions) | (request.UriOptions & request.CoreOptions & request.UrlOptions)} */
    this.defaultRequestOptions = {
      method: 'GET',
      url: null,
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': this.requestUserAgent,
        'Accept': 'application/json,text/html;q=0.9,text/plain,*/*;q=0.8',
        'Accept-Language': 'en'
      },
      gzip: true,
      jar: this.proxmoxCookies,
      maxRedirects: 10,
      rejectUnauthorized: false
    }
  }

  updateProxmoxNodes (nodes, persist = false) {
    for (const node of nodes) {
      if (node['status'] !== 'online') continue
      this.proxmoxHosts.push(`${node['node']}.${this.proxmoxDomain}`)
    }

    this.proxmoxHosts.sort(() => 0.5 - Math.random())

    if (persist) fs.writeFileSync('./conf/nodes.json', JSON.stringify(nodes, null, 2))
  }
}

module.exports = new Config()

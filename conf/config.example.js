const request = require('request') // eslint-disable-line
const FileCookieStore = require('tough-cookie-filestore')
const fs = require('fs-extra')

class Config {
  configure () {
    this.proxmoxApi = 'https://192.168.1.10:8006/api2/json'
    this.proxmoxUser = 'proxmoxUserName@pve'
    this.proxmoxPassword = ''
    this.requestUserAgent = `${this.packageJson.name}/${this.packageJson.version} (${this.packageJson.repository.url})`

    this.debugLoggging = [
      'index',
      'requestWorker'
    ]

    this.infoLoggging = [
      'index',
      'requestWorker'
    ]

    this.errorLogggingDisable = [
      // 'index',
      // 'requestWorker',
    ]
  }

  constructor () {
    // @ts-ignore
    this.packageJson = require('../package.json')
    this.waitBetweenRequests = 10

    this.configure()

    if (!fs.existsSync('temp')) fs.ensureDirSync('temp')
    if (!fs.existsSync('temp/cookies.json')) fs.ensureFileSync('temp/cookies.json')
    this.proxmoxCookies = request.jar(new FileCookieStore('temp/cookies.json'))

    /** @type {(request.UrlOptions & request.CoreOptions) | (request.UriOptions & request.CoreOptions & request.UrlOptions)} */
    this.defaultRequestOptions = {
      method: 'GET',
      url: `${this.proxmoxApi}/`,
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': this.requestUserAgent,
        'Accept': 'application/json,text/html;q=0.9,text/plain,*/*;q=0.8',
        'Referer': '',
        'Accept-Language': 'en'
      },
      gzip: true,
      jar: this.proxmoxCookies,
      maxRedirects: 10,
      rejectUnauthorized: false
    }
  }
}

module.exports = new Config()

const { URL } = require('url')

const moment = require('moment')

const log = require('./logging')
const requestWorker = require('./requestWorker')
const config = require('../conf/config')

class ProxmoxApi {
  baseUrl = ''
  username = ''
  password = ''

  async isSignedIn () {
    const result = await requestWorker.request({
      method: 'GET',
      url: `${this.baseUrl}`
    })

    const isSignedIn = result.response.statusCode !== 401
    log.debug(`Proxmox API session is valid / signed-in: ${isSignedIn}`)
    return isSignedIn
  }

  /**
   * @returns {Promise<boolean>} if login succeded
   */
  async login () {
    if (await this.isSignedIn()) return true

    const options = {
      method: 'POST',
      url: `${this.baseUrl}/access/ticket`,
      form: {
        username: this.username,
        password: this.password
      }
    }

    log.info(`Sign-In to ${new URL(this.baseUrl).hostname}`)
    const result = await requestWorker.request(options)

    if (result.response.statusCode !== 200) return false
    const ticket = JSON.parse(result.response.body)
    config.proxmoxCookies.setCookie(`PVEAuthCookie=${ticket['data']['ticket']}`, `${this.baseUrl}/`)
    config.defaultRequestOptions.headers['CSRFPreventionToken'] = ticket['data']['CSRFPreventionToken']

    log.info(`Sign-In to ${new URL(this.baseUrl).hostname} succeded!`)
    return true
  }

  /**
   * @throws {Error} if not signed-in
   */
  async getNodes () {
    if (!await this.isSignedIn()) throw new Error('not signed-in')

    log.info(`Get nodes`)
    return JSON.parse((await requestWorker.request({
      method: 'GET',
      url: `${this.baseUrl}/nodes`
    })).body)
  }
}

module.exports = ProxmoxApi

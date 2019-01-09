const request = require('request')
const moment = require('moment')

const log = require('./logging')

const config = require('../conf/config.js')

function sleep (/** @type {Number} */ ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

class RequestTask {
  constructor () {
    /** @type {(request.UrlOptions & request.CoreOptions) | (request.UriOptions & request.CoreOptions & request.UrlOptions)} */
    this.options = undefined
    this.piped = false
    /** @param {TaskResponse} response */
    this.callback = response => { }
  }
}

class TaskResponse {
  constructor () {
    this.error = undefined
    /** @type {request.Response} */
    this.response = undefined
    this.body = undefined
    this.piped = false
  }
}

/** @type {RequestTask[]} */
let tasks = []
/** @type {RequestTask[]} */
let tasksToEnqueue = []
let workerRunning = false
let workerIsWaiting = false
/** @type {NodeJS.Timer} */
let worker
let timestampSinceLastQueueRun = moment()

async function processQueue () {
  workerRunning = true
  for (let index = 0; index < tasksToEnqueue.length; index++) {
    const task = tasksToEnqueue.shift()
    tasks.push(task)
    log.debug(`worker has enqueued a task for ${task && task.options && task.options.url ? task.options.url : undefined}`)
  }

  if (tasks.length === 0) return
  if (workerIsWaiting) return
  workerIsWaiting = true
  log.debug(`Seconds since last queue run: ${moment.duration(moment().diff(timestampSinceLastQueueRun)).asSeconds()}`)
  timestampSinceLastQueueRun = moment()

  const task = tasks.shift()
  if (!task || !task.options || !task.options.url) {
    const res = new TaskResponse()
    res.error = 'task.options or task.options.url is not defined'

    if (typeof task.callback === 'function') {
      process.nextTick(() => task.callback(res))
    }

    workerIsWaiting = false
    log.error('worker has stoped processing task', res.error)
    return
  }

  log.info(`worker is processing task: HTTP ${task.options.method} ${task.options.url}`)

  return new Promise((resolve, reject) => {
    /**
    * @type {request.RequestCallback}
    */
    function callback (error, response, body) {
      const res = new TaskResponse()
      res.error = error
      res.response = response
      res.body = body

      process.nextTick(() => task.callback(res))
      workerIsWaiting = false
      log.info(`worker is done processing task: HTTP ${task.options.method} ${task.options.url} -> ${res.response.statusCode} ${res.response.statusMessage}`)
      return resolve()
    }

    const options = Object.assign(Object.assign({ }, config.defaultRequestOptions), task.options)

    try {
      if (task.piped) {
        let res = request(options)
        process.nextTick(() => task.callback(res)) // TODO: ???
        workerIsWaiting = false
        log.info(`worker is done processing task: HTTP ${task.options.method} ${task.options.url} -> ${res.response.statusCode} ${res.response.statusMessage}`)
        return resolve(res)
      } else {
        request(options, callback)
      }
    } catch (error) {
      const res = new TaskResponse()
      res.error = error
      process.nextTick(() => task.callback(res))
      workerIsWaiting = false
      log.error('worker has stoped processing task', res.error)
      log.info(`worker is done processing task: HTTP ${task.options.method} ${task.options.url} -> ${res.response.statusCode} ${res.response.statusMessage}`)
      return resolve()
    }
  })
}

/**
 * @param {(request.UrlOptions & request.CoreOptions) | (request.UriOptions & request.CoreOptions & request.UrlOptions)} options
 * @param {boolean} piped set to true if you want to stream the response: request('...').pipe(...)
 * @returns {Promise<TaskResponse>}
 */
module.exports.request = async function (options, piped = false) {
  if (!workerRunning) {
    log.debug('worker was stopped and will be started now')
    worker = setInterval(async () => {
      await processQueue()
      await sleep(config.waitBetweenRequests)
    }, config.waitBetweenRequests)
    workerRunning = true
  }

  return new Promise((resolve, reject) => {
    const task = new RequestTask()
    task.piped = piped
    task.options = options
    task.callback = response => {
      if (!response || response.error) return reject(response)
      return resolve(response)
    }
    tasksToEnqueue.push(task)
  })
}

module.exports.stopWorker = function () {
  if (workerRunning || worker) {
    log.info('stopWorker(): was running and will be stopped now')
    clearInterval(worker)
    workerRunning = false
  } else {
    log.info('stopWorker(): was not running')
  }
}

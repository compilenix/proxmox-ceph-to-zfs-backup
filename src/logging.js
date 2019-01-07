const path = require('path')

const moment = require('moment')
const stackTrace = require('stack-trace')

const config = require('../conf/config.js')

function getDateString () {
  return moment().toDate().toUTCString()
}

function getCallerFileName () {
  if (stackTrace.get().length < 2) return null
  return path.parse(stackTrace.get()[2].getFileName()).name
}

/** @param {string} message */
module.exports.debug = message => {
  const callerFileName = getCallerFileName()

  if (!callerFileName) {
    console.debug(`[${getDateString()}] DEBUG ${message}`)
    return
  }

  if (config.debugLoggging.indexOf(callerFileName) >= 0) console.debug(`[${getDateString()}] DEBUG ${callerFileName}: ${message}`)
}

/** @param {string} message */
module.exports.info = message => {
  const callerFileName = getCallerFileName()

  if (!callerFileName) {
    console.log(`[${getDateString()}] INFO ${message}`)
    return
  }

  if (config.infoLoggging.indexOf(callerFileName) >= 0) console.log(`[${getDateString()}] INFO ${callerFileName}: ${message}`)
}

/** @param {string} message */
/** @param {Error} error */
module.exports.error = (message, error = null) => {
  const callerFileName = getCallerFileName()

  if (!callerFileName) {
    console.error(`[${getDateString()}] ERROR ${message}`)
    return
  }

  let errorString = ''
  if (error !== null) errorString = `:\n${JSON.stringify(error, null, 2)}`
  if (config.errorLogggingDisable.indexOf(callerFileName) < 0) {
    if (error === null) {
      console.error(`[${getDateString()}] ERROR ${callerFileName}: ${message}${errorString}`)
    } else {
      console.error(`[${getDateString()}] ERROR ${callerFileName}: ${message}${errorString}`, error)
    }
  }
}

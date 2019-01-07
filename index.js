const fs = require('fs-extra')

if (!fs.existsSync('./conf/config.js')) {
  fs.copySync('./conf/config.example.js', './conf/config.js')
}

const config = require('./conf/config.js')

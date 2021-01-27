const fs = require('fs')
const axios = require('axios')

const error_types = {
  M3U8: "m3u8 Error",
  PARENT: "Parent Error",
  WORKER: "Worker Error",
  SAVE: "Save Error"
}

function currentTime() {
  const d = new Date()
  const month = (d.getMonth() + 1).toString();
  const date = d.getDate().toString()
  const hour = d.getHours().toString()
  const minute = d.getMinutes().toString()
  const second = d.getSeconds().toString()

  return {
    year: d.getFullYear().toString(),
    month: month[1] ? month : "0" + month[0],
    date: date[1] ? date : "0" + date[0],
    hour: hour[1] ? hour : "0" + hour[0],
    minute: minute[1] ? minute : "0" + minute[0],
    second: second[1] ? second : "0" + second[0],
  }
}

async function download(url) {
  const res = await axios({
    method: 'get',
    url: url,
    timeout: 5000,
    responseEncoding: 'binary'
  })

  return res.data
}

function saveStream(success, path, stream, filename) {
  fs.writeFile(`${path}${filename}`, stream, { encoding: "binary" }, (err) => {
    if (err) {
      console.log(err)
      // handleError(path, err, errors.SAVE, filename)
    } else {
      console.log(`saved ${filename}`)
      success.add(filename)
    }
  })
}

function handleError(path, err, type, filename) {
  console.error(`failed download ${filename}`)
  const now = currentTime()
  const timestamp = `${now.year}-${now.month}-${now.date} ${now.hour}:${now.minute}:${now.second}`
  logError(path, `${timestamp}-[${type}]-[${filename}]-[${err.message}]\r\n`)
}


function logError(path, message) {
  fs.appendFile(`${path}error.log`, message, function (err) {
    if (err) console.error("Cannot append error!")
  });
}

module.exports = {
  saveStream: saveStream,
  handleError: handleError,
  download: download,
  // errors: error_types,
  currentTime: currentTime
}
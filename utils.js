const fs = require('fs')
const axios = require('axios')

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
      handleError(err, filename)
    } else {
      console.log(`saved ${filename}`)
      success.add(filename)
    }
  })
}

function handleError(err, filename) {
  console.error(err.message)
  console.error(`failed download ${filename}`)
}

module.exports = {
  saveStream: saveStream,
  handleError: handleError,
  download: download
}
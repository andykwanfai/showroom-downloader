const axios = require('axios');
const fs = require('fs')

const m3u8_url = "https://hls-origin277.showroom-cdn.com/liveedge/89e33e4d29fc5666cbde5e908f14e1e9394676cb731f0864a61cd041fb91afa7/chunklist.m3u8"

const url = m3u8_url.replace("chunklist.m3u8", "")

const dir = `R:/`

const folder = `showroom-${Date.now()}/`

let path = `${dir}${folder}`

const pastStream = 50
const retry = 5
const success = new Set()
const failed = new Set()
const cur_fail = {}

let startIndex

async function download(url) {
  // try {
  const res = await axios({
    method: 'get',
    url: url,
    timeout: 5000,
    responseEncoding: 'binary'
  })

  return res.data
  // } catch (err) {
  //   console.log("down error")
  // }
}

saveStream = (stream, filename) => {
  fs.writeFile(`${path}${filename}`, stream, { encoding: "binary" }, (err) => {
    if (err) {
      handleError(err, filename)
    } else {
      success.add(filename)
      console.log(`saved ${filename}`)
    }
  })
}

handleError = (err, filename, index) => {
  if (index > startIndex - pastStream) {
    if (cur_fail[index]) {
      cur_fail[index] = cur_fail[index] + 1
    } else {
      cur_fail[index] = 1
    }
  }
  console.log(err.message)
  console.log(`failed download ${filename}`)
}

//get m3u8 and return stream list
async function getStreamList() {
  try {
    const m3u8 = await download(m3u8_url)
    return m3u8.match(/media_\d+.ts/g)
  } catch (err) {
    console.log("cannot get m3u8 file")
  }
}

//try to download past 30 streams
async function oldStreamRecover(start) {
  for (let i = start - pastStream > 0 ? start - pastStream : 1; i < start; i++) {
    const filename = `media_${i}.ts`
    try {
      const stream = await download(url + filename)
      saveStream(stream, filename)
      console.log(`Recover ${filename}`)
    } catch (err) {
      handleError(err, filename, i)
      // console.log("fail recover" + filename)
    }
  }
}

async function failureRecover() {
  for (const [key, value] of Object.entries(cur_fail)) {
    const filename = `media_${key}.ts`
    try {
      const stream = await download(url + filename)
      saveStream(stream, filename)
      delete cur_fail[key]
    } catch (err) {
      cur_fail[key] = value + 1
      if (value + 1 > retry) {
        if (key >= startIndex) {
          failed.add(filename)
        }
        delete cur_fail[key]
      }
    }
  }
  console.log(cur_fail)
  console.log(failed)
}

async function downloadStream() {
  try {
    const streamList = await getStreamList()
    streamList.forEach(async filename => {
      if (!success.has(filename)) {
        try {
          const stream = await download(url + filename)
          saveStream(stream, filename)
        } catch (err) {
          handleError(err, filename)
        }
      }
    });
  } catch (err) {
    console.log("cannot download stream")
  }
}

function logError() {

}

async function main() {
  //create folder
  try {
    fs.mkdirSync(path)
  } catch (err) {
    console.log(err.message)
    //if err, create folder in current working dir
    // fs.mkdirSync(folder)
    // path = folder
  }

  try {
    const streamList = await getStreamList()
    startIndex = streamList[0].match(/\d+/g)[0]
  } catch (err) {
    console.log(err.message)
    console.log("Cannot recover old streams")
  }
  console.log("start: " + startIndex)
  oldStreamRecover(startIndex)
  setInterval(failureRecover, 200);
  setInterval(downloadStream, 1500);
}


main()
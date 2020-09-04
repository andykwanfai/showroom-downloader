const axios = require('axios');
const fs = require('fs')

const m3u8_url = "https://hls-origin277.showroom-cdn.com/liveedge/89e33e4d29fc5666cbde5e908f14e1e9394676cb731f0864a61cd041fb91afa7/chunklist.m3u8"

const url = m3u8_url.replace("chunklist.m3u8", "")

const dir = `R:/`

const folder = `showroom-${Date.now()}/`

let path = `${dir}${folder}`


const success = new Set()
const fail = new Set()

let start

async function download(url) {
  const res = await axios({
    method: 'get',
    url: url,
    timeout: 5000
  })
  return res.data
}

handleError = (err, filename) => {
  fail.add(filename)
  console.log(err.message)
  console.log(`failed download ${filename}`)
}

async function getStream(filename) {
  // setTimeout(async () => {
  try {
    const stream = await download(url + filename)
    fs.writeFile(`${path}${filename}`, stream, (err) => {
      if (err) {
        handleError(err, filename)
      } else {
        success.add(filename)
        console.log(`downloaded ${filename}`)
      }
    })
  } catch (err) {
    handleError(err, filename)
  }

  // }, 1000);
}

getStreamList = (m3u8) => {
  const list = m3u8.match(/media_\d+.ts/g)
  return list
}


async function oldStreamRecover() {

}

async function failureRecover() {

}

async function downloadStream() {

}

function main() {
  try {
    fs.mkdirSync(path)
  } catch (err) {
    console.log(err.message)
    //if err, create folder in current working dir
    // fs.mkdirSync(folder)
    // path = folder
  }
  setInterval(async () => {
    let m3u8
    try {
      m3u8 = await download(m3u8_url)
    } catch (err) {
      console.log(err.message)
      return
    }
    const fileList = getStreamList(m3u8)

    if (!start) {
      start = fileList[0].match(/\d+/g)[0]
    }
    // console.log(start)
    fileList.forEach(filename => {
      if (!success.has(filename)) {
        getStream(filename)
      }
    });
  }, 1500);
}


main()
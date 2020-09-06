const fs = require('fs')
const { Worker } = require('worker_threads')
const { download, saveStream, handleError } = require('./utils')

const srdler = () => {
  const input_url = process.argv.slice(2)[0] ? process.argv.slice(2)[0] : ""

  let m3u8_url
  let media_url_prefix

  const dir = process.argv.slice(2)[1] ? process.argv.slice(2)[1] : "R:/"

  const folder = `showroom-${Date.now()}/`

  const path = `${dir}${folder}`

  const success = new Set()

  let current

  return async function main() {

    init()

    if (input_url.includes("www.showroom-live.com")) {
      while (true) {
        const res = await download(input_url)
        const room_id = res.match(/room_id=\d+/g)[0].substring(8)
        if (room_id) {
          const res = await download(`https://www.showroom-live.com/api/live/streaming_url?room_id=${room_id}`)
          if (Object.keys(res).length !== 0) {
            m3u8_url = res.streaming_url_list[0].url
            console.log(m3u8_url)
            break
          }
        }
        console.log("waiting live stream start")
        await delay(2000)
      }
    }

    media_url_prefix = m3u8_url.replace("chunklist.m3u8", "")

    oldStreamRecover()
    setInterval(oldStreamRecover, 5000)
    setInterval(downloadStream, 1500);
  }

  function init() {

    m3u8_url = input_url

    //create folder
    try {
      fs.mkdirSync(path)
    } catch (err) {
      console.log(err.message)
      //if err, create folder in current working dir
      // fs.mkdirSync(folder)
      // path = folder
    }
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

  async function oldStreamRecover() {
    let current
    try {
      const streamList = await getStreamList()
      console.log(streamList)
      current = streamList[0].match(/\d+/g)[0]
    } catch (err) {
      console.log(err.message)
      console.log("Cannot recover old streams")
    }
    const worker = new Worker('./worker.js', {
      workerData: {
        media_url_prefix, success, current, path
      }
    })

    worker.once('message', (recover) => {
      console.log("recover" + recover)
      recover.forEach((e) => success.add(e))
    })
    console.log(success)
  }

  async function downloadStream() {
    console.log(success)
    try {
      const streamList = await getStreamList()
      streamList.forEach(async filename => {
        if (!success.has(filename)) {
          try {
            // throw Error("mannual error")
            const stream = await download(media_url_prefix + filename)
            saveStream(success, path, stream, filename)
          } catch (err) {
            handleError(err, filename)
          }
        }
      });
    } catch (err) {
      console.error("downloadStrem: cannot download")
    }
  }


  function delay(delayInms) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
  }
  // logError() {

  // }

}

const dler = srdler()
dler()
const fs = require('fs')
const { Worker } = require('worker_threads')
const process = require('process');
const { download, saveStream, handleError, errors, currentTime } = require('./utils')

const srdler = () => {
  const input_url = process.argv.slice(2)[0] ? process.argv.slice(2)[0] : ""

  let m3u8_url
  let media_url_prefix

  const dir = process.argv.slice(2)[1] ? process.argv.slice(2)[1] : "R:/"

  const folder = `showroom-${Date.now()}/`

  let path = `${dir}${folder}`

  const success = new Set()

  return async function main() {

    await init()

    oldStreamRecover()
    setInterval(oldStreamRecover, 10000)
    setInterval(downloadStream, 1500);




    process.on('SIGINT', async () => {
      const files = fileCheck()
      fs.appendFileSync(`${path}file.txt`, files)
      console.log(`ffmpeg -f concat -i ${path}file.txt -c copy ${path}output.mp4`)
      process.exit()
    })
  }

  function fileCheck() {
    let string = ""
    const missing = []
    for (let i = 1; success.size > 0; i++) {
      const filename = `media_${i}.ts`
      if (success.has(filename)) {
        string += `file '${filename}'\r\n`
        success.delete(filename)
      } else {
        missing.push(filename)
      }
    }
    console.log("missing: " + missing)
    return string
  }

  async function init() {
    const now = currentTime()
    const timestamp = `${now.year}${now.month}${now.date}`

    m3u8_url = input_url

    //wait for the live stream start
    if (input_url.includes("www.showroom-live.com")) {
      path = `${dir}${timestamp}-showroom-${input_url.replace(/http.*www\.showroom-live\.com\//g, "")}/`
      while (true) {
        const res = await download(input_url)
        const room_id = res.match(/room_id=\d+/g)[0].substring(8)
        if (room_id) {
          const res = await download(`https://www.showroom-live.com/api/live/streaming_url?room_id=${room_id}`)
          if (Object.keys(res).length !== 0) {
            console.log(res.streaming_url_list)
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
      handleError(path, err, errors.M3U8)
    }
  }

  async function oldStreamRecover() {
    let current
    try {
      const streamList = await getStreamList()
      current = streamList[0].match(/\d+/g)[0]
    } catch (err) {
      handleError(path, err, errors.M3U8)
    }
    const worker = new Worker('./worker.js', {
      workerData: {
        media_url_prefix, success, current, path
      }
    })

    worker.once('message', (recover) => {
      console.log("recover: " + recover)

      recover.forEach((e) => success.add(e))
    })
  }

  async function downloadStream() {
    let streamList
    try {
      streamList = await getStreamList()
    }
    catch (err) {
      return handleError(path, err, errors.M3U8)
    }
    streamList.forEach(async filename => {
      if (!success.has(filename)) {
        try {
          const stream = await download(media_url_prefix + filename)
          saveStream(success, path, stream, filename)
        } catch (err) {
          handleError(path, err, errors.PARENT, filename)
        }
      }
    });
  }

  function delay(delayInms) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(2);
      }, delayInms);
    });
  }
}

const dler = srdler()
dler()
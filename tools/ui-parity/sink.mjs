#!/usr/bin/env node
// Receives snapshots from the two running instances and writes them to disk,
// so a capture never has to travel through whoever is driving the browser.
//
//   node tools/ui-parity/sink.mjs [--dir .ui-parity] [--port 3002]
//
// Install the capture in a page, then snapshot as often as you like:
//   await fetch('http://localhost:3002/capture.js').then(r => r.text()).then(eval)
//   await __uiParityCapture('budget-head')
//
// It answers every origin, which is the point: the two instances are served
// from different ports. Bind to localhost only and run it just for a session.

import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { captureSource } from './snapshot.js'

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? fallback : args[index + 1]
}

const directory = resolve(option('dir', '.ui-parity'))
const port = Number(option('port', 3002))
mkdirSync(directory, { recursive: true })

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
}

createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, CORS).end()
    return
  }
  // Serving the capture means the page always runs the source this repository
  // reviews, instead of a copy that drifted while being pasted around.
  if (request.method === 'GET' && request.url === '/capture.js') {
    response
      .writeHead(200, { ...CORS, 'content-type': 'text/javascript' })
      .end(captureSource)
    return
  }
  if (request.method !== 'POST') {
    response.writeHead(405, CORS).end('post a snapshot')
    return
  }

  const name = decodeURIComponent(request.url.slice(1)).replace(/[^\w.-]/g, '')
  if (!name) {
    response.writeHead(400, CORS).end('name the snapshot in the path')
    return
  }

  const chunks = []
  request.on('data', chunk => chunks.push(chunk))
  request.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8')
    try {
      const parsed = JSON.parse(body)
      const file = join(directory, `${name}.json`)
      writeFileSync(file, body)
      console.log(
        `${name}: ${parsed.runs.length} runs, ${parsed.boxes.length} boxes, ${parsed.route} at ${parsed.viewport.join('x')} -> ${file}`
      )
      response.writeHead(200, CORS).end('ok')
    } catch {
      response.writeHead(400, CORS).end('not a snapshot')
    }
  })
}).listen(port, '127.0.0.1', () => {
  console.log(
    `ui-parity sink on http://localhost:${port}, writing to ${directory}`
  )
})

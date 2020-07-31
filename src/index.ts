import { Client } from '@stomp/stompjs'
import { AR } from 'js-aruco'
import ArucoMarker from 'aruco-marker'

function createElement<K extends keyof HTMLElementTagNameMap>(type: K, id?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(type)
  element.id = id
  document.body.appendChild(element)
  return element
}

window.addEventListener('DOMContentLoaded', async () => {
  if (window.navigator.userAgent.toLowerCase().includes("mobi")) {
    const client = new Client({
      brokerURL: "wss://arm.zi.is/ws",
      onStompError: (frame) => {
        console.log(`Broker reported error: ${frame.headers['message']}`)
        console.log(`Additional details: ${frame.body}`)
      }
    })
    client.activate()
    
    const video = createElement("video")
    video.autoplay = true
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true })
    const canvas = createElement("canvas")
    canvas.width=1280
    canvas.height=720
    const context = canvas.getContext("2d")
    context.lineWidth = 3
    context.strokeStyle = "red"
    const detector = new AR.Detector()

    const tick = () => {
      requestAnimationFrame(tick)
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const markers = detector.detect(imageData)
        if (markers.length == 2) {
          let minX = Infinity
          let maxX = 0
          let minY = Infinity
          let maxY = 0
          for (const marker of markers) {
            for (const corner of marker.corners) {
              minX = Math.min(minX, corner.x)
              maxX = Math.max(maxX, corner.x)
              minY = Math.min(minY, corner.y)
              maxY = Math.max(maxY, corner.y)
            }
          }
          console.log(minX, maxX, minY, maxY)
          context.strokeRect(minX, minY, maxX - minX, maxY - minY)
          const x = (canvas.width / 2 - minX) / Math.max(maxX - minX, 1)
          const y = (canvas.height / 2 - minY) / Math.max(maxY - minY, 1)
          const destination = `/topic/${markers[0].id}`
          const body = JSON.stringify({ x: `${Math.floor(100 * x)}vw`, y: `${Math.floor(100 * y)}vh` })
          console.log(destination, body)
          client.publish({
            destination,
            body
          })
        }
      }
    }
    requestAnimationFrame(tick)
  } else {

    const cursor = createElement("div", "cursor")
    const id = Math.floor((Math.random() * 1024))

    const client = new Client({
      brokerURL: "wss://arm.zi.is/ws",
      onStompError: (frame) => {
        console.log(`Broker reported error: ${frame.headers['message']}`)
        console.log(`Additional details: ${frame.body}`)
      },
      onConnect: () => {
        const subscription = client.subscribe(`/topic/${id}`, (message) => {
          const msg = JSON.parse(message.body)
          console.log(message.body)
          cursor.style.top = msg.y
          cursor.style.left = msg.x
        })
        client.publish({ destination: `/topic/${id}`, body: JSON.stringify({ x: "50vw", y: "50vh" }) })
      }
    })
    client.activate()

    const marker = createElement("div", "marker1")
    const marker2 = createElement("div", "marker2")
    marker2.innerHTML = marker.innerHTML = new ArucoMarker(id).toSVG()
  }
  return

})
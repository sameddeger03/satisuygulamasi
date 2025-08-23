import {contextBridge, ipcRenderer, session} from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  kaydet(key: string, value: string) {
    return ipcRenderer.send("storeit", {key, value});
  },
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  removeAllListeners(...args: Parameters<typeof ipcRenderer.removeAllListeners>) {
    const [channel, ...omit] = args
    return ipcRenderer.removeAllListeners(channel)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

function useLoading() {
  const className = `preloaderContainer`
  const styleContent = `
  @import url('font.css');
  @import url('preload.css');
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `
<div class="${className}">
    <div class="preloader">
        <svg width="64" height="64" id="euSOTICDWXG1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"
       shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
    <defs>
      <linearGradient id="euSOTICDWXG20-fill" x1="0.5" y1="0" x2="0.5" y2="1" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)">
        <stop id="euSOTICDWXG20-fill-0" offset="0%" stop-color="rgba(255,255,255,0)" />
        <stop id="euSOTICDWXG20-fill-1" offset="100%" stop-color="#010022" />
      </linearGradient>
    </defs>
    <g id="euSOTICDWXG2_to" transform="translate(511.999977,1450.666672)">
      <g id="euSOTICDWXG2" transform="translate(-511.999977,-650.666672)">
        <path d="M106.666667,405.333333h810.666666v405.333334h-810.666666v-405.333334Z" fill="#cfd8dc" />
        <path d="M106.666667,810.666667h810.666666v85.333333h-810.666666v-85.333333Z" fill="#b0bec5" />
        <path d="M576,512h256v384h-256v-384Z" fill="#455a64" />
        <path d="M778.666667,714.666667c-6.4,0-10.666667,4.266667-10.666667,10.666666L768,768c0,6.4,4.266667,10.666667,10.666667,10.666667s10.666667-4.266667,10.666666-10.666667v-42.666667c0-6.4-4.266667-10.666667-10.666666-10.666666Z" fill="#90a4ae" />
      </g>
    </g>
    <g id="euSOTICDWXG7" transform="translate(0 0.000001)" opacity="0">
      <path d="M192,512h298.666667v234.666667h-298.666667L192,512Z" fill="#e3f2fd" />
      <path d="M213.333333,533.333333h256v192h-256v-192Z" fill="#1e88e5" />
    </g>
    <g id="euSOTICDWXG10_to" transform="translate(512,-221.333328)">
      <g id="euSOTICDWXG10" transform="translate(-512,-298.666672)">
        <path d="M448,405.333333c0,35.346224,28.653776,64,64,64s64-28.653776,64-64-28.653776-64-64-64-64,28.653776-64,64Z" fill="#558b2f" />
        <path d="M704,405.333333c0,35.346224,28.653776,64,64,64s64-28.653776,64-64-28.653776-64-64-64-64,28.653776-64,64Z" fill="#558b2f" />
        <path d="M192,405.333333c0,35.346224,28.653776,64,64,64s64-28.653776,64-64-28.653776-64-64-64-64,28.653776-64,64Z" fill="#558b2f" />
        <path d="M853.333333,128h-682.666666C147.2,128,128,147.2,128,170.666667v64h768v-64C896,147.2,876.8,128,853.333333,128ZM448,234.666667h128v170.666666h-128v-170.666666Zm341.333333,0h-106.666666L704,405.333333h128L789.333333,234.666667Zm-554.666666,0h106.666666L320,405.333333h-128l42.666667-170.666666Z" fill="#7cb342" />
        <path d="M576,405.333333c0,35.346224,28.653776,64,64,64s64-28.653776,64-64-28.653776-64-64-64-64,28.653776-64,64Z" fill="#ffa000" />
        <path d="M960,405.333333c0,36.266667-27.733333,64-64,64s-64-27.733333-64-64s27.733333-64,64-64l64,64Z" fill="#ffa000" />
        <path d="M320,405.333333c0,35.346224,28.653776,64,64,64s64-28.653776,64-64-28.653776-64-64-64-64,28.653776-64,64Z" fill="#ffa000" />
        <path d="M64,405.333333c0,36.266667,27.733333,64,64,64s64-27.733333,64-64-27.733333-64-64-64l-64,64Z" fill="#ffa000" />
        <path d="M682.666667,234.666667h-106.666667v170.666666h128L682.666667,234.666667Zm213.333333,0h-106.666667L832,405.333333h128L896,234.666667Zm-554.666667,0h106.666667v170.666666h-128l21.333333-170.666666Zm-213.333333,0h106.666667L192,405.333333h-128l64-170.666666Z" fill="#ffc107" />
      </g>
    </g>
  </svg>
        <div class="preloader__text">
                <p class="preloader__msg">Lütfen bekleyiniz</p>
        </div>
</div>
</div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
        safeDOM.remove(document.head, oStyle)
        safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------
const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.addEventListener('DOMContentLoaded', () => {
  if (window.location.href !== 'about:blank')
    setTimeout(() => removeLoading(), 1000)
});



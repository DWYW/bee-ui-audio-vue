export const AUDIO_MANAGEMENT = {
  cache: [],
  create (sourceURI) {
    const instance = new BeeAudio(sourceURI)

    instance.play = (singleMode) => {
      if (singleMode) {
        this.cache.forEach((item) => {
          item === instance ? item.play() : item.pause()
        })
      } else {
        instance.audio.play()
      }
    }

    this.cache.push(instance)
    return instance
  },
  destroyed (audioInstance) {
    const index = this.cache.findIndex(item => item === audioInstance)

    if (index >= 0) {
      this.cache[index].destroyed()
      this.cache.splice(index, 1)
    }
  }
}

export class BeeAudio {
  audio = null
  parentElement = ''

  constructor (sourceURI) {
    this.audio = new Audio(sourceURI)
    this.audio.controls = 'controls'
  }

  mounted (parentElement) {
    this.parentElement = parentElement
    parentElement.appendChild(this.audio)
  }

  destroyed () {
    this.parentElement.removeChild(this.audio)
  }

  play () {
    this.audio.play()
  }

  pause () {
    this.audio.pause()
  }

  seek (time) {
    this.audio.currentTime = time
  }

  playRate (value) {
    if (value) {
      this.audio.playbackRate = Number(value)
    } else {
      return this.audio.playbackRate
    }
  }

  addEvents (events = {}) {
    for (const key in events) {
      this.audio.addEventListener(key, events[key], false)
    }
  }
}

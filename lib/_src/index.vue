<template>
  <div class="bee-audio-component">
    <section class="handle-buttons">
      <i :class="buttonType" @click="toggle"></i>
    </section>

    <section class="durations" @click="barsOnClick" ref='duration'>
      <div class="buffered" :style="{
        width: percent.buffered
      }"></div>

      <div class="played" :style="{
        width: percent.played
      }"></div>

      <span class="drag-button" :style="{
        left: percent.played
      }" @mousedown="onDragstart"></span>
    </section>

    <div class="remainder-duration">
      {{durationStringify(duration.played)}}/{{durationStringify(duration.total)}}
    </div>

    <div class="choose-speed" v-if="speeds" @click="chooseSpeed">{{speedLabel}}</div>

    <ul :class='["speeds", {
      "speeds__actived": speedsVisible
    }]' v-if="speeds">
      <li v-for="(item, key) in speeds" :key="key"
        :class="['speed-item', {
          'item__actived': Number(speed) === Number(item.value || item)
        }]"
        :style="{
          width: (100 / speeds.length) + '%'
        }"
      >
        <span @click="speedSelected(item)">{{speedStringify(item)}}</span>
      </li>
    </ul>
  </div>
</template>

<script>
const STATUS_TYPE = {
  WAITING: 0,
  LOADING: 1,
  LOADED: 2,
  PLAYING: 3,
  PAUSED: 4,
  ENDED: 5,
  ERROR: 9
}

const BUTTON_TYPE = {
  [STATUS_TYPE.WAITING]: 'button__loading',
  [STATUS_TYPE.LOADING]: 'button__loading',
  [STATUS_TYPE.LOADED]: 'button__play',
  [STATUS_TYPE.PLAYING]: 'button__pause',
  [STATUS_TYPE.PAUSED]: 'button__play',
  [STATUS_TYPE.ENDED]: 'button__play',
  [STATUS_TYPE.ERROR]: 'button__error'
}

export default {
  name: 'BeeAudio',
  props: {
    source: {
      type: String
    },
    autoPlay: Boolean,
    loop: Boolean,
    repeat: {
      type: Array,
      validator: function (value) {
        return value.length === 2 && value.reduce((acc, cur) => {
          return /(^0\.\d+$)|(^[1-9]\d*(\.\d+)?$)/.test(cur) ? acc : acc + 1
        }, 0) === 0
      }
    },
    speeds: {
      type: Array,
      validator: function (value) {
        return value.reduce((acc, cur) => {
          return /(^0\.\d+$)|(^[1-9]\d*(\.\d+)?$)/.test(cur.value || cur) ? acc : acc + 1
        }, 0) === 0
      }
    },
    singleMode: Boolean
  },
  computed: {
    buttonType () {
      return BUTTON_TYPE[this.status]
    },
    percent () {
      const { total, buffered, played } = this.duration

      return {
        buffered: total && buffered ? `${Math.min(buffered / total, 1) * 100}%` : '0%',
        played: total && played ? `${Math.min(played / total, 1) * 100}%` : '0%'
      }
    },
    speedLabel () {
      const itemData = this.speeds.find((item) => Number(item.value || item) === Number(this.speed))
      return itemData.label || this.speedStringify(itemData.value || itemData)
    }
  },
  data () {
    return {
      status: STATUS_TYPE.WAITING,
      duration: {
        total: null,
        buffered: null,
        played: null
      },
      speedsVisible: false,
      speed: '1.0',
      dragCache: {
        pageX: null,
        played: null
      }
    }
  },
  mounted () {
    this._audio = window.$AUDIO_MANAGEMENT.create(this.source)
    this._audio.mounted(this.$el)
    this._audio.addEvents({
      waiting: this.onWaiting,
      loadstart: this.onLoadstart,
      loadeddata: this.onLoadeddata,
      timeupdate: this.onTimeUpdate,
      durationchange: this.onDurationchange,
      playing: this.onPlaying,
      pause: this.onPause,
      ended: this.onEnded,
      stalled: this.onStalled,
      error: this.onError
    })
  },
  destroyed () {
    window.$AUDIO_MANAGEMENT.destroyed(this._audio)
  },
  methods: {
    toggle () {
      const next = {
        [STATUS_TYPE.LOADED]: this.play,
        [STATUS_TYPE.PLAYING]: this.pause,
        [STATUS_TYPE.PAUSED]: this.play,
        [STATUS_TYPE.ENDED]: this.play
      }

      next[this.status] && next[this.status]()
    },

    play () {
      if (this.repeat) {
        this._audio.seek(Math.min(...this.repeat))
      }

      this.status = STATUS_TYPE.PLAYING
      this._audio.play(this.singleMode)
      this.$listeners.play && this.$listeners.play(this)
    },

    pause () {
      this.status = STATUS_TYPE.PAUSED
      this._audio.pause()
      this.$listeners.pause && this.$listeners.pause(this)
    },

    updateDurations (audio) {
      this.duration.total = audio.duration

      if (!this.dragCache.pageX) {
        this.duration.played = audio.currentTime
      }

      if (audio.buffered) {
        this.duration.buffered = audio.buffered.end(0)
      }
    },

    onLoadstart () {
      this.status = STATUS_TYPE.LOADING
    },

    onLoadeddata (e) {
      this.status = STATUS_TYPE.LOADED
      this.updateDurations(e.target)
      this.autoPlay && this.play()
    },

    onDurationchange (e) {
      this.duration.total = e.target.duration
    },

    onTimeUpdate (e) {
      const target = e.target
      this.updateDurations(target)

      if (this.repeat) {
        const { played } = this.duration

        if (played >= Math.max(...this.repeat)) {
          this.loop ? this._audio.seek(Math.min(...this.repeat)) : this.pause()
        }
      }

      this.$listeners.timeUpdate && this.$listeners.timeUpdate(this)
    },

    onWaiting (e) {
      // delay to set status resolve seeking.
      this._statusSetTimeout = setTimeout(() => {
        this.status = STATUS_TYPE.WAITING
      }, 20)
    },

    onPlaying () {
      this._statusSetTimeout && clearTimeout(this._statusSetTimeout)

      if (this.status !== STATUS_TYPE.PLAYING) {
        this.status = STATUS_TYPE.PLAYING
      }
    },

    onPause () {
      if (this.status !== STATUS_TYPE.PAUSED) {
        this.status = STATUS_TYPE.PAUSED
      }
    },

    onEnded () {
      this.status = STATUS_TYPE.ENDED
      this.$listeners.ended && this.$listeners.ended(this)
      this.loop && this.play()
    },

    onStalled () {
      this.status = STATUS_TYPE.LOADING
      this.emitMessage('Failed to fetch data on stalled.')
    },

    onError () {
      this.status = STATUS_TYPE.ERROR
      this.emitMessage('Error to fetch data.')
    },

    emitMessage (message) {
      this.$listeners.message && this.$listeners.message(message)
    },

    chooseSpeed () {
      this.speedsVisible = true
    },

    speedSelected (data) {
      this.speed = data.value || data
      this.speedsVisible = false
    },

    durationStringify (value) {
      const strings = ['--', '--']

      if (value >= 0) {
        const seconds = Math.floor(value % 60)
        const minutes = Math.floor(value / 60 % 60)
        strings[0] = minutes < 10 ? '0' + minutes : minutes
        strings[1] = seconds < 10 ? '0' + seconds : seconds
      }

      return strings.join(':')
    },

    speedStringify (data) {
      return data.label || `x${data}`
    },

    barsOnClick (e) {
      if (this.status === STATUS_TYPE.ERROR) return
      if (!/durations|buffered|played/.test(e.target.className)) return

      const { left, width } = this.$refs.duration.getBoundingClientRect()
      const currentTime = (e.pageX - left) / width * this.duration.total
      this._audio.seek(currentTime)
    },

    onDragstart (e) {
      if (this.status === STATUS_TYPE.ERROR) return

      this.dragCache.pageX = e.pageX
      this.dragCache.played = this.duration.played

      window.addEventListener('mousemove', this.onDragmove, false)
      window.addEventListener('mouseup', this.onDragend, false)
    },

    onDragmove (e) {
      if (!this.dragCache.pageX) return

      const { width } = this.$refs.duration.getBoundingClientRect()
      const { pageX, played } = this.dragCache
      const step = (e.pageX - pageX) / width * this.duration.total
      const currentTime = Math.min(
        Math.max(step + played, 0),
        this.duration.total
      )
      this.duration.played = currentTime
    },

    onDragend (e) {
      this._audio.seek(this.duration.played)

      this.dragCache.pageX = null
      this.dragCache.played = null
      window.removeEventListener('mousemove', this.onDragmove, false)
      window.removeEventListener('mouseup', this.onDragend, false)
    }
  },
  watch: {
    speed: function (value, oldValue) {
      if (value !== oldValue && this._audio) {
        this._audio.playRate(value)
      }
    }
  }
}
</script>

<style lang="less">
  @import './index.less';
</style>

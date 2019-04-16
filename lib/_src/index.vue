<template>
  <div class="bee-audio-component" @mousemove='seeking' @mouseup="seeked" @mouseleave="seeked">
    <div class="btns--wp">
      <i class="audio--btn audio--btn__play" @click='play' v-if='status === "play"'></i>
      <i class="audio--btn audio--btn__stop" @click='pause' v-else-if='status === "stop"'></i>
      <i class="audio--btn audio--btn__loading" v-else></i>
    </div>

    <div class="time--bars">
      <div class="time--bar total--bar" :style='{
        width: barsWidth.duration
      }' ref='duration' @click='barOnClick'></div>
      <div class="time--bar buffered--bar" :style='{
        width: barsWidth.buffered
      }' @click='barOnClick'></div>
      <div class="time--bar played--bar" :style='{
        width: barsWidth.current
      }' @click='barOnClick'></div>

      <div class="time--btn" :style='{
        left: btnLeft
      }' ref='timeBtn' @mousedown='seekStart'></div>
    </div>

    <div class="audio--duration">
      {{(times.duration - times.current) | duration2str}}
    </div>

    <div class="audio--speed" v-if='speeds' @click="openSpeedsPanel">{{speed | speed2str}}</div>

    <ul :class='["speed--select", {
      "speed--select__visible": speedsVisible
    }]' v-if='speeds'>
      <li :class='["speed--item", {
        "item__active": speed === item
      }]' v-for='item in speeds' :key='item' @click='setPlayRate(item)'>{{item | speed2str}}</li>
    </ul>

    <audio controls='controls' ref='audio'
      @waiting="onWaiting"
      @loadstart="onLoadstart"
      @loadeddata="onLoadeddata"
      @playing="onPlaying"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @error="onError"
      @stalled='onStalled'
      @durationchange='onDurationchange'
    >
      <source :src="source" type='audio/mpeg'>
    </audio>
  </div>
</template>

<script>
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
        return value.length === 2 && value.reduce((errorCount, cur) => {
          return /(^0(.\d+)?)|(^[1-9]\d*(.\d+)?)$/.test(cur) ? errorCount : errorCount + 1
        }, 0) === 0
      }
    },
    speeds: {
      type: Array,
      validator: function (value) {
        return value.reduce((errorCount, cur) => {
          return /(^0(.\d+)?)|(^[1-9]\d*(.\d+)?)$/.test(cur) ? errorCount : errorCount + 1
        }, 0) === 0
      }
    }
  },
  data () {
    return {
      audio: null,
      status: 'play',
      speedsVisible: false,
      speed: 1,
      times: {
        duration: null,
        current: null,
        buffered: null
      },
      seek: {
        switch: false,
        stash: null
      },
      timeout: null
    }
  },
  computed: {
    /** the width of all bars. */
    barsWidth () {
      return {
        duration: '100%',
        buffered: this.times.buffered && this.times.duration ? `${Math.min(this.times.buffered / this.times.duration * 100, 100)}%` : '0%',
        current: this.times.current && this.times.duration ? `${Math.min(this.times.current / this.times.duration * 100, 100)}%` : '0%'
      }
    },
    /** the left distance of time btn. */
    btnLeft () {
      if (!this.times.current || !this.times.duration || !this.$refs.duration) return null

      const width = this.$refs.duration.offsetWidth
      const left = (this.times.current / this.times.duration * width) - (this.$refs.timeBtn.offsetWidth / 2)
      return `${Math.floor(left)}px`
    }
  },
  filters: {
    duration2str (duration) {
      if (duration === null || duration === undefined) {
        return '--:--'
      }

      let seconds = Math.floor(duration % 60)
      let minutes = Math.floor(duration / 60 % 60)

      return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`
    },

    speed2str (speed) {
      if (!speed || speed === 1) {
        return '正常'
      }

      return `${speed}x`
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.audio = this.$refs.audio
    })
  },
  methods: {
    /** on waiting event. */
    onWaiting (e) {
      this.timeout = setTimeout(() => {
        this.status = 'loading'
      }, 10)
    },

    /** on loadstart event. */
    onLoadstart (e) {
      if (!this.source) {
        this.message({
          type: 'error',
          step: 'loadstart',
          text: '无法获取音频'
        })

        return null
      }

      this.status = 'loading'
    },

    /** on duration on changed event. */
    onDurationchange (e) {
      const _audio = e.target
      this.$set(this.times, 'duration', _audio.duration)
    },

    /** on loaded data event. */
    onLoadeddata (e) {
      const _audio = e.target
      this.status = 'play'
      this.$set(this.times, 'duration', _audio.duration)

      try {
        this.$set(this.times, 'buffered', _audio.buffered.end(0))
      } catch (error) {
        console.warn(error)
      }

      this.autoPlay && this.play()
    },

    /** on playing event. */
    onPlaying (e) {
      if (this.timeout) {
        clearTimeout(this.timeout)
      }

      if (this.status !== 'stop') {
        this.status = 'stop'
      }
    },

    /** on time update event. */
    onTimeUpdate (e) {
      const _audio = e.target

      // not set the current time when custom seeking.
      if (!this.seek.switch) {
        this.$set(this.times, 'current', _audio.currentTime)
      }

      this.$set(this.times, 'duration', _audio.duration)
      this.$set(this.times, 'buffered', _audio.buffered.end(0))

      if (this.repeat) {
        if (_audio.currentTime >= Math.max(...this.repeat)) {
          this.loop ? _audio.currentTime = Math.min(...this.repeat) : this.pause()
        }
      }

      this.$emit('timeUpdate', e)
    },

    /** on ended event. */
    onEnded (e) {
      this.status = 'play'
      this.$emit('ended', this.audio)

      if (this.loop) {
        this.play()
      }
    },

    /** on error event. */
    onError (e) {
      this.message({
        type: 'error',
        step: 'error',
        text: '音频播放发生了意外'
      })
      this.status = 'play'
    },

    /** on stalled event. */
    onStalled (e) {
      this.message({
        type: 'error',
        step: 'stalled',
        text: '获取音频失败'
      })
      this.status = 'play'
    },

    /** play the audio. */
    play () {
      if (!this.source) {
        this.message({
          type: 'error',
          step: 'play',
          text: '无法获取音频资源'
        })
        return
      }

      if (this.repeat) {
        this.audio.currentTime = Math.min(...this.repeat)
      }

      this.status = 'stop'
      this.audio.play()
      this.$emit('play', this.audio)
    },

    /** pause the audio. */
    pause () {
      this.status = 'play'
      this.audio.pause()
      this.$emit('pause', this.audio)
    },

    /** show messages */
    message (message) {
      this.$emit('message', message)
    },

    /** open the panel of choose play rate. */
    openSpeedsPanel () {
      this.speedsVisible = true
    },

    /** close the panel of choose play rate. */
    closeSpeedsPanel () {
      this.speedsVisible = false
    },

    /** set a rate of paly the audio. */
    setPlayRate (rate) {
      this.speed = rate
      this.closeSpeedsPanel()
    },

    /** star set current time. */
    seekStart (e) {
      this.$set(this.seek, 'switch', true)
      this.$set(this.seek, 'stash', {
        x: e.pageX,
        currentTime: this.times.current >> 0
      })
    },

    /** seeking current time. */
    seeking (e) {
      if (this.seek.switch) {
        const seconds = (e.pageX - this.seek.stash.x) / this.$refs.duration.offsetWidth * this.times.duration

        if (Math.round(seconds) + this.seek.stash.currentTime < 0) {
          this.$set(this.times, 'current', 0)
        } else if (Math.round(seconds) + this.seek.stash.currentTime > this.times.duration) {
          this.$set(this.times, 'current', this.times.duration)
        } else {
          this.$set(this.times, 'current', Math.round(seconds + this.seek.stash.currentTime))
        }
      }
    },

    /** seeked current time. */
    seeked (e) {
      if (this.seek.switch) {
        this.audio.currentTime = this.times.current
        this.$set(this.seek, 'switch', false)
      }
    },

    /** seek current time. */
    barOnClick (e) {
      const { left, width } = this.$refs.duration.getBoundingClientRect()
      const time = (e.pageX - left) / width * this.times.duration
      this.audio.currentTime = time
    }
  },
  watch: {
    speed: function (current, prev) {
      if (current !== prev && this.audio) {
        this.audio.playbackRate = current
      }
    }
  }
}
</script>

<style lang="less">
@import 'variables.less';

.bee-audio-component {
  border-radius: 4px;
  padding: 6px 10px;
  display: inline-block;
  border: 1px solid @border-color;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
  user-select: none;
  white-space: nowrap;

  .btns--wp, .time--bars, .audio--duration, .audio--speed {
    display: inline-block;
    vertical-align: middle;
  }

  .time--bars, .audio--duration, .audio--speed {
    margin-left: 15px;
  }

  .btns--wp {
    border: 1px solid @primary-color;
    text-align: center;
    border-radius: 50%;
    font-size: 16px;

    .audio--btn {
      display: block;
      width: @button-size;
      height: @button-size;
      background-repeat: no-repeat;
      background-position: center;
      background-size: 14px;
      cursor: pointer;

      &.audio--btn__loading {
        animation: audio-loading 1.5s ease infinite;
        background-image: url(@loading);
      }

      &.audio--btn__play {
        background-image: url(@play);
      }

      &.audio--btn__stop {
        background-image: url(@stop);
      }
    }
  }

  .time--bars {
    width: 200px;
    height: @button-size;
    position: relative;

    .time--bar {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translate3d(0, -50%, 0);
      height: @bar-height;
      border-radius: @bar-height / 2;
      cursor: pointer;

      &.total--bar {
        background-color: @bar-bg-color;
      }

      &.buffered--bar {
        background-color: @buffer-bar-bg-color;
      }

      &.played--bar {
        background-color: @primary-color;
      }
    }

    .time--btn {
      width: @bar-height * 3;
      height: @bar-height * 3;
      background-color: @primary-color;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: -@bar-height * 3 / 2;
      transform: translate3d(0, -50%, 0);
      cursor: pointer;
    }
  }

  .audio--duration {
    font-size: 14px;
    color: @font-color-tint;
  }

  .speed--select {
    width: 100%;
    height: 0;
    margin: 0;
    padding: 0 10px;
    border-radius: 4px;
    box-sizing: border-box;
    background-color: #ffffff;
    text-align: center;
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: absolute;
    left: 0;
    bottom: 0;
    overflow: hidden;
    transition: height .2s linear, padding .2s linear;

    &.speed--select__visible {
      height: 100%;
      padding: 6px 10px;
    }

    li {
      margin: 0;
      padding: 0;
      list-style: none;
      display: inline-block;
      color: @font-color-tint;
      font-size: 14px;
      transition: color 0.2s;
      cursor: pointer;

      &:active {
        color: @primary-color;
      }

      &.item__active {
        color: @primary-color;
      }
    }
  }

  .audio--speed {
    min-width: 35px;
    margin-left: 5px;
    height: @button-size;
    line-height: @button-size;
    font-size: 12px;
    color: @font-color-tint;
    background-image: url(@speed);
    background-repeat: no-repeat;
    background-position: left center;
    background-size: 24px;
    padding-left: 20px;
    box-sizing: content-box;
    text-align: left;
  }

  audio {
    display: none;
  }
}

@keyframes audio-loading {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

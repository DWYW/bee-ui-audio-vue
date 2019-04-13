<template>
  <div class="example-pape">
    <div class="panel">
      <div class="text-center" >
        <bee-audio :source='source' v-if='isAutoPlay' key='autoPlay'
          :auto-play='isAutoPlay'
          :loop='isLoop'
          :repeat='repeat'
          :speeds='speeds'
          @message='onMessage'
        ></bee-audio>

        <bee-audio :source='source'  v-else key='notAutoPlay'
          :loop='isLoop'
          :repeat='repeat'
          :speeds='speeds'
          @message='onMessage'
        ></bee-audio>
      </div>
      <div class="setting">
        <div class="mgb-10px">
          <span>
            自动播放： <input type="checkbox" v-model="isAutoPlay">
          </span>
          <span>
            循环播放： <input type="checkbox" v-model="isLoop">
          </span>
        </div>

        <div class="mgb-10px">
          <span>
            播放片段:  <input type="checkbox" v-model="isRepeat"> ({{repeatTimes[0]}}s-{{repeatTimes[1]}}s)
          </span>
        </div>

        <div class="mgb-10px">
          <span>
            设置播放速度:  <input type="checkbox" v-model="isSetSpeed"> {{speedsOptions.join(',')}}
          </span>
        </div>

        <div class="error-info">
          {{message}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      source: `${process.env.BASE_URL}stronger.mp3`,
      isAutoPlay: false,
      isLoop: false,
      isRepeat: false,
      repeatTimes: [10, 15],
      isSetSpeed: false,
      speedsOptions: [0.5, 1, 1.5, 2],
      message: null
    }
  },
  computed: {
    repeat () {
      return this.isRepeat ? this.repeatTimes : null
    },
    speeds () {
      return this.isSetSpeed ? this.speedsOptions : null
    }
  },
  methods: {
    onMessage (message) {
      this.message = message
    }
  }
}
</script>

<style lang="less">
.example-pape {
  .text-center {
    text-align: center;
  }

  .panel {
    width: 380px;
    margin: 50px auto;
  }

  .mgl-20px {
    margin-left: 20px;
  }

  .mgb-10px {
    margin-bottom: 10px;
  }

  .setting {
    margin-top: 30px;

    span {
      margin-right: 30px;
    }

    input {
      outline: none;

      &[type="text"] {
        width: 200px;
        height: 24px;
      }
    }
  }

  .error-info {
    color: red;
  }
}
</style>

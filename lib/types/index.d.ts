import Vue from 'vue'

const BeeAudio: {
  install: {
    (vue: typeof Vue, optioins?: {
      language?: string,
      [index: string]: any
    }): void
  },
  [index: string]: any
}

export default BeeAudio

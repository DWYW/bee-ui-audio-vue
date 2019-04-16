### 引入方式

``` bash
npm install bee-ui-audio-vue --save-dev
```

``` js
// mian.js
import BeeAudio from 'bee-ui-audio-vue'

Vue.use(BeeAudio)
```

### 属性

|属性|说明|类型|可选值|默认值|
|---|---|---|---|---|
|source|音频地址|string|—|-|
|autoPlay|是否自动播放|boolean|—|-|
|loop|是否重复播放|boolean|—|-|
|repeat|重复播放的开始时间和结束时间|array|—|-|
|speeds|播放速率|array|—|-|


### 方法

|属性|说明|
|---|---|
|play|播放|
|pause|暂停|
|ended|结束|
|message|信息|
|timeUpdate|播放时间改变|
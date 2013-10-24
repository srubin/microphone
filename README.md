microphone
==========

Tiny coffeescript/javascript library to process live audio input in
the browser. Right now, this only works in Chrome.

I created this to make it easy to perform arbitrary computations using
raw, streaming audio data.

A `Microphone` object takes two parameters- settings and a callback.

* `settings`:
    * `unit`: the length (in seconds) of audio to return in each callback
      *(default: 1)*
    * `overlap`: the amount of overlap in the audio data between
      successive callbacks (For example, overlap of .25 means the last
      25% of the audio data from one callback will be the first 25% of
      the data in the next callback). *(default: 0. Must be between 0
      and 1, inclusive)*
    * `channels`: 1 (mono) or 2 (stereo) *(default: 1)*
* `callback`: A function that takes an array with dimensions `2x(unit * recording sample rate)` if stereo, and just `(unit * recording sample rate)` if mono. The callback will be called every
`(unit * (1 - overlap))` seconds.

Usage
-----

### Example: compute the RMS energy every half second with 50% overlap

Coffeescript:
```coffeescript
mic = new Microphone unit: .5, overlap: .5, (data) ->
    v = (d * d for d in data).reduce (t, s) -> t + s
    v = Math.sqrt(v / data.length)
    console.log v
```

Javascript:
```javascript
mic = new Microphone({
    unit: .5,
    overlap: .5
}, function (data) {
    v = data.map(function (d) { return d * d; });
    v = v.reduce(function (t, s) { return t + s; });
    v = Math.sqrt(v / data.length);
    console.log(v);
})
```
(function() {
  var Microphone,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Microphone = (function() {
    function Microphone(length, overlap, callback) {
      this.length = length;
      this.overlap = overlap;
      this.callback = callback;
      this.createNode = __bind(this.createNode, this);
      this.gotStream = __bind(this.gotStream, this);
      this.bufferSize = 4096;
      this.total = 0;
      this.buf = [];
      if (this.overlap == null) {
        this.overlap = 0;
      } else if (this.overlap > 1 || this.overlap < 0) {
        throw "Overlap must be between 0 and 1";
      }
      this.getUserMedia({
        audio: true
      }, this.gotStream);
    }

    Microphone.prototype.gotStream = function(stream) {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.bufLength = this.length * this.audioContext.sampleRate;
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      window.microphoneProcessingNode = this.createNode();
      this.mediaStreamSource.connect(window.microphoneProcessingNode);
      return window.microphoneProcessingNode.connect(this.audioContext.destination);
    };

    Microphone.prototype.createNode = function() {
      var node,
        _this = this;
      node = this.audioContext.createJavaScriptNode(this.bufferSize, 2, 2);
      node.onaudioprocess = function(e) {
        var left, outBuffer;
        left = e.inputBuffer.getChannelData(0);
        _this.buf.push(new Float32Array(left));
        _this.total += _this.bufferSize;
        if (_this.total > _this.bufLength) {
          outBuffer = _this.prepareBuffer();
          return _this.callback(outBuffer);
        }
      };
      return node;
    };

    Microphone.prototype.prepareBuffer = function() {
      var i, newBuf, x, _i, _j, _len, _len1, _ref;
      newBuf = [];
      _ref = this.buf;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        for (_j = 0, _len1 = i.length; _j < _len1; _j++) {
          x = i[_j];
          newBuf.push(x);
        }
      }
      this.buf = [newBuf.slice((1 - this.overlap) * this.bufLength)];
      this.total = this.buf[0].length;
      return newBuf.slice(0, this.bufLength);
    };

    Microphone.prototype.getUserMedia = function(dictionary, callback) {
      var e;
      try {
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        return navigator.getMedia(dictionary, callback);
      } catch (_error) {
        e = _error;
        throw "Could not getMedia";
      }
    };

    return Microphone;

  })();

  window.Microphone = Microphone;

}).call(this);

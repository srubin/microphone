(function() {
  var Microphone,
    audioContext = new (window.AudioContext || window.webkitAudioContext),
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Microphone = (function() {
    function Microphone(dict, callback) {
      this.callback = callback;
      this.createNode = __bind(this.createNode, this);
      this.gotStream = __bind(this.gotStream, this);
      this.length = dict.length || 1;
      this.overlap = dict.overlap || 0;
      this.channels = dict.channels || 1;
      if (this.overlap > 1 || this.overlap < 0) {
        throw "Overlap must be between 0 and 1";
      }
      if (this.channels !== 1 && this.channels !== 2) {
        throw "Channels must be 1 (mono) or 2 (stereo)";
      }
      this.bufferSize = 4096;
      this.total = 0;
      this.bufL = [];
      this.bufR = [];
      this.getUserMedia({
        audio: true
      }, this.gotStream);
    }

    Microphone.prototype.gotStream = function(stream) {
      this.audioContext = audioContext;
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
        var left, outBuffer, right;
        left = e.inputBuffer.getChannelData(0);
        right = e.inputBuffer.getChannelData(1);
        _this.bufL.push(new Float32Array(left));
        _this.bufR.push(new Float32Array(right));
        _this.total += _this.bufferSize;
        if (_this.total > _this.bufLength) {
          outBuffer = _this.prepareBuffer();
          return _this.callback(outBuffer);
        }
      };
      return node;
    };

    Microphone.prototype.prepareBuffer = function() {
      var b, i, outL, outR, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1;
      outL = [];
      outR = [];
      _ref = this.bufL;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        b = _ref[_i];
        for (_j = 0, _len1 = b.length; _j < _len1; _j++) {
          x = b[_j];
          outL.push(x);
        }
      }
      _ref1 = this.bufR;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        b = _ref1[_k];
        for (_l = 0, _len3 = b.length; _l < _len3; _l++) {
          x = b[_l];
          outR.push(x);
        }
      }
      this.bufL = [outL.slice((1 - this.overlap) * this.bufLength)];
      this.bufR = [outR.slice((1 - this.overlap) * this.bufLength)];
      this.total = this.bufL[0].length;
      if (this.channels === 1) {
        return (function() {
          var _m, _ref2, _results;
          _results = [];
          for (i = _m = 0, _ref2 = this.bufLength; 0 <= _ref2 ? _m < _ref2 : _m > _ref2; i = 0 <= _ref2 ? ++_m : --_m) {
            _results.push((outL[i] + outR[i]) * .5);
          }
          return _results;
        }).call(this);
      }
      return [outL.slice(0, this.bufLength), outR.slice(0, this.bufLength)];
    };

    Microphone.prototype.getUserMedia = function(dictionary, callback) {
      var e;
      try {
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        return navigator.getMedia(dictionary, callback, function(err) {
          return console.log("The following error occured: " + err);
        });
      } catch (_error) {
        e = _error;
        throw "Could not getMedia";
      }
    };

    return Microphone;

  })();

  window.Microphone = Microphone;

}).call(this);

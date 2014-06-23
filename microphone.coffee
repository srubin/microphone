class Microphone
    @audioContext: new (window.AudioContext || window.webkitAudioContext)

    constructor: (dict, @callback) ->
        @length = dict.length || 1
        @overlap = dict.overlap || 0
        @channels = dict.channels || 1

        if @overlap > 1 or @overlap < 0
            throw "Overlap must be between 0 and 1"
        if @channels isnt 1 and @channels isnt 2
            throw "Channels must be 1 (mono) or 2 (stereo)"

        @bufferSize = 4096
        @total = 0
        @bufL = []
        @bufR = []

        @getUserMedia audio:true, @gotStream

    gotStream: (stream) =>
        @audioContext = @constructor.audioContext

        @bufLength = @length * @audioContext.sampleRate

        # get an AudioNode from the stream
        @mediaStreamSource = @audioContext.createMediaStreamSource stream

        # binding to window because otherwise it'll
        # get garbage collected
        window.microphoneProcessingNode = @createNode()
        @mediaStreamSource.connect window.microphoneProcessingNode
        window.microphoneProcessingNode.connect @audioContext.destination

    createNode: =>
        node = (@audioContext.createScriptProcessor || @audioContext.createJavaScriptNode) @bufferSize, 2, 2
        node.onaudioprocess = (e) =>
            left = e.inputBuffer.getChannelData(0)
            right = e.inputBuffer.getChannelData(1)

            # clone the samples
            @bufL.push new Float32Array(left)
            @bufR.push new Float32Array(right)

            @total += @bufferSize
            if @total > @bufLength
                outBuffer = @prepareBuffer()
                @callback outBuffer

        node

    prepareBuffer: ->
        outL = []
        outR = []
        for b in @bufL
            for x in b
                outL.push x
        for b in @bufR
            for x in b
                outR.push x

        @bufL = [outL.slice((1 - @overlap) * @bufLength)]
        @bufR = [outR.slice((1 - @overlap) * @bufLength)]

        @total = @bufL[0].length

        if @channels is 1
            # average left and right channels for mono
            return ((outL[i] + outR[i]) * .5 for i in [0...@bufLength])

        [outL.slice(0, @bufLength), outR.slice(0, @bufLength)]

    getUserMedia: (dictionary, callback) ->
        try
            navigator.getMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia

            navigator.getMedia dictionary, callback, (err) ->
                console.log("The following error occured: " + err);
        catch e
            throw "Could not getMedia"

window.Microphone = Microphone

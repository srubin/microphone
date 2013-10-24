class Microphone
    constructor: (@length, @overlap, @callback) ->
        @bufferSize = 4096
        @total = 0
        @buf = []
        if not @overlap?
            @overlap = 0
        else if @overlap > 1 or @overlap < 0
            throw "Overlap must be between 0 and 1"

        @getUserMedia audio:true, @gotStream

    gotStream: (stream) =>
        window.AudioContext = window.AudioContext || window.webkitAudioContext
        @audioContext = new AudioContext()

        @bufLength = @length * @audioContext.sampleRate

        # get an AudioNode from the stream
        @mediaStreamSource = @audioContext.createMediaStreamSource stream

        # binding to window because otherwise it'll
        # get garbage collected
        window.microphoneProcessingNode = @createNode()
        @mediaStreamSource.connect window.microphoneProcessingNode
        window.microphoneProcessingNode.connect @audioContext.destination

    createNode: =>
        node = @audioContext.createJavaScriptNode @bufferSize, 2, 2
        node.onaudioprocess = (e) =>
            left = e.inputBuffer.getChannelData(0)

            # clone the samples
            @buf.push new Float32Array(left)
            @total += @bufferSize
            if @total > @bufLength
                outBuffer = @prepareBuffer()
                @callback outBuffer

        node

    prepareBuffer: ->
        newBuf = []
        for i in @buf
            for x in i
                newBuf.push x
        @buf = [newBuf.slice((1 - @overlap) * @bufLength)]
        @total = @buf[0].length
        newBuf.slice 0, @bufLength

    getUserMedia: (dictionary, callback) ->
        try
            navigator.getMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia

            navigator.getMedia dictionary, callback
        catch e
            throw "Could not getMedia"

window.Microphone = Microphone
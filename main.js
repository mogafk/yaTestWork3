$(function(){
    //    alert("Квест \"Я дизайнер\" провален");
    var context = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = context.createAnalyser();
    analyser.fftSize = 256;

    var source;
    var songLength;
    var gainNode = context.createGain();
    gainNode.connect(context.destination);

    var canvas = document.querySelector('.visualizer');
    var canvasCtx = canvas.getContext("2d");
    canvasCtx.fillStyle = "rgb(50,50,50)";
    canvasCtx.fillRect(0,0, canvas.width, canvas.height);

    var drawVisual; //descriptor for requestAnimationFrame

    var play = document.querySelector('.play');
    play.removeAttribute("disabled");
    var stop = document.querySelector('.stop');
    var pause = document.querySelector('.pause');
    var next = document.querySelector('.next');
    var previous = document.querySelector('.previous');

    var volume = document.querySelector('#volume');
    var volumeInc = document.querySelector('.volume-increase');
    var volumeDec = document.querySelector('.volume-decrease');

    var progressChar = document.querySelector(".info");
    var progress = document.getElementById("progress-play");

    var playlist = [];

    var playback = 0; //increment each second interval
    var pbackHandler; //descript interval for playback

    var IdTrack; //id of element playlist array

    //dropbox
    var dropbox;

    dropbox = document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);

    function dragenter(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    function dragover(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    function drop(e) {
        e.stopPropagation();
        e.preventDefault();

        var dt = e.dataTransfer;
        var files = dt.files;

        handleFiles(files);
    }

    $(dropbox).on("click", ".track", function(){
        idTrack = $(this).data("id-track");
        if(playback > 0) {
            stopTrack();
            playTrack();
        }
        $(progressChar).text($("[data-id-track='"+idTrack+"']").children(".title").text());
    });

    /**
     * Using fileApi for load client files and parse metadata of mp3(only).
     * Also push to global array playlist result of decodeAudioData.
     *
     * called in event handler of drop file area and file input
     * @param {Blob|File} file
     * @param {String} url name of file
     */
    function readerOnload(file, url){
        var reader = new FileReader();
        reader.onload = function () {

            context.decodeAudioData(reader.result, function (buffer) {
                (function(buffer) {
                    playlist.push(buffer);
                    var id = playlist.length-1; //data-id-track

                    ID3.loadTags(url, function () {
                        if(url.split('.')[1] == "mp3")
                            var tags = ID3.getAllTags(url);
                        else {
                            alert("Вы используете формат отличный от mp3 и поэтому metadata не определится");
                            var tags = {artist: '', title: url, album: ''};
                        }

                        $(dropbox).append("<div class='track' data-id-track='"+id+"'>" + url + " " +
                            "<span>" +Math.ceil(buffer.duration)+ "сек</span>" + "<br> " +
                            "<span class='artist'>"+tags.artist+"</span> " + " - " +
                            "<span class='title'>"+tags.title+"</span> " +
                            "</div>"
                        );
                        console.log(tags.artist + " - " + tags.title + ", " + tags.album);
                    }, {
                        dataReader: FileAPIReader(file)
                    })
                })(buffer);
            }, function (e) {
                "Error with decoding audio data" + e.err
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function handleFiles(files) {//drop area handler
        for (var i = 0; i < files.length; i++) {
            var file = files[i],
                url = file.urn || file.name;
            readerOnload(file, url);
        }
    }
    //end dropbox

    addmusic.onchange = function(){//input file handler
        var file = addmusic.files[addmusic.files.length-1],
            url = file.urn || file.name;
        readerOnload(file, url);
    };

    /**
     * draw waveform and update playback on progresbar
     */
    function visualize(){
        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        function draw(){
            $(progress).attr('value', playback);
            $(progressChar).text($("[data-id-track='"+idTrack+"']").children(".title").text()+" | "+playback+"/"+Math.ceil(songLength));

            drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = "rgb(50,50,50)";
            canvasCtx.fillRect(0,0, canvas.width, canvas.height);

            var barWidth = (canvas.width/bufferLength)*1.9;
            var barHeight;
            var x = 0;

            for(var i=0; i<bufferLength; i++){
                barHeight = dataArray[i];

                canvasCtx.fillStyle = "rgb("+(barHeight+100)+",2250,50)";
                canvasCtx.fillRect(x,canvas.height-barHeight/2, barWidth, barHeight/2);

                x += barWidth+1;
            }
        }
        draw();
    }

    function playTrack(){
        source = context.createBufferSource();
        try {
            var buffer = playlist[idTrack];
        }catch(e){
            alert("Необходимо выбрать трек, нажав на него лкм в плейлисте \n " +
                "Подсказка: drop area для файлов весь плейлист");
        }
        songLength = buffer.duration;
        source.buffer = buffer;
        source.connect(context.destination);
        source.connect(analyser);
        source.connect(gainNode);
        source.start(0, playback);

        pbackHandler = setInterval(function(){
            playback+=1;
        }, 1000);
        $(progress).attr('max', songLength);
        $(progress).attr('value', playback);

        source.onended = function() {
            console.log("onended emit");
            if(playback+5>songLength)
                next.onclick();
        };

        visualize();
        play.setAttribute('disabled', 'disabled')
    }

    function pauseTrack() {
        source.stop();

        clearInterval(pbackHandler);
        play.removeAttribute("disabled");

        cancelAnimationFrame(drawVisual);
    }
    function stopTrack(){
        pauseTrack();

        playback = 0;
        $(progress).attr('value', 0);

        $("[data-id-track='"+idTrack+"']").click();
    }

    play.onclick = playTrack;
    stop.onclick = stopTrack;
    pause.onclick = pauseTrack;

    next.onclick = function(){
        stopTrack();
        idTrack++;
        if(idTrack==playlist.length){
            idTrack = 0;
        }
        playTrack();
    };
    previous.onclick = function(){
        stopTrack();
        idTrack--;
        if(idTrack<0){
            idTrack = playlist.length-1;
        };
        playTrack();
    };

    volumeDec.onclick = function(){
        gainNode.gain.value -= 0.5;
        $(volume).text(gainNode.gain.value*10+10);
    };
    volumeInc.onclick = function(){
        gainNode.gain.value += 0.5;
        $(volume).text(gainNode.gain.value*10+10);
    };
})
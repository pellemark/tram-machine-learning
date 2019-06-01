var storedModel, video, renderPredictions;

var videos = [
    "videos/1.mp4",
    "videos/2.mp4",
    "videos/4.mp4",
    "videos/5.mp4",
    "videos/8.mp4",
    "videos/9.mp4",
    "videos/10.mp4",
    "videos/11.mp4",
    "videos/12.mp4",
    "videos/14.mp4",
    "videos/15.mp4",
];

jQuery(function () {
    var speed = 0;
    var slider = document.querySelector(".speed-slider");
    var videoContainer = document.querySelector(".video-container");
    var videoContainerWidth = videoContainer.getBoundingClientRect().width;
    var videoContainerHeight = 1100;

    video = document.getElementById('image-source');
    video.width = videoContainerWidth;
    video.height = videoContainerHeight;

    $("#image-source").bind("ended", function () {
        var current = $("#image-source").attr("src"),
            newVideo = current;

        while (newVideo == current) {
            newVideo = videos[Math.round(Math.random() * videos.length)];
        }

        console.log("new video: " + newVideo);
        $("#image-source").attr("src", newVideo);
        video.play();
    });

    // Load the model
    cocoSsd.load().then(function (model) {
        storedModel = model;
        $(".loading-overlay").hide();
        video.play();

        setInterval(
            function () {
                model.detect(video).then(predictions => {
                    renderPredictions(predictions);
                });
            },
            50
        );
    });

    var getEntityMultiplier = function (name) {
        switch (name) {
            case "person":
                return 10;
            case "car":
                return 2;
            case "bus":
            case "train":
                return 0;
            default:
                return 1;
        }
    };

    var setSpeed = function (spd) {
        speed = (spd * -1 + 200);
        slider.style['margin-top'] = speed + 'px';
    };

    var calculateJointPixels = function (ctx, predictions) {
        var jointPixels = 0;

        predictions.forEach(function (prediction) {
            var x = prediction.bbox[0];
            var y = prediction.bbox[1];
            var width = prediction.bbox[2];
            var height = prediction.bbox[3];

            for (var i = x; i < x + width; i++) {
                for (var j = height; j < y + height; j++) {
                    if (ctx.isPointInPath(i, j)) {
                        jointPixels += 1 * prediction.score * getEntityMultiplier(prediction.class);
                    }
                }
            }
        });

        return jointPixels;
    };

    renderPredictions = function (predictions) {
        const canvas = document.getElementById ("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width  = videoContainerWidth;
        canvas.height = videoContainerHeight;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Fonts
        const font = "16px sans-serif";
        ctx.font = font;
        ctx.textBaseline = "top";
        ctx.drawImage(video, 0, 0, videoContainerWidth, videoContainerHeight);

        predictions.forEach(prediction => {
            const x = prediction.bbox[0];
            const y = prediction.bbox[1];
            const width = prediction.bbox[2];
            const height = prediction.bbox[3];
            ctx.strokeStyle = "rgb(116, 185, 255)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            // Label background
            ctx.fillStyle = "rgb(116, 185, 255)";
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect(x, y, textWidth + 4, textHeight + 4);

            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.fillStyle = "rgba(116, 185, 255, 0.3)";
            ctx.fill();
        });

        predictions.forEach(prediction => {
            const x = prediction.bbox[0];
            const y = prediction.bbox[1];
            ctx.fillStyle = "#fff";
            ctx.fillText(prediction.class, x, y);
        });

        // Drawing the brake distance
        ctx.beginPath();
        ctx.moveTo(150, videoContainerHeight);
        ctx.lineTo(videoContainerWidth / 3 + 125, videoContainerHeight / 2);
        ctx.lineTo(videoContainerWidth / 3 * 2 - 125, videoContainerHeight / 2);
        ctx.lineTo(videoContainerWidth - 150, videoContainerHeight);


        var totalArea = ((videoContainerWidth + videoContainerWidth / 3 - 200) * videoContainerHeight / 2) / 2;
        var jointPixels = calculateJointPixels(ctx, predictions);

        var warningScore = jointPixels / totalArea * 100;

        if (warningScore > 8) {
            ctx.fillStyle = "rgba(214, 48, 49, 0.35)";
            // setSpeed(speed - warningScore);
        } else if (warningScore > 4) {
            ctx.fillStyle = "rgba(225, 112, 85, 0.30)";
        } else if (warningScore > 0) {
            ctx.fillStyle = "rgba(253, 203, 110, 0.25)";
        } else if (warningScore > -4) {
            ctx.fillStyle = "rgba(85, 239, 196, 0.30)";
        } else {
            ctx.fillStyle = "rgba(0, 184, 148, 0.35)";
        }

        ctx.fill();
    };
});

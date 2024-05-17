var $ = function(sel) {
    return document.querySelector(sel);
};

var inputItems = ['text', 'color', 'alpha', 'angle', 'space', 'size'];
var input = {};

var image = $('#image');
var graph = $('#graph');
var refresh = $('#refresh');
var autoRefresh = $('#auto-refresh');
var file = null;
var canvas = null;
var textCtx = null;
var repaint = null;

var dataURItoBlob = function(dataURI) {
    var binStr = atob(dataURI.split(',')[1]);
    var len = binStr.length;
    var arr = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
    }

    return new Blob([arr], { type: 'image/png' });
};

var generateFileName = function() {
    var pad = function(n) {
        return n < 10 ? '0' + n : n;
    };

    var d = new Date();
    return '' + d.getFullYear() + '-' + (pad(d.getMonth() + 1)) + '-' + (pad(d.getDate())) + ' ' + (pad(d.getHours())) + (pad(d.getMinutes())) + (pad(d.getSeconds())) + '.png';
};

var readFile = function() {
    if (!file) return;

    console.log("read a file!")

    var fileReader = new FileReader();

    fileReader.onload = function() {
        var img = new Image();
        img.onload = function() {
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            textCtx = null;

            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            repaint = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };

            drawText();

            graph.innerHTML = '';
            graph.appendChild(canvas);

            canvas.addEventListener('click', function() {
                var link = document.createElement('a');
                link.download = generateFileName();
                var imageData = canvas.toDataURL('image/png');
                var blob = dataURItoBlob(imageData);
                link.href = URL.createObjectURL(blob);
                graph.appendChild(link);

                setTimeout(function() {
                    link.click();
                    graph.removeChild(link);
                }, 100);
            });
        };
        img.src = fileReader.result;
    };
    fileReader.readAsDataURL(file);
};

var makeStyle = function() {
    var match = input.color.value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

    return 'rgba(' + (parseInt(match[1], 16)) + ',' + (parseInt(match[2], 16)) + ',' + (parseInt(match[3], 16)) + ',' + input.alpha.value + ')';
};

var drawText = function() {
    if (!canvas) return;
    var textSize = input.size.value * Math.max(15, (Math.min(canvas.width, canvas.height) / 25));
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;

    if (textCtx) {
        repaint();
    } else {
        textCtx = canvas.getContext('2d');
    }

    textCtx.save();
    textCtx.translate(centerX, centerY);
    textCtx.rotate(input.angle.value * Math.PI / 180);

    textCtx.fillStyle = makeStyle();
    textCtx.font = 'bold ' + textSize + 'px -apple-system,"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","WenQuanYi Micro Hei",sans-serif';

    var width = (textCtx.measureText(input.text.value)).width;
    var step = Math.sqrt(Math.pow(canvas.width, 2) + Math.pow(canvas.height, 2));
    var margin = (textCtx.measureText('啊')).width;

    var x = Math.ceil(step / (width + margin));
    var y = Math.ceil((step / (input.space.value * textSize)) / 2);

    for (var i = -x; i < x; i++) {
        for (var j = -y; j <= y; j++) {
            textCtx.fillText(input.text.value, (width + margin) * i, input.space.value * textSize * j);
        }
    }

    textCtx.restore();
};

image.addEventListener('change', function() {
    file = this.files[0];

    if (!(file.type in {'image/png': 1, 'image/jpeg': 1, 'image/gif': 1})) {
        return alert('仅支持 png, jpg, gif 图片格式');
    }

    readFile();
});

inputItems.forEach(function(item) {
    var el = $('#' + item);
    input[item] = el;

    autoRefresh.addEventListener('change', function() {
        if (this.checked) {
            refresh.setAttribute('disabled', 'disabled');
        } else {
            refresh.removeAttribute('disabled');
        }
    });

    el.addEventListener('input', function() {
        if (autoRefresh.checked) drawText();
    });

    refresh.addEventListener('click', drawText);
});

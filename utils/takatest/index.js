const EP_IN = 1;
const EP_OUT = 2;
const EP_BULKSIZE = 64;
const EP_BUFFERSIZE = 256;

const FRAME_SW = 640;
const FRAME_SH = 380;

const FRAME_DW = 314;
const FRAME_DH = 322;

const STATE_IDLE = 0;
const STATE_FRAME = 1;
const STATE_LEN = 2;
const STATE_MIN = 3;

const SELFTEST_USB_MAGIC = 0x54414b41;

let _state;
let _device;
let _busy;

function bufCat(b1, b2) {
  var cat = new Uint8Array(b1.byteLength + b2.byteLength);
  cat.set(new Uint8Array(b1), 0);
  cat.set(new Uint8Array(b2), b1.byteLength);
  return cat.buffer;
};

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => (
    "00" + x.toString(16).toUpperCase()
  ).slice(-2)).join(" ");
}

function show() {
  connected.style.display = "block";
  connectButton.style.display = "none";
  disconnectButton.style.display = "initial";
};

function hide() {
  connected.style.display = "none";
  connectButton.style.display = "initial";
  disconnectButton.style.display = "none";
};

function reset() {
  camContentDropBuffer();
  camContentDropCanvas();

  hide();
};

disconnectButton.onclick = async () => {
  await _device.close();

  reset();
};

connectButton.onclick = async () => {
  _device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0xffff }]
  });
  navigator.usb.ondisconnect = reset;

  await _device.open();
  await _device.selectConfiguration(1);
  await _device.claimInterface(0);

  reset();
  show();
  _state = STATE_IDLE;
  sendMagic();
  listen();
};

const sendMagic = async () => {
  const data = new Uint32Array([SELFTEST_USB_MAGIC]);
  await _device.transferOut(EP_OUT, data);
};

const listen = async () => {
  const result = await _device.transferIn(EP_IN, EP_BUFFERSIZE);
  const length = result.data.byteLength;
  // const last = ((length == 0) || ((length % EP_BULKSIZE) > 0));
  const last = ((length == 0) || (length < EP_BUFFERSIZE));
  const decoder = new TextDecoder();
  const message = decoder.decode(result.data);
  /*
  console.log("usb in:", _state);
  console.log(result.data);
  console.log(message);
  */
  const content = message.split('\0')[0];

  if (_state == STATE_IDLE) {
    camContentDropBuffer();
    _state = STATE_FRAME;
  }

  if (_state == STATE_FRAME) {
    camContentAppend(_state, result.data);
    if (last) {
      camContentEnd(_state);
      _state = STATE_LEN;
    }
  } else if (_state == STATE_LEN) {
    var minlen = result.data.getUint32();
    if (minlen > 0) {
      _state = STATE_MIN;
    } else {
      _state = STATE_IDLE;
    }
  } else if (_state == STATE_MIN) {
    camContentAppend(_state, result.data);
    if (last) {
      camContentEnd(_state);
      _state = STATE_IDLE;
    }
  }

  listen();
};

let _camMorph = new Uint8Array();
let _camMinutiaes = new Uint8Array();

function camContentDropBuffer() {
  _camMorph = new Uint8Array();
  _camMinutiaes = new Uint8Array();
}

function camContentDropCanvas() {
  var ctx;
  ctx = camCombo.getContext('2d');
  ctx.clearRect(0, 0, camCombo.width, camCombo.height);
};

function camContentAppend(type, data) {
  if (type == STATE_FRAME) {
    _camMorph = bufCat(_camMorph, data.buffer);
  } else if (type == STATE_MIN) {
    _camMinutiaes = bufCat(_camMinutiaes, data.buffer);
  }
};

function camCanvasDrawImage(canvas, data, w, h, zoom) {
  canvas.width = w * zoom;
  canvas.height = h * zoom;
  var ctx = canvas.getContext("2d");
  var rgbaImage = ctx.createImageData(w, h);

  var i = 0, j = 0;
  while (i < rgbaImage.data.length && j < data.byteLength) {
    rgbaImage.data[i]   = data[j];      /* R */
    rgbaImage.data[i+1] = data[j];      /* G */
    rgbaImage.data[i+2] = data[j];      /* B */
    rgbaImage.data[i+3] = 255;          /* A */

    /* Next pixel */
    i += 4;
    j += 1;
  }

  // ctx.putImageData(rgbaImage, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  createImageBitmap(rgbaImage).then(img =>
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  );
}

function camCanvasDrawMinutiaes(canvas, pts, zoom) {
  var ctx = canvas.getContext("2d");
  const qmin = 40;
  var total = 0;
  ctx.lineWidth = zoom;

  pts.forEach(p => {

    // if (p.type != 0) {
      let alpha = p.angle * (Math.PI / 180.0);
      let dx = Math.cos(alpha) * 10;
      let dy = -Math.sin(alpha) * 10;

      /* blue -> green scale */
      let q = (p.quality - qmin) * 100 / (100 - qmin);
      let green = Math.floor(q * 2.55);
      green = ("00" + green.toString(16)).substr(-2);
      let blue = Math.floor((100-q) * 2.55);
      blue = ("00" + blue.toString(16)).substr(-2);

      if (p.type != 0) {
      var color = "#00" + green + blue;
      } else {
      var color = "#ff" + green + blue;
      }

      ctx.fillStyle = color;
      ctx.fillRect((p.x-1)*zoom, (p.y-1)*zoom, 3*zoom, 3*zoom);

      ctx.beginPath();
      ctx.moveTo(p.x * zoom, p.y * zoom);
      ctx.lineTo((p.x + dx) * zoom, (p.y + dy) * zoom);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.stroke();

      total += 1;
      // if (total >= 35) {
      //   return;
      // }
    // }
  })
}

function camContentEnd(type) {
  if (type == STATE_FRAME) {
    var data = new Uint8Array(_camMorph);
    camContentDropCanvas();
    camCanvasDrawImage(camCombo, data, FRAME_DW, FRAME_DH, 2);

  } else if (type == STATE_MIN) {
    var data = new Uint8Array(_camMinutiaes);
    var pts = min_record_decode(data);
    camCanvasDrawMinutiaes(camCombo, pts, 2);
  }
}

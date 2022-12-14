const EP_IN = 1;
const EP_OUT = 2;
const EP_BULKSIZE = 64;
const EP_BUFFERSIZE = 256;

const USB_CMD_GETVERSION = 0x00;
const USB_CMD_GETARCH = 0x01;
    /* Followed by 1 byte for ARCH container number 0-3 */
const USB_CMD_GETICAO = 0x02;
    /* Followed by 1 byte for DG number 0-15 */
const USB_CMD_GETLOGS = 0x03;
    /* Followed by 8 ascii bytes for YYYYMMDD */
const USB_CMD_GETFRAME_RAW = 0x04;
const USB_CMD_GETFRAME_MORPH = 0x05;
const USB_CMD_GETMINUTIAES_FMR = 0x06;
const USB_CMD_GETUNIQUEID = 0x07;

const FRAME_SW = 640;
const FRAME_SH = 380;

const FRAME_DW = 314;
const FRAME_DH = 322;

const LOGS_FIELDS_NB = 9;

let _device;
let _cmd;
let _fnum;
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
  archContentDrop();
  icaoContentDrop();
  camContentDrop();
  logsTableDrop();
  takaVersionDrop();
  takaUniqueIDDrop();

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

  show();
  getVersion();
  listen();
};

const getVersion = async () => {
  _cmd = USB_CMD_GETVERSION;
  const data = new Uint8Array([_cmd]);
  await _device.transferOut(EP_OUT, data);
};

const getUniqueID = async () => {
  _cmd = USB_CMD_GETUNIQUEID;
  const data = new Uint8Array([_cmd]);
  await _device.transferOut(EP_OUT, data);
};

const getArch = async (num) => {
  _cmd = USB_CMD_GETARCH;
  _fnum = num;
  const data = new Uint8Array([_cmd, _fnum]);
  await _device.transferOut(EP_OUT, data);
};

archButton.onclick = async () => {
  archContentDrop();
  getArch(0); /* Queue the read for the first ARCH container */
};

const getIcao = async (num) => {
  _cmd = USB_CMD_GETICAO;
  _fnum = num;
  const data = new Uint8Array([_cmd, _fnum]);
  await _device.transferOut(EP_OUT, data);
};

icaoButton.onclick = async () => {
  icaoContentDrop();
  getIcao(0); /* Queue the read for the first ICAO DG file */
};

const getCamFrame = async (num) => {
  _cmd = USB_CMD_GETFRAME_RAW;
  const data = new Uint8Array([_cmd]);
  await _device.transferOut(EP_OUT, data);
};

const getCamMorph = async (num) => {
  _cmd = USB_CMD_GETFRAME_MORPH;
  const data = new Uint8Array([_cmd]);
  await _device.transferOut(EP_OUT, data);
};

const getCamMinutiaes = async (num) => {
  _cmd = USB_CMD_GETMINUTIAES_FMR;
  const data = new Uint8Array([_cmd]);
  await _device.transferOut(EP_OUT, data);
};

camButton.onclick = async () => {
  camContentDrop();
  getCamFrame();
};

logsButton.onclick = async () => {
  logsTableDrop();
  _cmd = USB_CMD_GETLOGS;
  const day = logsDate.value.replace(/-/g, "");
  const encoder = new TextEncoder();
  const data = new Uint8Array(1 + 8);
  data[0] = _cmd;
  data.set(encoder.encode(day), 1);
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
  console.log("usb in:", _cmd, _fnum);
  console.log(result.data);
  console.log(message);
  */
  const content = message.split('\0')[0];

  if (_cmd == USB_CMD_GETVERSION) {
    takaVersionSet(content);
    getUniqueID();
  } else if (_cmd == USB_CMD_GETUNIQUEID) {
    takaUniqueIDSet(result.data.buffer);
  } else if (_cmd == USB_CMD_GETARCH) {
    archContentAppend(_fnum, result.data);
    if (last) {
      if (_fnum + 1 < 4) {
        getArch(_fnum + 1); /* Queue the read for the next ARCH container */
      }
    }
  } else if (_cmd == USB_CMD_GETICAO) {
    icaoContentAppend(_fnum, result.data);
    if (last) {
      icaoContentEnd(_fnum);
      if (_fnum + 1 < 16) {
        getIcao(_fnum + 1); /* Queue the read for the next ICAO DG file */
      }
    }
  } else if (_cmd == USB_CMD_GETLOGS) {
    logsTableAppend(content);
    if (last) {
      logsTableEnd();
    }
  } else if (_cmd == USB_CMD_GETFRAME_RAW) {
    camContentAppend(_cmd, result.data);
    if (last) {
      camContentEnd(_cmd);
      getCamMorph(); /* Queue the read for morph frame */
    }
  } else if (_cmd == USB_CMD_GETFRAME_MORPH) {
    camContentAppend(_cmd, result.data);
    if (last) {
      camContentEnd(_cmd);
      getCamMinutiaes(); /* Queue the read for minutiaes */
    }
  } else if (_cmd == USB_CMD_GETMINUTIAES_FMR) {
    camContentAppend(_cmd, result.data);
    if (last) {
      camContentEnd(_cmd);
    }
  }

  listen();
};

function takaVersionDrop() {
  takaVersion.innerText = "D??connect??";
};

function takaVersionSet(version) {
  takaVersion.innerText = "Connect?? ?? Taka " + version;
};

function takaUniqueIDDrop() {
  takaUniqueID.innerText = "";
};

function takaUniqueIDSet(uniqueid) {
  takaUniqueID.innerText = "Taka Unique ID: " + buf2hex(uniqueid);
};

let _logsBuffer;

function logsTableDrop() {
  _logsBuffer = "";
  logsTable.innerHTML = "";
};

function logsTableAppend(message) {
  _logsBuffer += message;
  const lines = _logsBuffer.split("\n");
  lines.forEach(line => {

    const fields = line.split(",");
    if (fields.length == LOGS_FIELDS_NB) {

      let row = logsTable.insertRow(-1);
      fields.forEach(field => {
        let cell = row.insertCell(-1);
        cell.innerHTML = field.replace(/</g, " ");
      });
    } else {
      _logsBuffer = line;
      return;
    }
  })
};

function logsTableEnd() {
  if (logsTable.rows.length == 0) {
    logsTable.innerText = "<empty logs>";
  }
}

function archContentDrop() {
  archContent0.innerText = "";
  archContent1.innerText = "";
  archContent2.innerText = "";
  archContent3.innerText = "";
};

function archContentAppend(num, data) {
  var message = arch_as_text(new Uint8Array(data.buffer));

  if (num == 0) {
    archContent0.innerText += message;
  } else if (num == 1) {
    archContent1.innerText += message;
  } else if (num == 2) {
    archContent2.innerText += message;
  } else if (num == 3) {
    archContent3.innerText += message;
  }
};

let _icaoBufs = [];
for (let i=0; i<16; i++) {
  _icaoBufs.push(new Uint8Array());
}

function icaoContentDrop() {
  for (let i=0; i<16; i++) {
    _icaoBufs[i] = new Uint8Array();

    if (i == 1) {
      var ctx = icaoContent1.getContext('2d');
      ctx.clearRect(0, 0, icaoContent1.width, icaoContent1.height);
    } else {
      var icaoContent = document.getElementById("icaoContent" + i);
      icaoContent.innerText = "";
    }
  }
};

function icaoContentAppend(num, data) {
  _icaoBufs[num] = bufCat(_icaoBufs[num], data.buffer);
};

function icaoContentEnd(num) {
  if (num == 0) {
    icaoShowMRZ();
  } else if (num == 1) {
    icaoShowFace();
  } else {
    icaoShowAsHex(num, 256);
  }
}

function icaoShowAsHex(num, maxsize) {
  var length = _icaoBufs[num].byteLength;
  if (length == 0) {
    var content = "<empty file>";
  } else {
    var content = buf2hex(_icaoBufs[num]);
  }
  var icaoContent = document.getElementById("icaoContent" + num);
  icaoContent.innerText = content;
}

function icaoShowAsPrintableAscii(num) {
  const decoder = new TextDecoder();
  const message = decoder.decode(_icaoBufs[num]);
  var content = message.split('\0')[0];

  content = content.replace(/[^\x20-\x7E]/g, "");
  var icaoContent = document.getElementById("icaoContent" + num);
  icaoContent.innerText = content;
}

function icaoShowMRZ() {
  var mrz = icao_decode_tlv(new Uint8Array(_icaoBufs[0]),
                            ICAO_TAG_MRZ_DATA_ELEMENTS);
  if (mrz < 0) {
    console.log("ICAO: cant decode MRZ");
    return;
  }
  const decoder = new TextDecoder();
  const message = decoder.decode(mrz);
  const content = message.split('\0')[0];

  icaoContent0.innerText = content;
}

function icaoShowFace() {
  var bdb = icao_decode_tlv(new Uint8Array(_icaoBufs[1]),
                            ICAO_TAG_BIOMETRIC_DATA_BLOCK);
  if (bdb < 0) {
    console.log("ICAO: cant decode TLV");
    return;
  }

  var face = icao_decode_bdb(bdb);
  if (face < 0) {
    console.log("ICAO: cant decode BDB");
    return;
  }

  var rgbImage = openjpeg(face, "jp2");
  var canvas = icaoContent1;
  canvas.width = rgbImage.width * 2;
  canvas.height = rgbImage.height * 2;

  var pixelsPerChannel = rgbImage.width * rgbImage.height;
  var ctx = canvas.getContext("2d");
  var rgbaImage = ctx.createImageData(rgbImage.width, rgbImage.height);

  var i = 0, j = 0;
  while (i < rgbaImage.data.length && j < pixelsPerChannel) {
    rgbaImage.data[i] = rgbImage.data[j];                           /* R */
    rgbaImage.data[i+1] = rgbImage.data[j + pixelsPerChannel];      /* G */
    rgbaImage.data[i+2] = rgbImage.data[j + 2*pixelsPerChannel];    /* B */
    rgbaImage.data[i+3] = 255;                                      /* A */

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

let _camFrame = new Uint8Array();
let _camMorph = new Uint8Array();
let _camMinutiaes = new Uint8Array();

function camContentDrop() {
  var ctx;
  _camFrame = new Uint8Array();
  _camMorph = new Uint8Array();
  _camMinutiaes = new Uint8Array();

  ctx = camFrame.getContext('2d');
  ctx.clearRect(0, 0, camFrame.width, camFrame.height);
  ctx = camMorph.getContext('2d');
  ctx.clearRect(0, 0, camMorph.width, camMorph.height);
  ctx = camCombo.getContext('2d');
  ctx.clearRect(0, 0, camCombo.width, camCombo.height);

  camMinutiaesDrop();
};

function camContentAppend(type, data) {
  if (type == USB_CMD_GETFRAME_RAW) {
    _camFrame = bufCat(_camFrame, data.buffer);
  } else if (type == USB_CMD_GETFRAME_MORPH) {
    _camMorph = bufCat(_camMorph, data.buffer);
  } else if (type == USB_CMD_GETMINUTIAES_FMR) {
    _camMinutiaes = bufCat(_camMinutiaes, data.buffer);
  }
};

function camMinutiaesDrop() {
  camMinutiaesTable.innerHTML = "";
  camMinutiaesKDE.innerHTML = "";
  camMinutiaesHex.innerText = "";
}

function camMinutiaesShowAsHex() {
  var length = _camMinutiaes.byteLength;
  if (length == 0) {
    var content = "<empty>";
  } else {
    var content = buf2hex(_camMinutiaes);
  }
  camMinutiaesHex.innerText = content;
}

function camMinutiaesFillTable(pts) {
  pts.forEach(p => {
    let row = camMinutiaesTable.insertRow(-1);

    row.insertCell(-1).innerHTML = p.type;
    row.insertCell(-1).innerHTML = p.x;
    row.insertCell(-1).innerHTML = p.y;
    row.insertCell(-1).innerHTML = p.angle;
    row.insertCell(-1).innerHTML = p.quality;
  })

  if (camMinutiaesTable.rows.length == 0) {
    camMinutiaesTable.innerText = "<no minutiaes>";
  }
}

function camMinutiaesFillKDE(pts) {
  var quals = pts.map(p => p.quality);
  if (quals.length > 0) {
    kdeShow("#camMinutiaesKDE", quals);
  }
}

/*
camMinutiaesHex.onchange = function(e) {
  camMinutiaesDrop();

  var data = new Uint8Array(e.target.value
                            .replace(/ /g, "")
                            .match(/.{2}/g)
                            .map(byte => parseInt(byte, 16)));
  var pts = min_record_decode(data);

  camMinutiaesFillTable(pts);
  camMinutiaesFillKDE(pts);

  // XXX camCanvasDrawMinutiaes(camCombo, pts, 2);
}
*/

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

    if (p.type != 0) {
      let alpha = p.angle * (Math.PI / 180.0);
      let dx = Math.cos(alpha) * 10;
      let dy = -Math.sin(alpha) * 10;

      /* blue -> green scale */
      let q = (p.quality - qmin) * 100 / (100 - qmin);
      let green = Math.floor(q * 2.55);
      green = ("00" + green.toString(16)).substr(-2);
      let blue = Math.floor((100-q) * 2.55);
      blue = ("00" + blue.toString(16)).substr(-2);
      let color = "#00" + green + blue;

      ctx.fillStyle = color;
      ctx.fillRect((p.x-1)*zoom, (p.y-1)*zoom, 3*zoom, 3*zoom);

      ctx.beginPath();
      ctx.moveTo(p.x * zoom, p.y * zoom);
      ctx.lineTo((p.x + dx) * zoom, (p.y + dy) * zoom);
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.stroke();

      total += 1;
      if (total >= 35) {
        return;
      }
    }
  })
}

function camContentEnd(type) {
  if (type == USB_CMD_GETFRAME_RAW) {
    var data = new Uint8Array(_camFrame);
    camCanvasDrawImage(camFrame, data, FRAME_SW, FRAME_SH, 1);

  } else if (type == USB_CMD_GETFRAME_MORPH) {
    var data = new Uint8Array(_camMorph);
    camCanvasDrawImage(camMorph, data, FRAME_DW, FRAME_DH, 1);
    camCanvasDrawImage(camCombo, data, FRAME_DW, FRAME_DH, 2);

  } else if (type == USB_CMD_GETMINUTIAES_FMR) {
    var data = new Uint8Array(_camMinutiaes);
    var pts = min_record_decode(data);
    camMinutiaesFillTable(pts);
    camMinutiaesFillKDE(pts);
    camMinutiaesShowAsHex();
    camCanvasDrawMinutiaes(camCombo, pts, 2);
  }
}

window.onload = function(e) {
  var today = new Date().toISOString().split('T')[0];
  logsDate.setAttribute('value', today);
};

/*
 * Minuties format from fingerjet library:
 *
 * ISO/IEC 19794-2:2005
 * Record format:
 *
 * Size         Field                               Info
 *
 * 4 bytes      Format Identifier                   0x464D5200 "FMR"
 * 4 bytes      Version Number                      n n n 0x0
 * 4 bytes      Record Length                       >= 24
 * 4 bits       Capture Equipment Certification
 * 12 bits      Capture Device Type ID
 * 2 bytes      Image Size in X                     pixels
 * 2 bytes      Image Size in Y                     pixels
 * 2 bytes      X (horizontal) Resolution           pixels/cm
 * 2 bytes      Y (vertical) Resolution             pixels/cm
 * 1 byte       Number of Finger Views
 * 1 byte       Reserved
 *
 * For each view:
 *
 * 1 byte       Finger Position
 * 4 bits       View Number
 * 4 bits       Impression Type
 * 1 byte       Finger Quality
 * 1 byte       Number of Minutiae
 *
 * For each minutiae:
 *
 * 2 bits       Minutiae type
 * 14 bits      Position X                          pixels
 * 2 bits       Reserved
 * 14 bits      Position Y                          pixels
 * 1 byte       Angle                               1.40625 deg increments
 * 1 byte       Quality
 *
 * For each view:
 *
 * 2 bytes      Extended Data Block Length          0x0000
 *
 * */

function min_record_decode(fmr)
{
    var i, p;
    var o = new Array();
    var len = fmr.byteLength;
    var count;
    const sizeofrec = 6;

    if (len <= 30) {
        return new Uint8Array();
    }

    /* Number of minutiaes */

    count = fmr[27];

    /* Skip header */

    p = fmr.subarray(28);

    /* Decode minutiaes in ISO record format */

    for (i=0; i<count; i++)
    {
        /* Read one record */

        s = p.subarray(i*sizeofrec, (i+1)*sizeofrec);

        var x = (s[0] << 8) | s[1];
        var y = (s[2] << 8) | s[3];
        var angle = s[4];
        var quality = s[5];

        /* Output one point */

        var pts = new Object();
        pts.type = x >> 14;
        pts.x = x & 0x3fff;
        pts.y = y;
        pts.angle = angle * 360.0 / 256.0;
        pts.quality = quality;

        // console.log(pts.type, "\t", pts.x, "\t", pts.y, "\t", pts.angle, "\t", pts.quality);
        o.push(pts);
    }

    return o;
}

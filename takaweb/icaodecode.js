const ICAO_TAG_INTEGER                                    = 0x02;
const ICAO_TAG_TEMPLATE_FOR_MRZ_DATA_GROUP                = 0x61;
const ICAO_TAG_TEMPLATE_FOR_FACIAL_BIOMETRIC_DATA_GROUP   = 0x75;
const ICAO_TAG_CONTEXT_SPECIFIC_TAGS                      = 0x80;

const ICAO_TAG_MRZ_DATA_ELEMENTS                          = 0x5F1F;

const ICAO_TAG_BIOMETRIC_DATA_BLOCK                       = 0x5F2E;
const ICAO_TAG_BIOMETRIC_DATA_BLOCK_ENCIPHERED            = 0x7F2E;
const ICAO_TAG_BIOMETRIC_INFORMATION_TEMPLATE             = 0x7F60;
const ICAO_TAG_BIOMETRIC_INFORMATION_GROUP_TEMPLATE       = 0x7F61;

const ICAO_BDB_HEADER_LEN                                 = 46;

function icao_get_tag(buf)
{
    var len = buf.byteLength;

    /* 4.3.1 Data elements encoding normative note */

    if (len < 1) {
        return [-1, 0];
    }

    if ((buf[0] & 0x1f) != 0x1f) {
        return [buf[0], 1];
    }

    if (len < 2) {
        return [-1, 0];
    }

    return [(buf[0] << 8) | buf[1], 2];
}

function icao_get_len(buf)
{
    var len = buf.byteLength;

    /* 4.3.3 Length encoding rules for ASN.1 BER TLV Data Object */

    if (len < 1) {
        return [-1, 0];
    }

    if ((buf[0] & 0x80) == 0) {
        return [buf[0], 1];
    }

    if (buf[0] == 0x81) {
        if (len < 2) {
            return [-1, 0];
        }

        return [buf[1], 2];
    }

    if (buf[0] == 0x82) {
        if (len < 3) {
            return [-1, 0];
        }

        return [(buf[1] << 8) | buf[2], 3];
    }

    return [-1, 0];
}

function icao_decode_bdb(buf)
{
    var face;
    var size = buf.byteLength;

    if (size < 4) {
        return -1;
    }

    if ((buf[0] != 0x46) || (buf[1] != 0x41) ||
        (buf[2] != 0x43) || (buf[3] != 0x00)) {
        return -1;
    }

    face = buf.subarray(ICAO_BDB_HEADER_LEN);
    // console.log("face !", face);

    return face;
}

function icao_decode_tlv(buf, search)
{
    var ret;
    var tag;
    var len;
    var p = buf;

    ret = icao_get_tag(p);
    if (ret[0] < 0) {
        return ret[0];
    }

    tag = ret[0];
    consumed = ret[1];
    p = p.subarray(consumed);
    ret = icao_get_len(p);
    if (ret[0] < 0) {
        return ret[0];
    }

    len = ret[0];
    consumed = ret[1];
    p = p.subarray(consumed);

    /* Branch based on Tag */

    // console.log("tag:", tag, "length:", len);

    if (tag == ICAO_TAG_INTEGER) {
        p = p.subarray(len);
    } else if ((tag & ICAO_TAG_CONTEXT_SPECIFIC_TAGS) ==
                      ICAO_TAG_CONTEXT_SPECIFIC_TAGS) {
        p = p.subarray(len);
    } else if (search == tag) {
        return p.subarray(0, len);
    }

    /* Recusive decoding */

    return icao_decode_tlv(p, search);
}

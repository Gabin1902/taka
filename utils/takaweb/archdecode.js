const ARCH_IDEMIA_TAG_HEALTH                = 0x56; /* 'V' */

const ARCH_DERMALOG_TAG_HEALTH              = 0x6e;
const ARCH_DERMALOG_TAG_EXPIRATION_DATE     = 0x5F24;
const ARCH_DERMALOG_TAG_EFFECTIVE_DATE      = 0x5F25;
const ARCH_DERMALOG_TAG_AS_IDEMIA           = 0x53;
const ARCH_DERMALOG_TAG_CRYPTO              = 0x7F3D;
const ARCH_DERMALOG_TAG_CRYPTO_IV           = 0x53;
const ARCH_DERMALOG_TAG_CRYPTO_CIPHER       = 0x5F3D;

function tlv_get_tag(buf)
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

function tlv_get_len(buf)
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

function arch_extract_der_dermalog(buf)
{
    var ret;
    var tag;
    var len;
    var p = buf;

    /* Check tag */

    ret = tlv_get_tag(p);
    if (ret[0] < 0) {
        return "";
    }

    tag = ret[0];
    consumed = ret[1];
    p = p.subarray(consumed);

    /* Check length */

    ret = tlv_get_len(p);
    if (ret[0] < 0) {
        return "";
    }

    len = ret[0];
    consumed = ret[1];
    p = p.subarray(consumed);

    /* Branch based on Tag */

    console.log("tag:", tag, "length:", len);

    if (tag == ARCH_DERMALOG_TAG_AS_IDEMIA) {

        /* This is the text, return it */

        var chunk = p.subarray(0, len);
        const decoder = new TextDecoder();
        const message = decoder.decode(chunk);
        const content = message.split('\0')[0];
        console.log(content);
        return content;
    }

    else
    {
        /* Ignore Value */

        p = p.subarray(len);
    }

    return arch_extract_der_dermalog(p);
}

function arch_as_text(buf)
{
    var ret;
    var tag;
    var len;
    var p = buf;

    /* Check tag */

    ret = tlv_get_tag(p);
    if (ret[0] < 0) {
        return "";
    }

    tag = ret[0];

    if (tag == ARCH_DERMALOG_TAG_HEALTH) {
        // console.log("ARCH: Dermalog");

        /* This is Dermalog, extract the text */

        consumed = ret[1];
        p = p.subarray(consumed);

        /* Check length */

        ret = tlv_get_len(p);
        if (ret[0] < 0) {
            return "";
        }

        len = ret[0];
        consumed = ret[1];
        p = p.subarray(consumed);

        return "DERMALOG:\n" + arch_extract_der_dermalog(p.subarray(0, len));

    } else {
        // console.log("ARCH: Idemia");

        /* This is Idemia, already text */

        const decoder = new TextDecoder();
        const message = decoder.decode(p);
        const content = message.split('\0')[0];
        return "IDEMIA:\n" + content;
    }
}

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>

#include <nfc/nfc-types.h>
#include <nfc/nfc.h>

#include "minutiaes.h"

uint8_t APDU_SELECT_AID[] = {
    0x00, 0xA4, 0x04, 0x00, 0x0E, 0xE8, 0x28, 0xBD,
    0x08, 0x0F, 0xD2, 0x50, 0x47, 0x65, 0x6E, 0x65,
    0x72, 0x69, 0x63, 0x00
};

uint8_t APDU_READ_BIT[] = {
    0x00, 0xCB, 0x3F, 0xFF, 0x0E, 0x4d, 0x0c, 0x70,
    0x0a, 0xbf, 0x82, 0x01, 0x06, 0x7F, 0x50, 0x03,
    0x7f, 0x60, 0x80, 0x00
};

uint8_t APDU_VERIFY_FING[] = {
    0x00, 0x21, 0x00, 0x81,
    00,
    0x7f, 0x2E,
    00,
    0x81,
    00,
};

// unsigned char BUF_5130159536_2_OK[] = { /* official WSQ with fingerjet for 5130159536_2 OK */
//     0x47, 0x2b, 0x5c, 0x34, 0x3c, 0x61, 0x4b, 0x3d, 0xbb, 0x45, 0x45, 0x79, 0x37, 0x52, 0x7d, 0x19,
//     0x58, 0x65, 0x29, 0x58, 0xa5, 0x0d, 0x5f, 0x84, 0x1e, 0x62, 0x85, 0x66, 0x63, 0xb4, 0x1a, 0x6c,
//     0x44, 0x54, 0x6f, 0xab, 0x1e, 0x73, 0x42, 0x5f, 0x74, 0xaa, 0x57, 0x7e, 0x4c, 0x49, 0x9b, 0x83,
// };

void make_verify_apdu(char *in, int in_len, char *out, int *outlen)
{
    memcpy(out, APDU_VERIFY_FING, sizeof(APDU_VERIFY_FING));
    memcpy(out+sizeof(APDU_VERIFY_FING), in, in_len);
    out[9] = in_len;
    out[7] = in_len + 2;
    out[4] = in_len + 5;
    out[in_len + sizeof(APDU_VERIFY_FING)] = 0;
    *outlen = in_len + sizeof(APDU_VERIFY_FING) +1;
}

#define MAXSIZE 8192

#define MAX_DEVICE_COUNT 10
#define MAX_TARGET_COUNT 10

int verify(nfc_device *pnd, unsigned char *outbuf, int outlen)
{
    int i;
    int ret;
    unsigned char inbuf[200];

    printf("submit verify:\n");
    for(i=0; i<outlen; i++) {
        printf("%02x ", outbuf[i]);
    }
    printf("\n");

    ret = nfc_initiator_transceive_bytes(pnd, outbuf, outlen, inbuf, sizeof(inbuf), 0);
    printf("verify ret: (%d) ", ret);
    for(i=0; i<ret; i++){
        printf("%02x ", inbuf[i]);
    }
    printf("\n");

    if ((ret == 2) && (inbuf[0] == 0x90) && (inbuf[1] == 0x00)) {
        printf("SUCCESS\n");
        return 0;
    } else {
        printf("REJECT\n");
        return -1;
    }
}

int get_compact(const char *path, int minquality, int mincount, unsigned char **out, int *outlen)
{
    int ret;

    struct pts_s *pts = NULL;
    size_t pts_count;

    uint8_t *minutiaes = NULL;
    size_t minutiaes_len;

    uint8_t *compact = NULL;
    size_t compact_length;

    FILE *in;

    int maxcount = mincount; /* Get this amount exactly */
    int score;

    in = fopen(path, "rb");
    if (!in) {
        printf("ERROR fopen %s\n", path);
        return -1;
    }

    /* Read the file */

    minutiaes = malloc(MAXSIZE);
    memset(minutiaes, 0, MAXSIZE);

    minutiaes_len = fread(minutiaes, 1, MAXSIZE, in);
    fclose(in);

    if (minutiaes_len <= 0) {
        printf("ERROR fread: %ld\n", minutiaes_len);
        return -1;
    }

    /* Decode minutiaes from record format */

    ret = min_record_decode(minutiaes, minutiaes_len, &pts, &pts_count);
    if (ret != OK) {
        printf("ERROR min_record_decode: %d\n", ret);
        return -1;
    }
    printf("min_record_decode: %ld points total\n", pts_count);
    pts_print(pts, pts_count);

    /* Discard bad quality points */

    ret = pts_quality_threshold(pts, &pts_count, minquality,
                                mincount, maxcount, &score);
    if (ret != OK)
      {
        printf("ERROR not enough quality points\n");
        free(pts);
        return -1;
      }
    printf("pts_quality_threshold: %ld points good quality\n", pts_count);

    /* Sort by Y */

    pts_sort(pts, pts_count);
    printf("pts_quality_threshold: %ld points good quality\n", pts_count);
    pts_print(pts, pts_count);

    /* Encode to card compact format */

    ret = min_compact_encode(pts, pts_count, &compact, &compact_length);
    if (ret != OK)
      {
        printf("ERROR compact encode\n");
        free(pts);
        return -1;
      }

    printf("Compact format:");
    for (int i=0; i<compact_length; i++)
      {
        if (i%16 == 0)
            printf("\n");
        printf("0x%02x, ", compact[i]);
      }
    printf("\n");

    *out = compact;
    *outlen = compact_length;

    free(pts);
    return 0;
}

int get_good(unsigned char **out, int *outlen, const char *path)
{
    int ret;
    unsigned char *good;
    FILE *in;

    in = fopen(path, "rb");
    if (!in) {
        printf("ERROR fopen %s\n", path);
        return -1;
    }

    /* Read the file */

    good = malloc(MAXSIZE);
    memset(good, 0, MAXSIZE);

    ret = fread(good, 1, MAXSIZE, in);
    fclose(in);

    *out = good;
    *outlen = ret;

    return 0;
}

int main(int argc, char **argv)
{
    int i;
    int ret;
    nfc_context *context;
    nfc_device* pnd;
    nfc_connstring connstrings[MAX_DEVICE_COUNT];
    nfc_target ant[MAX_TARGET_COUNT];
    unsigned char inbuf[200];
    unsigned char outbuf[200];
    int outlen;
    unsigned char *compact;
    int compactlen;
    unsigned char *good;
    int goodlen;
    size_t ref_device_count;
    int quality = 40;
    int num;
    char *path;

    if (argc < 3) {
        printf("usage: %s goodcompact testing.ist\n", argv[0]);
        return -1;
    }

    /* get the good compact buffer */

    ret = get_good(&good, &goodlen, argv[1]);
    if (ret != 0) {
        printf("ERROR in get_good: %d\n", ret);
        return -1;
    }
    path = argv[2];

    /* connect */

    nfc_init(&context);
    if (context == NULL) {
        printf("Unable to init libnfc (malloc)\n");
        exit(EXIT_FAILURE);
    }
    ref_device_count = nfc_list_devices(context, connstrings, MAX_DEVICE_COUNT);

    printf("conn: %s\n", connstrings[0]);
    pnd = nfc_open(context, connstrings[0]);

    if (pnd == NULL) {
        printf("ERROR: %s\n", "Unable to open NFC device.");
        exit(EXIT_FAILURE);
    }

    if (nfc_initiator_init(pnd) < 0) {
        nfc_perror(pnd, "nfc_initiator_init");
        exit(EXIT_FAILURE);
    }

    const nfc_modulation nm = {
        .nmt = NMT_ISO14443A,
        .nbr = NBR_106,
    };

    ret =  nfc_initiator_select_passive_target(pnd, nm, NULL, 0, ant);

    /* select app */

    printf("Sending select:\n");
    for(i=0; i<sizeof(APDU_SELECT_AID); i++) {
        printf("%02x ", APDU_SELECT_AID[i]);
    }
    printf("\n");

    ret =  nfc_initiator_transceive_bytes(pnd, APDU_SELECT_AID, sizeof(APDU_SELECT_AID), inbuf, sizeof(inbuf), 0);
    printf("select ret: (%d) ", ret);
    for(i=0; i<ret; i++) {
        printf("%02x ", inbuf[i]);
    }
    printf("\n");

    /**/

    for (num=15; num<70; num++) {

        /* check with a test buffer */

        ret = get_compact(path, quality, num, &compact, &compactlen);
        if (ret != 0) {
            printf("Cannot get compact %d, %d\n", quality, num);
            continue;
        }
        make_verify_apdu(compact, compactlen, outbuf, &outlen);
        free(compact);

        /* verify */

        printf("\nSubmit test buffer\n\n");
        ret = verify(pnd, outbuf, outlen);

        /* prepare a good verify buffer */

        make_verify_apdu(good, goodlen, outbuf, &outlen);

        /* verify */

        printf("\nSubmit good buffer\n\n");
        ret = verify(pnd, outbuf, outlen);
        if (ret != 0) {
            printf("ALERT: good known buffer did not work!\n");
            return ret;
        }

        sleep(1);
        printf("\nPress Enter...\n\n");
        getchar();
    }

    free(good);
    return 0;
}

        /*
        for(i=0; i<outlen; i++) {
            printf("%02x ", outbuf[i]);
        }
        printf("\n");
        */


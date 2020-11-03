#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#include "minutiaes.h"

#define MAXSIZE 8192

int main(int argc, char *argv[])
{
    int ret;

    struct pts_s *pts = NULL;
    size_t pts_count;

    uint8_t *minutiaes = NULL;
    size_t minutiaes_len;

    uint8_t *compact = NULL;
    size_t compact_length;

    FILE *in;
    FILE *out;

    int minquality;
    int mincount;
    int score;

    if (argc < 5) {
        printf("usage: %s minutiaes.ist minquality mincount outfile.bin\n", argv[0]);
        return -1;
    }

    in = fopen(argv[1], "rb");
    if (!in) {
        printf("ERROR fopen %s\n", argv[1]);
        return -1;
    }

    out = fopen(argv[4], "wb");
    if (!out) {
        printf("ERROR fopen %s\n", argv[4]);
        fclose(in);
        return -1;
    }

    minquality = atoi(argv[2]);
    mincount = atoi(argv[3]);

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

    ret = pts_quality_threshold(pts, &pts_count, minquality, mincount, &score);
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

    /* Dump compact to file */

    fwrite(compact, 1, compact_length, out);
    fclose(out);

    free(compact);
    free(pts);
    return 0;
}

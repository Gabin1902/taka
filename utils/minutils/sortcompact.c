
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#include "cam.h"
#include "minutiaes.h"

#define MAX_POINTS  100

int main(int argc, char **argv)
{
    int ret;
    FILE *in;
    FILE *out;
    size_t count;
    struct pts_s points[MAX_POINTS];
    uint8_t x, y, z;
    uint8_t *compact;
    size_t compact_length;
    int score;

    if (argc < 3) {
        printf("usage: %s compact_in.bin, compact_out.bin\n", argv[0]);
        return -1;
    }

    in = fopen(argv[1], "rb");
    if (!in) {
        printf("ERROR fopen %s\n", argv[1]);
        return -1;
    }

    out = fopen(argv[2], "wb");
    if (!out) {
        printf("ERROR fopen %s\n", argv[2]);
        fclose(in);
        return -1;
    }

    /* Read compact input file */

    count = 0;
    memset(points, 0, sizeof(struct pts_s) * MAX_POINTS);

    do {
        fscanf(in, "%c%c%c", &x, &y, &z);

        min_compact_decode(x, y, z, &points[count++]);
        if (count >= MAX_POINTS)
        {
            printf("MAX_POINTS reached! (%d)\n", MAX_POINTS);
            break;
        }

    } while (!feof(in));

    fclose(in);

    /* Sort points */

    ret = pts_quality_threshold(points, &count,
                            CAM_SCORE_THRESHOLD,
                            CAM_MIN_POINTS_NB, CAM_MAX_POINTS_NB,
                            true, &score);
    if (ret != OK)


    pts_sort(points, count);
    pts_print(points, count);

    ret = min_compact_encode(points, count, &compact, &compact_length);
    if (ret != OK)
    {
        printf("ERROR: min_compact_encode (%d)\n", ret);
        goto exit;
    }

    /* Write compact output file */

    fwrite(compact, 1, compact_length, out);
    free(compact);

    ret = OK;
exit:
    fclose(out);

    return ret;
}

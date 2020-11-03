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

    FILE *in;

    if (argc < 2) {
        printf("usage: %s minutiaes.ist\n", argv[0]);
        return -1;
    }

    in = fopen(argv[1], "rb");
    if (!in) {
        printf("ERROR fopen\n");
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
    }
    pts_print(pts, pts_count);

    free(pts);
    free(minutiaes);
    return 0;
}

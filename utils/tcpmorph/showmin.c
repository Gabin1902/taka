#include "libmin.h"

int main(int argc, char *argv[])
{
    int ret;
    FILE *file;
    uint8_t buf[8192];

    if (argc < 2) {
        printf("usage: %s file.min\n", argv[0]);
        exit(1);
    }

    file = fopen(argv[1], "r");
    if (!file) {
        printf("Cant open file: %s\n", argv[1]);
        return 1;
    }

    ret = fread(buf, sizeof(uint8_t), sizeof(buf), file);
    if (ret > 0) {
        print_minuties(buf, ret);
    }

    fclose(file);

    return 0;
}

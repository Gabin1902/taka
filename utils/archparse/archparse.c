/* 2022 - LambdaConcept - po@lambdaconcept.com */

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "src/arch_decode.h"

/* IDEMIA */
static uint8_t idemia[] = {
    0x56, 0x61, 0x6c, 0x69, 0x64, 0x69, 0x74, 0xc3, 0xa9, 0x20, 0x41, 0x73,
    0x73, 0x75, 0x72, 0x61, 0x6e, 0x63, 0x65, 0x20, 0x6d, 0x61, 0x6c, 0x61,
    0x64, 0x69, 0x65, 0x20, 0x3a, 0x0a, 0x44, 0xc3, 0xa9, 0x62, 0x75, 0x74,
    0x20, 0x3a, 0x20, 0x30, 0x31, 0x2f, 0x30, 0x37, 0x2f, 0x32, 0x30, 0x31,
    0x39, 0x0a, 0x46, 0x69, 0x6e, 0x20, 0x3a, 0x20, 0x33, 0x30, 0x2f, 0x30,
    0x36, 0x2f, 0x32, 0x30, 0x32, 0x32, 0x0a, 0x53, 0x74, 0x61, 0x74, 0x75,
    0x74, 0x20, 0x3a, 0x20, 0x28, 0x69, 0x76, 0x20, 0x3a, 0x20, 0x44, 0x38,
    0x34, 0x34, 0x43, 0x41, 0x30, 0x44, 0x30, 0x35, 0x44, 0x32, 0x42, 0x46,
    0x41, 0x31, 0x34, 0x35, 0x35, 0x42, 0x39, 0x37, 0x39, 0x34, 0x30, 0x32,
    0x34, 0x32, 0x36, 0x45, 0x38, 0x35, 0x20, 0x3b, 0x20, 0x63, 0x69, 0x70,
    0x68, 0x65, 0x72, 0x74, 0x65, 0x78, 0x74, 0x20, 0x3a, 0x20, 0x33, 0x36,
    0x45, 0x42, 0x37, 0x36, 0x42, 0x45, 0x42, 0x39, 0x42, 0x30, 0x42, 0x42,
    0x39, 0x32, 0x31, 0x38, 0x32, 0x36, 0x39, 0x46, 0x32, 0x34, 0x41, 0x36,
    0x45, 0x45, 0x37, 0x43, 0x36, 0x43, 0x29, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};
static size_t idemia_length = 223;

/* DERMALOG */
static uint8_t dermalog[] = {
    0x6e, 0x81, 0xda, 0x5f, 0x25, 0x03, 0x22, 0x06, 0x29, 0x5f, 0x24, 0x03,
    0x25, 0x06, 0x29, 0x53, 0x81, 0xa3, 0x56, 0x61, 0x6c, 0x69, 0x64, 0x69,
    0x74, 0xc3, 0xa9, 0x20, 0x41, 0x73, 0x73, 0x75, 0x72, 0x61, 0x6e, 0x63,
    0x65, 0x20, 0x6d, 0x61, 0x6c, 0x61, 0x64, 0x69, 0x65, 0x20, 0x3a, 0x0a,
    0x44, 0xc3, 0xa9, 0x62, 0x75, 0x74, 0x20, 0x3a, 0x20, 0x32, 0x39, 0x2f,
    0x30, 0x36, 0x2f, 0x32, 0x30, 0x32, 0x32, 0x0a, 0x46, 0x69, 0x6e, 0x20,
    0x3a, 0x20, 0x32, 0x39, 0x2f, 0x30, 0x36, 0x2f, 0x32, 0x30, 0x32, 0x35,
    0x0a, 0x53, 0x74, 0x61, 0x74, 0x75, 0x74, 0x20, 0x3a, 0x20, 0x28, 0x69,
    0x76, 0x20, 0x3a, 0x20, 0x35, 0x31, 0x39, 0x34, 0x32, 0x43, 0x37, 0x38,
    0x42, 0x42, 0x36, 0x41, 0x44, 0x36, 0x33, 0x39, 0x39, 0x36, 0x38, 0x44,
    0x34, 0x46, 0x39, 0x35, 0x44, 0x45, 0x30, 0x37, 0x34, 0x38, 0x32, 0x31,
    0x20, 0x3b, 0x20, 0x63, 0x69, 0x70, 0x68, 0x65, 0x72, 0x74, 0x65, 0x78,
    0x74, 0x20, 0x3a, 0x20, 0x30, 0x34, 0x44, 0x30, 0x32, 0x46, 0x30, 0x38,
    0x36, 0x33, 0x38, 0x43, 0x44, 0x30, 0x36, 0x39, 0x45, 0x45, 0x33, 0x31,
    0x44, 0x34, 0x45, 0x46, 0x31, 0x37, 0x43, 0x38, 0x41, 0x33, 0x34, 0x37,
    0x29, 0x7f, 0x3d, 0x25, 0x53, 0x10, 0x51, 0x94, 0x2c, 0x78, 0xbb, 0x6a,
    0xd6, 0x39, 0x96, 0x8d, 0x4f, 0x95, 0xde, 0x07, 0x48, 0x21, 0x5f, 0x3d,
    0x10, 0x04, 0xd0, 0x2f, 0x08, 0x63, 0x8c, 0xd0, 0x69, 0xee, 0x31, 0xd4,
    0xef, 0x17, 0xc8, 0xa3, 0x47, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00
};
static size_t dermalog_length = 231;

int main(int argc, char *argv[])
{
    int ret;
    struct arch_s sess;

    memset(&sess, 0, sizeof(struct arch_s));

    printf("Decoding Idemia:\n");
    ret = arch_parse_health_insurance(&sess, idemia, idemia_length);
    if (ret == OK) {
        ret = arch_update_health_insurance_eligibility(&sess);
    }

    printf("Decoding Dermalog:\n");
    ret = arch_parse_health_insurance(&sess, dermalog, dermalog_length);
    if (ret == OK) {
        ret = arch_update_health_insurance_eligibility(&sess);
    }

    return 0;
}

Taka Nuttx
==========

0. Install the build toolchain
------------------------------

Dependencies:
    arm-none-eabi-gcc
    kconfig-frontends
    asn1c

1. Clone the submodules
-----------------------

git submodule update --init --recursive

2. Install libcxx
-----------------

cd libcxx
./install.sh ../nuttx/
cd ..

cd nuttx/include/libcxx
sed -i 's/__libcpp_isinf/isinf/g' complex
sed -i 's/__libcpp_isnan/isnan/g' complex
cd ../../../

3. Configure Nuttx for the Taka board
-------------------------------------

cd nuttx
./tools/configure.sh taka:nsh
make context
cd ..

4. Build the application libraries
----------------------------------

cd apps/examples/taka/libecc
CC=arm-none-eabi-gcc CFLAGS="-mcpu=cortex-m7 -mthumb -mfpu=fpv5-d16 -mfloat-abi=hard -W -Werror -Wextra -Wall -Wunreachable-code -Wstrict-prototypes -Wundef -fno-strict-aliasing -fno-strength-reduce -fomit-frame-pointer -pedantic -fno-builtin -std=c99 -Ofast -ffreestanding -fno-builtin -nostdlib -DWORDSIZE=64 -DWITH_LIBECC_CONFIG_OVERRIDE -DWITH_CURVE_SECP256R1 -DWITH_HASH_SHA256 -DWITH_SIG_ECDSA" make build/libsign.a
cd ../../../../

cd apps/examples/taka/libpkcs7
CC=arm-none-eabi-gcc CFLAGS="-mcpu=cortex-m7 -mthumb -mfpu=fpv5-d16 -mfloat-abi=hard -W -Wextra -Wall -Wunreachable-code -Wstrict-prototypes -fno-strict-aliasing -fno-strength-reduce -fomit-frame-pointer -pedantic -fno-builtin -std=c99 -Ofast -ffreestanding -fno-builtin -D__NuttX__ -DCONFIG_LIBC_LOCALTIME -isystem ../../../../nuttx/include" make
cd ../../../../

5. Build Nuttx
--------------

cd nuttx
EXTRA_LIBS="$(realpath ../apps/examples/taka/libecc/build/libsign.a) $(realpath ../apps/examples/taka/libpkcs7/libpkcs7.a)" make -j

6. Program the device
---------------------

dfu-util -d 0483:df11 -a 0 -D nuttx.bin --dfuse-address 0x08000000

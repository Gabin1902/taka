Taka Nuttx
==========

0. Install the build toolchain
------------------------------

Dependencies:
    arm-none-eabi-gcc
    kconfig-frontends
    asn1c (Compile from latest git: https://github.com/vlm/asn1c.git)

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

Hardware Changelog
==================

R06
---

* Replace 3V3 and 5V regulators with available parts
* SAM not mounted
* NFC not mounted
* Increment GPIO revision straps: REV_[2:0] == '111' (PJ9/PK0/PK1)

R05
---

* Add GPIO revision straps: REV_[2:0] == '001' (PJ9/PK0/PK1)
* Replace battery charger chip (MCP73834T -> SGM41511)
    STAT1 -> BAT_PG (PI1)
    STAT2 -> BAT_STAT (PA15)
    BAT_I2C shared with LCD_I2C
* 5V regulator enabled via software (EN_5V on PC6)
* Reset for NFC and ETH controlled from software
    ETH_RST on PI14
    RSTPD_N on PI15

Changelog
=========

taka.1.00
---------

* Support for Dermalog ARCH & MOC

taka.0.98
---------

* Support for Taka hardware R05

taka.0.97
---------

* USB API: new command to get the board unique ID

taka.0.96
---------

* Ignore ARCH container error:
  When the ARCH container is not present or some information is missing,
  consider the user as not eligible and continue the authentication process.

taka.0.95
---------

* Discard type 0 minutiaes:
  This function checks the ratio type0/all and rejects the point set
  when ratio is too high. With fingerjet lib, a high count of points
  or a high ratio means the finger is not well pressed on the sensor.

taka.0.94
---------

* Ignore ICAO non readable containers:
  Some cards are not provisioned with DG13 container. Ignore this error
  as this file is not mandatory.

* Change the morphing matrix to match the deformation from the tablet.

* Compute minutiaes barycenter for better finger positioning.

taka.0.93
---------

* Change the minutiae score system:
  Before being submitted to the card, requires at least 20 points
  with quality 70, and send up to 35 points maximum.

* Allow multiple tries without removing the card.

taka.0.92
---------

* Rework the error reporting system.

* Passive authentication: fix signature padding length.

taka.0.91
---------

* Implement smartcard passive authentication.

taka.0.90
---------

* Taka application: first version.

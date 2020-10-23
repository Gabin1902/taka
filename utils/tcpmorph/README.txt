Build:

make

================================================================================

Host PC should have IP 192.168.0.123

./tcpcam_morph

================================================================================

Program Taka with the debug binary

dfu-util -d 0483:df11 -a 0 -D nuttx.bin --dfuse-address 0x08000000

================================================================================

Connect Taka with Ethernet cable.

Nuttx obtains IP via DHCP and connects to TCP 192.168.0.123:1234

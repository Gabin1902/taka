(Linux) Install Udev rules
==========================

Write the rule in:

/etc/udev/rules.d/45-stdfu-permissions.rules
--------------------------------------------
ACTION=="add", SUBSYSTEM=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="df11", MODE="0664", GROUP="plugdev"
--------------------------------------------

Reload the rules:

# udevadm control --reload-rules && udevadm trigger

(Windows) Install WinUSB driver
===============================

https://zadig.akeo.ie/

Assign "WinUSB" driver to the device.

Run the HTTP server for testing
===============================

$ python3 -m http.server

In a Web browser (Chrome), connect to:

http://127.0.0.1:8000/

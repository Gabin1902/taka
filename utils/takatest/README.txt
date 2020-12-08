Install Udev rules
==================

Write the rule in:

/etc/udev/rules.d/52-taka.rules
-------------------------------
ACTION=="add", SUBSYSTEM=="usb", ATTRS{idVendor}=="ffff", ATTRS{idProduct}=="1234", MODE="0664", GROUP="plugdev"
-------------------------------

Reload the rules:

# udevadm control --reload-rules && udevadm trigger

Run the HTTP server for testing
===============================

$ python3 -m http.server

In a Web browser (Chrome), connect to:

http://127.0.0.1:8000/

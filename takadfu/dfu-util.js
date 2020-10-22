var device = null;
(function() {
    'use strict';

    function hex4(n) {
        let s = n.toString(16)
        while (s.length < 4) {
            s = '0' + s;
        }
        return s;
    }

    function hexAddr8(n) {
        let s = n.toString(16)
        while (s.length < 8) {
            s = '0' + s;
        }
        return "0x" + s;
    }

    function niceSize(n) {
        const gigabyte = 1024 * 1024 * 1024;
        const megabyte = 1024 * 1024;
        const kilobyte = 1024;
        if (n >= gigabyte) {
            return n / gigabyte + "GiB";
        } else if (n >= megabyte) {
            return n / megabyte + "MiB";
        } else if (n >= kilobyte) {
            return n / kilobyte + "KiB";
        } else {
            return n + "B";
        }
    }

    function formatDFUSummary(device) {
        const vid = hex4(device.device_.vendorId);
        const pid = hex4(device.device_.productId);
        const name = device.device_.productName;

        let mode = "Unknown"
        if (device.settings.alternate.interfaceProtocol == 0x01) {
            mode = "Runtime";
        } else if (device.settings.alternate.interfaceProtocol == 0x02) {
            mode = "DFU";
        }

        const cfg = device.settings.configuration.configurationValue;
        const intf = device.settings["interface"].interfaceNumber;
        const alt = device.settings.alternate.alternateSetting;
        const serial = device.device_.serialNumber;
        let info = `${mode}: [${vid}:${pid}] cfg=${cfg}, intf=${intf}, alt=${alt}, name="${name}" serial="${serial}"`;
        return info;
    }

    async function fixInterfaceNames(device_, interfaces) {
        // Check if any interface names were not read correctly
        if (interfaces.some(intf => (intf.name == null))) {
            // Manually retrieve the interface name string descriptors
            let tempDevice = new dfu.Device(device_, interfaces[0]);
            await tempDevice.device_.open();
            await tempDevice.device_.selectConfiguration(1);
            let mapping = await tempDevice.readInterfaceNames();
            await tempDevice.close();

            for (let intf of interfaces) {
                if (intf.name === null) {
                    let configIndex = intf.configuration.configurationValue;
                    let intfNumber = intf["interface"].interfaceNumber;
                    let alt = intf.alternate.alternateSetting;
                    intf.name = mapping[configIndex][intfNumber][alt];
                }
            }
        }
    }

    function getDFUDescriptorProperties(device) {
        // Attempt to read the DFU functional descriptor
        // TODO: read the selected configuration's descriptor
        return device.readConfigurationDescriptor(0).then(
            data => {
                let configDesc = dfu.parseConfigurationDescriptor(data);
                let funcDesc = null;
                let configValue = device.settings.configuration.configurationValue;
                if (configDesc.bConfigurationValue == configValue) {
                    for (let desc of configDesc.descriptors) {
                        if (desc.bDescriptorType == 0x21 && desc.hasOwnProperty("bcdDFUVersion")) {
                            funcDesc = desc;
                            break;
                        }
                    }
                }

                if (funcDesc) {
                    return {
                        WillDetach:            ((funcDesc.bmAttributes & 0x08) != 0),
                        ManifestationTolerant: ((funcDesc.bmAttributes & 0x04) != 0),
                        CanUpload:             ((funcDesc.bmAttributes & 0x02) != 0),
                        CanDnload:             ((funcDesc.bmAttributes & 0x01) != 0),
                        TransferSize:          funcDesc.wTransferSize,
                        DetachTimeOut:         funcDesc.wDetachTimeOut,
                        DFUVersion:            funcDesc.bcdDFUVersion
                    };
                } else {
                    return {};
                }
            },
            error => {}
        );
    }

    // Current log div element to append to
    let logContext = null;

    function setLogContext(div) {
        logContext = div;
    }

    function clearLog(context) {
        if (typeof context === 'undefined') {
            context = logContext;
        }
        if (context) {
            context.innerHTML = "";
        }
    }

    function logDebug(msg) {
    }

    function logInfo(msg) {
        if (logContext) {
            let info = document.createElement("p");
            info.className = "info";
            info.textContent = msg;
            logContext.appendChild(info);
        }
    }

    function logWarning(msg) {
        if (logContext) {
            let warning = document.createElement("p");
            warning.className = "warning";
            warning.textContent = msg;
            logContext.appendChild(warning);
        }
    }

    function logError(msg) {
        if (logContext) {
            let error = document.createElement("p");
            error.className = "error";
            error.textContent = msg;
            logContext.appendChild(error);
        }
    }

    function logProgress(done, total) {
        if (logContext) {
            let progressBar;
            if (logContext.lastChild.tagName.toLowerCase() == "progress") {
                progressBar = logContext.lastChild;
            }
            if (!progressBar) {
                progressBar = document.createElement("progress");
                logContext.appendChild(progressBar);
            }
            progressBar.value = done;
            if (typeof total !== 'undefined') {
                progressBar.max = total;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', event => {
        let connectButton = document.querySelector("#connect");
        let downloadButton = document.querySelector("#download");
        let statusDisplay = document.querySelector("#status");
        let infoDisplay = document.querySelector("#usbInfo");
        let dfuDisplay = document.querySelector("#dfuInfo");
        let displayOn = document.querySelector("#displayOn");

        let configForm = document.querySelector("#configForm");

        let transferSize = 1024;

        let firmwareFileField = document.querySelector("#firmwareFile");
        let firmwareFile = null;

        let downloadLog = document.querySelector("#downloadLog");
        let uploadLog = document.querySelector("#uploadLog");

        let manifestationTolerant = true;

        function onDisconnect(reason, success) {
            if (reason) {
                statusDisplay.textContent = reason;
                console.log(success);
                if (success) {
                    statusDisplay.className = "success";
                } else {
                    statusDisplay.className = "error";
                }
            }

            connectButton.textContent = "Connect";
            infoDisplay.textContent = "";
            dfuDisplay.textContent = "";
            displayOn.style.display = "none";
            downloadButton.disabled = true;
            firmwareFileField.disabled = true;
        }

        function onUnexpectedDisconnect(event) {
            if (device !== null && device.device_ !== null) {
                if (device.device_ === event.device) {
                    device.disconnected = true;
                    onDisconnect("Device disconnected");
                    device = null;
                }
            }
        }

        async function connect(device) {
            try {
                await device.open();
            } catch (error) {
                onDisconnect(error);
                throw error;
            }

            // Attempt to parse the DFU functional descriptor
            let desc = {};
            try {
                desc = await getDFUDescriptorProperties(device);
            } catch (error) {
                onDisconnect(error);
                throw error;
            }

            let memorySummary = "";
            if (desc && Object.keys(desc).length > 0) {
                device.properties = desc;
                let info = `WillDetach=${desc.WillDetach}, ManifestationTolerant=${desc.ManifestationTolerant}, CanUpload=${desc.CanUpload}, CanDnload=${desc.CanDnload}, TransferSize=${desc.TransferSize}, DetachTimeOut=${desc.DetachTimeOut}, Version=${hex4(desc.DFUVersion)}`;
                transferSize = desc.TransferSize;
                if (desc.CanDnload) {
                    manifestationTolerant = desc.ManifestationTolerant;
                }

                if (desc.DFUVersion == 0x011a && device.settings.alternate.interfaceProtocol == 0x02) {
                    device = new dfuse.Device(device.device_, device.settings);
                    if (device.memoryInfo) {
                        let totalSize = 0;
                        for (let segment of device.memoryInfo.segments) {
                            totalSize += segment.end - segment.start;
                        }
                        memorySummary = `Selected memory region: ${device.memoryInfo.name} (${niceSize(totalSize)})`;
                        for (let segment of device.memoryInfo.segments) {
                            let properties = [];
                            if (segment.readable) {
                                properties.push("readable");
                            }
                            if (segment.erasable) {
                                properties.push("erasable");
                            }
                            if (segment.writable) {
                                properties.push("writable");
                            }
                            let propertySummary = properties.join(", ");
                            if (!propertySummary) {
                                propertySummary = "inaccessible";
                            }

                            memorySummary += `\n${hexAddr8(segment.start)}-${hexAddr8(segment.end-1)} (${propertySummary})`;
                        }
                    }
                }
            }

            // Bind logging methods
            device.logDebug = logDebug;
            device.logInfo = logInfo;
            device.logWarning = logWarning;
            device.logError = logError;
            device.logProgress = logProgress;

            // Clear logs
            clearLog(uploadLog);
            clearLog(downloadLog);

            // Display basic USB information
            statusDisplay.textContent = '';
            statusDisplay.className = "";
            connectButton.textContent = 'Disconnect';
            infoDisplay.textContent = (
                "Name: " + device.device_.productName + "\n" +
                "MFG: " + device.device_.manufacturerName + "\n" +
                "Serial: " + device.device_.serialNumber + "\n"
            );

            // Display basic dfu-util style info
            dfuDisplay.textContent = formatDFUSummary(device) + "\n" + memorySummary;
            displayOn.style.display = "block";

            // Update buttons based on capabilities
            if (device.settings.alternate.interfaceProtocol == 0x01) {
                // Runtime
                downloadButton.disabled = true;
                firmwareFileField.disabled = true;
            } else {
                // DFU
                downloadButton.disabled = false;
                firmwareFileField.disabled = false;
            }

            if (device.memoryInfo) {
                let segment = device.getFirstWritableSegment();
                if (segment) {
                    device.startAddress = segment.start;
                }
            }

            return device;
        }

        connectButton.addEventListener('click', function() {
            if (device) {
                device.close().then(onDisconnect);
                device = null;
            } else {
                let filters = [{ 'vendorId': 0x0483, 'productId': 0xdf11 }];
                navigator.usb.requestDevice({ 'filters': filters }).then(
                    async selectedDevice => {
                        let interfaces = dfu.findDeviceDfuInterfaces(selectedDevice);
                        if (interfaces.length == 0) {
                            console.log(selectedDevice);
                            statusDisplay.textContent = "The selected device does not have any USB DFU interfaces.";
                            statusDisplay.className = "error";
                            return false;
                        }

                        await fixInterfaceNames(selectedDevice, interfaces);
                        let choice = null;
                        for (let intf of interfaces) {
                            if (intf.alternate.alternateSetting == 0) {
                                choice = intf;
                                break;
                            }
                        }
                        if (!choice) {
                            console.log("Alt==0 not found");
                            statusDisplay.textContent = "The selected device does not have Alt==0 interface";
                            statusDisplay.className = "error";
                            return false;
                        }

                        device = await connect(new dfu.Device(selectedDevice, choice));
                    }
                ).catch(error => {
                    statusDisplay.textContent = error;
                    statusDisplay.className = "error";
                });
            }
        });

        firmwareFileField.addEventListener("change", function() {
            firmwareFile = null;
            if (firmwareFileField.files.length > 0) {
                let file = firmwareFileField.files[0];
                let reader = new FileReader();
                reader.onload = function() {
                    firmwareFile = reader.result;
                };
                reader.readAsArrayBuffer(file);
            }
        });

        downloadButton.addEventListener('click', async function(event) {
            event.preventDefault();
            event.stopPropagation();
            if (!configForm.checkValidity()) {
                configForm.reportValidity();
                return false;
            }

            if (device && firmwareFile != null) {
                setLogContext(downloadLog);
                clearLog(downloadLog);
                try {
                    let status = await device.getStatus();
                    if (status.state == dfu.dfuERROR) {
                        await device.clearStatus();
                    }
                } catch (error) {
                    device.logWarning("Failed to clear status");
                }
                await device.do_download(transferSize, firmwareFile).then(
                    () => {
                        setLogContext(null);
                        manifestationTolerant = false;
                        if (!manifestationTolerant) {
                            device.waitDisconnected(5000).then(
                                dev => {
                                    onDisconnect("Flash Firmware successful!", true);
                                    device = null;
                                },
                                error => {
                                    // It didn't reset and disconnect for some reason...
                                    console.log("Device unexpectedly tolerated manifestation.");
                                }
                            );
                        }
                    },
                    error => {
                        logError(error);
                        setLogContext(null);
                    }
                )
            }
        });

        // Check if WebUSB is available
        if (typeof navigator.usb !== 'undefined') {
            navigator.usb.addEventListener("disconnect", onUnexpectedDisconnect);
        } else {
            statusDisplay.textContent = 'WebUSB not available.'
            statusDisplay.className = "error";
            connectButton.disabled = true;
        }
        displayOn.style.display = "none";
    });
})();

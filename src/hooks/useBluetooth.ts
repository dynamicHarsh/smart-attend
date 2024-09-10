import { useState, useEffect } from 'react';

const useBluetooth = () => {
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startAdvertising = async () => {
    if (!('bluetooth' in navigator)) {
      setError('Web Bluetooth API is not available.');
      return;
    }

    try {
      // Start broadcasting as a beacon (if supported)
      if ('getAvailability' in navigator.bluetooth && await navigator.bluetooth.getAvailability()) {
        try {
          // @ts-ignore: Typescript doesn't know about the Bluetooth.Broadcaster API yet
          const broadcaster = new navigator.bluetooth.Broadcaster();
          await broadcaster.startAdvertising({
            name: 'TeacherDevice',
            manufacturerData: [{ companyIdentifier: 0xFFFE, data: new Uint8Array([0x00, 0x01, 0x02, 0x03]) }],
          });
          console.log('Started advertising as a Bluetooth beacon');
        } catch (err) {
          console.warn('Bluetooth broadcasting not supported. Falling back to proximity mode.');
        }
      }

      // Fallback to proximity mode if broadcasting is not supported
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // This is just an example service
      });

      setDeviceId(device.id);
      setIsAdvertising(true);
      setError(null);
    } catch (err) {
      setError('Failed to start Bluetooth advertising: ' + (err as Error).message);
    }
  };

  const stopAdvertising = async () => {
    if ('bluetooth' in navigator) {
      try {
        // Stop broadcasting (if it was started)
        // @ts-ignore: Typescript doesn't know about the Bluetooth.Broadcaster API yet
        if ('Broadcaster' in navigator.bluetooth) {
          const broadcaster = new navigator.bluetooth.Broadcaster();
          await broadcaster.stopAdvertising();
        }
      } catch (err) {
        console.error('Error stopping Bluetooth operations:', err);
      }
    }
    setIsAdvertising(false);
    setDeviceId('');
  };

  useEffect(() => {
    return () => {
      if (isAdvertising) {
        stopAdvertising();
      }
    };
  }, [isAdvertising]);

  return { isAdvertising, deviceId, error, startAdvertising, stopAdvertising };
};

export default useBluetooth;
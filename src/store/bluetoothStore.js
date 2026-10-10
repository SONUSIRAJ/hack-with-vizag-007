import { create } from 'zustand';

export const useBluetoothStore = create((set, get) => ({
  device: null,
  isConnected: false,
  isConnecting: false,
  distanceWalked: 0,
  speed: 0,
  error: null,

  connectToWatch: async () => {
    if (!navigator.bluetooth) {
      set({ error: "Web Bluetooth API is not available in this browser." });
      return;
    }

    set({ isConnecting: true, error: null });
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['running_speed_and_cadence', 'battery_service', 'device_information']
      });

      const server = await device.gatt.connect();
      device.addEventListener('gattserverdisconnected', get().onDisconnected);

      try {
        const service = await server.getPrimaryService('running_speed_and_cadence');
        const characteristic = await service.getCharacteristic('rsc_measurement');

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', get().handleRscMeasurement);
      } catch (err) {
        console.warn("RSC Service not found on this device, or lacks permissions.", err);
        // We still consider it connected, but we might not get distance data.
      }

      set({ 
        device, 
        isConnected: true, 
        isConnecting: false,
        error: null 
      });

    } catch (error) {
      console.error("Bluetooth Connection Error:", error);
      set({ error: error.message, isConnecting: false });
    }
  },

  handleRscMeasurement: (event) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const speedRaw = value.getUint16(1, true);
    const speedMs = speedRaw / 256.0; 
    
    let offset = 4; // flags(1) + speed(2) + cadence(1)
    let newDistance = get().distanceWalked;

    if ((flags & 0x02) !== 0) { // Stride Length present
        offset += 2;
    }

    if ((flags & 0x04) !== 0) { // Total Distance present
        const distanceRaw = value.getUint32(offset, true);
        newDistance = distanceRaw / 10.0; // In meters
    }

    set({ speed: speedMs.toFixed(2), distanceWalked: newDistance });
  },

  onDisconnected: () => {
    set({ isConnected: false, device: null, speed: 0 });
  },

  disconnect: () => {
    const { device } = get();
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    set({ isConnected: false, device: null, distanceWalked: 0, speed: 0 });
  }
}));

import { BleManager } from 'react-native-ble-plx';

export const bleManager = new BleManager();

export const writeByteCharacteristic = async (
	id: string, serviceUUID:
		string, charUUID: string,
	byte: number
) => {
	try {
		const binaryString = String.fromCharCode(byte & 0xff);
		const base64Value = btoa(binaryString);
		await bleManager.writeCharacteristicWithResponseForDevice(id, serviceUUID, charUUID, base64Value);
	} catch (error) {
		console.error("Error:", error);
	}
};

export const readCharacteristic = async (
	id: string,
	serviceUUID: string,
	charUUID: string
): Promise<DataView | null> => {
	try {
		const characteristic = await bleManager.readCharacteristicForDevice(id, serviceUUID, charUUID);

		if (!characteristic.value) return null;

		const binaryString = atob(characteristic.value);
		const buffer = new ArrayBuffer(binaryString.length);
		const bytes = new Uint8Array(buffer);

		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		return new DataView(buffer);
	} catch (error) {
		console.error("Read characteristic error:", error);
		return null;
	}
};

export const readInt32Characteristic = async (
	id: string,
	serviceUUID: string,
	charUUID: string,
	isLittleEndian: boolean = true
): Promise<number | null> => {
	const dataView = await readCharacteristic(id, serviceUUID, charUUID);

	if (!dataView || dataView.byteLength < 4) {
		return null;
	}

	return dataView.getInt32(0, isLittleEndian);
};

export const readByteCharacteristic = async (
	id: string,
	serviceUUID: string,
	charUUID: string,
): Promise<number | null> => {
	const dataView = await readCharacteristic(id, serviceUUID, charUUID);

	if (!dataView || dataView.byteLength != 1) {
		return null;
	}

	return dataView.getUint8(0);
};

export const subscribeToCharacteristic = (
	id: string,
	serviceUUID: string,
	charUUID: string,
	listener: (data: DataView) => void,
) => {
	const subscription = bleManager.monitorCharacteristicForDevice(
		id,
		serviceUUID,
		charUUID,
		(error, characteristic) => {
			if (error) {
				console.error("Monitor error:", error);
				return;
			}

			if (characteristic?.value) {
				const binaryString = atob(characteristic.value);

				const buffer = new ArrayBuffer(binaryString.length);
				const bytes = new Uint8Array(buffer);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				listener(new DataView(buffer));
			}
		}
	);

	return subscription;
};

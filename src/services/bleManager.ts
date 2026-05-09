import { BleErrorCode, BleManager } from 'react-native-ble-plx';

const VALID_RANGE_DESCRIPTOR_UUID = "00002906-0000-1000-8000-00805f9b34fb";

export const bleManager = new BleManager();

export interface ValidRange {
	lower: number;
	upper: number;
};

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

export const readByteCharacteristics = async (
	id: string,
	serviceUUID: string,
	charUUIDs: string[],
): Promise<(number | null)[]> => {
	const values: ((number | null)[]) = [];
	for (const charUUID of charUUIDs) {
		const dataView = await readCharacteristic(id, serviceUUID, charUUID);
		if (!dataView || dataView.byteLength != 1) {
			values.push(null);
			continue;
		}
		values.push(dataView.getUint8(0));
	}

	return values;
};

export const readByteCharacteristic = async (
	id: string,
	serviceUUID: string,
	charUUID: string,
): Promise<number | null> => {
	const values = await readByteCharacteristics(id, serviceUUID, [charUUID]);
	return values[0];
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
				if (
					error.errorCode !== BleErrorCode.OperationCancelled &&
					error.errorCode !== BleErrorCode.DeviceDisconnected
				) {
					console.error("Monitor error:", error);
				}
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

export const readValidRange = async (
    id: string,
    serviceUUID: string,
    charUUID: string,
	isLittleEndian: boolean = true
): Promise<ValidRange | null> => {
    try {
        const descriptor = await bleManager.readDescriptorForDevice(
            id,
            serviceUUID,
            charUUID,
            VALID_RANGE_DESCRIPTOR_UUID
        );

        if (!descriptor.value) return null;

        const binaryString = atob(descriptor.value);
        const buffer = new ArrayBuffer(binaryString.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const dataView = new DataView(buffer);
		const fieldSize = buffer.byteLength / 2;

        let lower: number, upper: number;

		switch (fieldSize) {
			case 1:
				lower = dataView.getUint8(0);
				upper = dataView.getUint8(1);
				break;
			case 2:
				lower = dataView.getUint16(0, isLittleEndian);
				upper = dataView.getUint16(2, isLittleEndian);
				break;
			case 4:
				lower = dataView.getUint32(0, isLittleEndian);
				upper = dataView.getUint32(4, isLittleEndian);
				break;
			default:
				throw new Error(`Unsupported field size: ${fieldSize} bytes`);
		}

		return { lower, upper };
    } catch (error) {
        console.error("Read descriptor error:", error);
        return null;
    }
};

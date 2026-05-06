import CustomButton from "@/components/ui/CustomButton";
import {
	ValidRange,
	bleManager,
	readByteCharacteristic,
	readValidRange,
	subscribeToCharacteristic,
	writeByteCharacteristic,
} from "@/services/bleManager";
import { globalStyles } from "@/styles/global";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const SERVICE_UUID = "9e45d7ad-5ac2-4bcc-a5fb-8b4d9e798ec5"
const BRIGHTNESS_CHARACTERISTIC_UUID = "3849a9a4-34e8-444d-869d-37be462f3875"
const LED_PATTERN_CHARACTERISTIC_UUID = "928047fc-0b28-40c1-a328-0fe265cd0643";
const BATTERY_VOLTAGE_CHARACTERISTIC_UUID = "b7ce738e-4a4e-4784-864e-a1e2b6b7b780";
const BATTERY_CURRENT_CHARACTERISTIC_UUID = "26f4f771-6e4b-4751-be3b-494c5e09d724";
const BATTERY_CHARGE_CHARACTERISTIC_UUID = "fdb4779e-cde9-4a6e-b739-cf485c23dd07";

type DeviceScreenParams = {
	deviceId: string;
	name: string;
};

export default function DeviceScreen() {
	const { deviceId, name } = useLocalSearchParams<DeviceScreenParams>();
	const [brightness, setBrightness] = useState<number | null>(null);
	const [ledPattern, setLedPattern] = useState<number | null>(null);

	const [brightnessValidRange, setBrightnessValidRange] = useState<ValidRange | null>(null);
	const [ledPatternValidRange, setLedPatternValidRange] = useState<ValidRange | null>(null);

	const [batteryVoltage, setBatteryVoltage] = useState("Loading...");
	const [batteryCurrent, setBatteryCurrent] = useState("Loading...");
	const [batteryCharge, setBatteryCharge] = useState("Loading...");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const currentBrightness = await readByteCharacteristic(
					deviceId,
					SERVICE_UUID,
					BRIGHTNESS_CHARACTERISTIC_UUID
				) ?? 0;
				setBrightness(currentBrightness);

				const currentLedPattern = await readByteCharacteristic(
					deviceId,
					SERVICE_UUID,
					LED_PATTERN_CHARACTERISTIC_UUID
				) ?? 0;
				setLedPattern(currentLedPattern);

				subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_VOLTAGE_CHARACTERISTIC_UUID,
					(data: DataView) => {
						const voltage = data.getUint32(0, true);
						setBatteryVoltage(`${voltage}mV`);
					},
				);

				subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_CURRENT_CHARACTERISTIC_UUID,
					(data: DataView) => {
						const current = data.getInt32(0, true);
						setBatteryCurrent(`${current}mA`);
					},
				);

				subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_CHARGE_CHARACTERISTIC_UUID,
					(data: DataView) => {
						const charge = data.getUint32(0, true);
						setBatteryCharge(`${charge}%`);
					},
				);

				const brightnessValidRange = await readValidRange(
					deviceId,
					SERVICE_UUID,
					BRIGHTNESS_CHARACTERISTIC_UUID
				);
				setBrightnessValidRange(brightnessValidRange);

				const ledPatternValidRange = await readValidRange(
					deviceId,
					SERVICE_UUID,
					LED_PATTERN_CHARACTERISTIC_UUID
				);
				setLedPatternValidRange(ledPatternValidRange);
			} catch (error) {
				console.error(error);
			}
		};
		fetchData();

		return () => { bleManager.cancelDeviceConnection(deviceId) };
	}, []);

	const getValueInRange = (value: number, validRange: ValidRange) => {
		if (validRange.lower > value) return validRange.lower;
		if (validRange.upper < value) return validRange.upper;
		return value;
	};

	const updateBrightness = (value: number) => {
		if (!brightnessValidRange) {
			return;
		}

		value = getValueInRange(value, brightnessValidRange);
		if (value === brightness) {
			return;
		}

		setBrightness(value);
		writeByteCharacteristic(deviceId, SERVICE_UUID, BRIGHTNESS_CHARACTERISTIC_UUID, value);
	};

	const updateLedPattern = (value: number) => {
		if (!ledPatternValidRange) {
			return;
		}

		value = getValueInRange(value, ledPatternValidRange);
		if (value === ledPattern) {
			return;
		}

		setLedPattern(value);
		writeByteCharacteristic(deviceId, SERVICE_UUID, LED_PATTERN_CHARACTERISTIC_UUID, value);
	};

	return (
		<>
			<Stack.Screen options={{
				title: name,
			}} />
			<View style={globalStyles.container}>
				<View style={styles.batteryStats}>
					<Text style={styles.text}>{`VOLTAGE: ${batteryVoltage}`}</Text>
					<Text style={styles.text}>{`CURRENT: ${batteryCurrent}`}</Text>
					<Text style={styles.text}>{`CHARGE: ${batteryCharge}`}</Text>
				</View>
				<View style={styles.row}>
					<CustomButton title="-" onPress={() => updateBrightness(brightness - 10)} />
					<Text style={styles.text}>{`BRIGHTNESS: ${brightness ?? "Loading..."}`}</Text>
					<CustomButton title="+" onPress={() => updateBrightness(brightness + 10)} />
				</View>
				<View style={styles.row}>
					<CustomButton title="<" onPress={() => updateLedPattern(ledPattern - 1)} />
					<Text style={styles.text}>{`LED PATTERN: ${ledPattern ?? "Loading..."}`}</Text>
					<CustomButton title=">" onPress={() => updateLedPattern(ledPattern + 1)} />
				</View>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		margin: 5,
	},
	text: {
		fontSize: 18,
		fontWeight: "bold",
	},
	batteryStats: {
		alignItems: "center",
		margin: 10,
	},
});

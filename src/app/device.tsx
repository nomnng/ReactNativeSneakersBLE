import CustomButton from "@/components/ui/CustomButton";
import {
	ValidRange,
	bleManager,
	readByteCharacteristics,
	readValidRange,
	subscribeToCharacteristic,
	writeByteCharacteristic,
} from "@/services/bleManager";
import { globalStyles } from "@/styles/global";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

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
	const router = useRouter();
	const { deviceId, name } = useLocalSearchParams<DeviceScreenParams>();
	const [brightness, setBrightness] = useState<number | null>(null);
	const [ledPattern, setLedPattern] = useState<number | null>(null);

	const [brightnessValidRange, setBrightnessValidRange] = useState<ValidRange | null>(null);
	const [ledPatternValidRange, setLedPatternValidRange] = useState<ValidRange | null>(null);

	const [batteryVoltage, setBatteryVoltage] = useState("Loading...");
	const [batteryCurrent, setBatteryCurrent] = useState("Loading...");
	const [batteryCharge, setBatteryCharge] = useState("Loading...");

	useEffect(() => {
		const subscriptions: any[] = [];

		const fetchData = async () => {
			try {
				const [currentBrightness, currentLedPattern] = await readByteCharacteristics(
					deviceId,
					SERVICE_UUID,
					[BRIGHTNESS_CHARACTERISTIC_UUID, LED_PATTERN_CHARACTERISTIC_UUID]
				);
				setBrightness(currentBrightness);
				setLedPattern(currentLedPattern);

				const batteryVoltageSubscription = subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_VOLTAGE_CHARACTERISTIC_UUID,
					(data: DataView) => {
						console.log("BATTERY VOLTAGE CALLBACK");
						const voltage = data.getUint32(0, true);
						setBatteryVoltage(`${voltage}mV`);
					},
				);
				subscriptions.push(batteryVoltageSubscription);

				const batteryCurrentSubscription = subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_CURRENT_CHARACTERISTIC_UUID,
					(data: DataView) => {
						const current = data.getInt32(0, true);
						setBatteryCurrent(`${current}mA`);
					},
				);
				subscriptions.push(batteryCurrentSubscription);

				const batteryChargeSubscription = subscribeToCharacteristic(
					deviceId,
					SERVICE_UUID,
					BATTERY_CHARGE_CHARACTERISTIC_UUID,
					(data: DataView) => {
						const charge = data.getUint32(0, true);
						setBatteryCharge(`${charge}%`);
					},
				);
				subscriptions.push(batteryChargeSubscription);

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

		const disconnectSubscription = bleManager.onDeviceDisconnected(
			deviceId,
			(error, device) => {
				if (error) {
					console.log("Device disconnected with error:", error.message);
				}

				Alert.alert(
					"Device disconnected",
					"Connection was lost."
				);
				router.back();
			}
		);

		return () => {
			disconnectSubscription.remove();
			subscriptions.forEach(s => s?.remove());
			bleManager.cancelDeviceConnection(deviceId).catch((error) => {
				// in case device was already disconnected
			});
		};
	}, []);

	const getValueInRange = (value: number, validRange: ValidRange) => {
		if (validRange.lower > value) return validRange.lower;
		if (validRange.upper < value) return validRange.upper;
		return value;
	};

	const updateBrightness = (diff: number) => {
		if (!brightnessValidRange || brightness === null) {
			return;
		}

		let value = getValueInRange(brightness + diff, brightnessValidRange);
		if (value === brightness) {
			return;
		}

		setBrightness(value);
		writeByteCharacteristic(deviceId, SERVICE_UUID, BRIGHTNESS_CHARACTERISTIC_UUID, value);
	};

	const updateLedPattern = (diff: number) => {
		if (!ledPatternValidRange || ledPattern === null) {
			return;
		}

		let value = getValueInRange(ledPattern + diff, ledPatternValidRange);
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
					<CustomButton
						title="-"
						disabled={brightness === brightnessValidRange?.lower || !brightnessValidRange}
						onPress={() => updateBrightness(-10)}
					/>
					<Text style={styles.text}>{`BRIGHTNESS: ${brightness ?? "Loading..."}`}</Text>
					<CustomButton
						title="+"
						disabled={brightness === brightnessValidRange?.upper || !brightnessValidRange}
						onPress={() => updateBrightness(10)}
					/>
				</View>
				<View style={styles.row}>
					<CustomButton
						title="<"
						disabled={ledPattern === ledPatternValidRange?.lower || !ledPatternValidRange}
						onPress={() => updateLedPattern(-1)}
					/>
					<Text style={styles.text}>{`LED PATTERN: ${ledPattern ?? "Loading..."}`}</Text>
					<CustomButton
						title=">"
						disabled={ledPattern === ledPatternValidRange?.upper || !ledPatternValidRange}
						onPress={() => updateLedPattern(1)}
					/>
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

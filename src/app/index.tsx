import CustomButton from "@/components/ui/CustomButton";
import { bleManager } from "@/services/bleManager";
import { globalStyles } from "@/styles/global";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Device } from "react-native-ble-plx";

export default function DeviceListScreen() {
	const [devices, setDevices] = useState<Device[]>([]);
	const [isScanning, setIsScanning] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const router = useRouter();

	const startScan = () => {
		setIsScanning(true);
		setDevices([]);

		bleManager.startDeviceScan(null, null, (error, device) => {
			if (error) {
				console.error(error);
				setIsScanning(false);
				return;
			}

			if (device && device.name) {
				setDevices((prevDevices) => {
					const exists = prevDevices.find((d) => d.id === device.id);
					if (!exists) {
						return [...prevDevices, device];
					}
					return prevDevices;
				});
			}
		});

		setTimeout(() => {
			bleManager.stopDeviceScan();
			setIsScanning(false);
		}, 10000);
	};

	useEffect(() => {
		return () => { bleManager.stopDeviceScan() };
	}, []);

	const scanButton = (
		<CustomButton
			title={isScanning ? "Scanning..." : "Scan"}
			onPress={startScan}
			disabled={isScanning}
		/>
	);

	const handleConnect = async (device: Device) => {
		setIsConnecting(true);
		try {
			bleManager.stopDeviceScan();

			const connectedDevice = await device.connect();
			await connectedDevice.discoverAllServicesAndCharacteristics();

			router.push({
				pathname: "/device",
				params: { deviceId: connectedDevice.id, name: connectedDevice.name }
			});
		} catch (error) {
			console.error("Connection failed", error);
		} finally {
			setIsConnecting(false);
		}
	};
	return (
		<>
			<Stack.Screen options={{
				title: "Device list",
				headerRight: () => scanButton,
			}}/>
			<View style={globalStyles.container}>
				<FlatList
					style={{flex: 1, backgroundColor: "#FFF", width: "100%"}}
					data={devices}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => (
						<TouchableOpacity style={styles.deviceItem} onPress={() => handleConnect(item)}>
							<Text style={styles.deviceName}>{item.name || "Unknown Device"}</Text>
							<Text style={styles.deviceId}>{item.id}</Text>
						</TouchableOpacity>
					)}
				/>
				{isConnecting && (
					<View style={styles.overlay}>
						<Text style={styles.loaderText}>Connecting...</Text>
					</View>
				)}
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	deviceItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
	deviceName: { fontSize: 16, fontWeight: "bold" },
	deviceId: { fontSize: 12, color: "#666" },
	overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,		
	},
    loaderText: {
    	color: "#3C8",
        fontSize: 32,
        fontWeight: '500',
    },	
});

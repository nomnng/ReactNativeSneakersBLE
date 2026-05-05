import { Text, View, Button, PermissionsAndroid, Platform } from "react-native";
import { useState, useEffect } from "react";
import { globalStyles } from "@/styles/global";
import { Stack } from "expo-router";

interface PermissionRequestProps {
	onPermissionsGranted: () => void;
};

const checkPermissions = async () => {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 31) {
        const results = await Promise.all([
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
        ]);
        return results.every(Boolean);
    } else {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
};

export default function PermissionRequest({onPermissionsGranted} : PermissionRequestProps) {
	useEffect(() => {
		const checkAsync = async () => {
			if (await checkPermissions()) {
				onPermissionsGranted();				
			}
		};

		checkAsync();
	}, []);

	const requestPermissions = async () => {
		if (Platform.OS === "android") {
			if (Platform.Version >= 31) {
				const result = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				]);
				
				const allGranted = Object.values(result).every(
					(res) => res === PermissionsAndroid.RESULTS.GRANTED
				);
				
				if (allGranted) {
					onPermissionsGranted();
				}
			} else {
				const granted = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
				);
				if (granted === PermissionsAndroid.RESULTS.GRANTED) {
					onPermissionsGranted();
				}
			}
		}
	};

	return (
		<>
			<View style={globalStyles.container}>
				<Button
					title="REQUEST PERMISSIONS"
					onPress={requestPermissions}
				/>
			</View>
		</>
	);
}

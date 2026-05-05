import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { colors, globalStyles } from "@/styles/global";
import { bleManager } from "@/services/bleManager";
import PermissionRequest from "@/components/PermissionRequest";

export default function RootLayout() {
	const [isBluetoothOn, setIsBluetoothOn] = useState(false);
	const [hasPermissions, setHasPermissions] = useState(false);

	useEffect(() => {
		const subscription = bleManager.onStateChange((state) => {
			if (state === "PoweredOn") {
				setIsBluetoothOn(true);
			} else {
				setIsBluetoothOn(false);
			}
		}, true);

		return () => {
			subscription.remove();
		};
	}, []);

	if (!hasPermissions) {
		return (
			<PermissionRequest
				onPermissionsGranted={() => setHasPermissions(true)}
			/>
		);
	}

	if (!isBluetoothOn) {
		return (
			<View style={globalStyles.container}>
				<Text style={{color: colors.text}}>Turn on bluetooth</Text>
			</View>
		);
	}

	return <Stack screenOptions={{
		headerStyle: {
			backgroundColor: colors.header,
		},
		headerTitleStyle: {
			color: colors.text,
		},
	}} />;
}
